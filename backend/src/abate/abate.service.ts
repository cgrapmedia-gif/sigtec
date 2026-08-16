import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoProposta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PdfService } from '../pdf/pdf.service';
import { analisarObsolescencia } from '../activos/obsolescencia';

@Injectable()
export class AbateService {
  constructor(private prisma: PrismaService, private auditoria: AuditoriaService, private pdf: PdfService) {}

  listarPropostas() {
    return this.prisma.propostaAbate.findMany({
      include: { activos: true, parecerPor: { select: { nome: true } }, auto: { include: { aprovadoPor: { select: { nome: true } } } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  listarAutos() {
    return this.prisma.autoAbate.findMany({
      include: { aprovadoPor: { select: { nome: true } }, proposta: { include: { activos: true, parecerPor: { select: { nome: true } } } } },
      orderBy: { data: 'desc' },
    });
  }

  /** Tecnico emite parecer e cria a proposta; Admin cria ja submetida (RF-ABT-03) */
  async criarProposta(dto: { activoIds: string[]; parecer: string; destino: string; sanitizacao: string }, user: { id: string; nome: string; perfil: string }) {
    const activos = await this.prisma.activo.findMany({ where: { id: { in: dto.activoIds } } });
    if (activos.length === 0) throw new BadRequestException('Indique pelo menos um equipamento.');
    const motivo = activos.map((a) => `${a.numInventario}: ${analisarObsolescencia(a).join('; ') || 'avaliação técnica'}`).join(' | ');
    const ano = new Date().getFullYear();
    const total = await this.prisma.propostaAbate.count();
    const numero = `PA-${ano}-${String(total + 3).padStart(3, '0')}`;
    const proposta = await this.prisma.propostaAbate.create({
      data: {
        numero, motivo, parecer: dto.parecer, parecerPorId: user.id,
        destino: dto.destino, sanitizacao: dto.sanitizacao,
        estado: user.perfil === 'ADMIN' ? EstadoProposta.AGUARDA_APROVACAO : EstadoProposta.COM_PARECER,
        activos: { connect: dto.activoIds.map((id) => ({ id })) },
      },
      include: { activos: true },
    });
    await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Criou a proposta de abate ${numero}` });
    return proposta;
  }

  async submeterDireccao(id: string, user: { nome: string; perfil: string }) {
    const p = await this.prisma.propostaAbate.update({ where: { id }, data: { estado: EstadoProposta.AGUARDA_APROVACAO } });
    await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Submeteu a proposta ${p.numero} à Direcção` });
    return p;
  }

  /** Direccao aprova: emite AutoAbate numerado e passa os activos a ABATIDO (nunca sao eliminados) */
  async aprovar(id: string, user: { id: string; nome: string; perfil: string }) {
    const proposta = await this.prisma.propostaAbate.findUnique({ where: { id }, include: { activos: true } });
    if (!proposta) throw new NotFoundException('Proposta não encontrada.');
    if (proposta.estado !== EstadoProposta.AGUARDA_APROVACAO) throw new BadRequestException('A proposta não está em fase de aprovação.');

    const ano = new Date().getFullYear();
    const total = await this.prisma.autoAbate.count();
    const numero = `AB-${ano}-${String(total + 3).padStart(3, '0')}`;

    const [auto] = await this.prisma.$transaction([
      this.prisma.autoAbate.create({ data: { numero, propostaId: id, aprovadoPorId: user.id } }),
      this.prisma.propostaAbate.update({ where: { id }, data: { estado: EstadoProposta.APROVADA } }),
      this.prisma.activo.updateMany({ where: { id: { in: proposta.activos.map((a) => a.id) } }, data: { estado: 'ABATIDO' } }),
      ...proposta.activos.map((a) =>
        this.prisma.eventoActivo.create({ data: { activoId: a.id, descricao: `Abatido — ${numero}`, autor: user.nome, tipo: 'movimentacao' } }),
      ),
    ]);
    await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Aprovou a proposta ${proposta.numero} e emitiu o ${numero}` });
    return auto;
  }

  /** Geracao server-side do PDF do Auto de Abate */
  async pdfAuto(autoId: string): Promise<{ numero: string; buffer: Buffer }> {
    const auto = await this.prisma.autoAbate.findUnique({
      where: { id: autoId },
      include: { aprovadoPor: true, proposta: { include: { activos: true, parecerPor: true } } },
    });
    if (!auto) throw new NotFoundException('Auto não encontrado.');
    const buffer = await this.pdf.gerarAutoAbate({
      numero: auto.numero,
      data: auto.data,
      aprovadoPor: `${auto.aprovadoPor.nome} — Direcção`,
      parecerPor: auto.proposta.parecerPor.nome,
      motivo: auto.proposta.motivo,
      parecer: auto.proposta.parecer,
      destino: auto.proposta.destino,
      sanitizacao: auto.proposta.sanitizacao,
      activos: auto.proposta.activos.map((a) => ({
        numInventario: a.numInventario,
        descricao: `${a.marca} ${a.modelo} (${a.categoria})`,
        numSerie: a.numSerie,
        dataAquisicao: a.dataAquisicao,
      })),
    });
    return { numero: auto.numero, buffer };
  }
}

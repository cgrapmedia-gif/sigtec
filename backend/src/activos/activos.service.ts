import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { analisarObsolescencia, CICLOS_VIDA } from './obsolescencia';

@Injectable()
export class ActivosService {
  constructor(private prisma: PrismaService, private auditoria: AuditoriaService) {}

  async listar() {
    const activos = await this.prisma.activo.findMany({
      include: { departamento: true, responsavel: { select: { id: true, nome: true } } },
      orderBy: { numInventario: 'asc' },
    });
    return activos.map((a) => ({ ...a, motivosObsolescencia: analisarObsolescencia(a), cicloVida: CICLOS_VIDA[a.categoria] ?? 6 }));
  }

  /** Once-Only: os equipamentos do próprio utilizador, para sugestão no formulário de pedido */
  meus(userId: string) {
    return this.prisma.activo.findMany({
      where: { responsavelId: userId, estado: { not: 'ABATIDO' } },
      select: { id: true, numInventario: true, categoria: true, marca: true, modelo: true, localizacao: true, estado: true },
      orderBy: { numInventario: 'asc' },
    });
  }

  async obter(id: string, quem: { nome: string; perfil: string }) {
    const a = await this.prisma.activo.findUnique({
      where: { id },
      include: {
        departamento: true,
        responsavel: { select: { id: true, nome: true } },
        eventos: { orderBy: { data: 'desc' } },
        pedidos: { select: { id: true, numero: true, assunto: true, estado: true }, orderBy: { criadoEm: 'desc' } },
      },
    });
    if (!a) throw new NotFoundException('Equipamento não encontrado.');
    if (a.responsavel && a.responsavel.nome !== quem.nome) {
      await this.auditoria.registar({
        quemNome: quem.nome, quemPerfil: quem.perfil,
        accao: `Consultou a ficha do equipamento ${a.numInventario}`, titularNome: a.responsavel.nome,
      });
    }
    return { ...a, motivosObsolescencia: analisarObsolescencia(a), cicloVida: CICLOS_VIDA[a.categoria] ?? 6 };
  }

  /** Numeração automática CGA-INF-NNNN, contínua e sem colisões */
  private async proximoNumero(): Promise<string> {
    const ultimo = await this.prisma.activo.findFirst({
      where: { numInventario: { startsWith: 'CGA-INF-' } },
      orderBy: { numInventario: 'desc' },
      select: { numInventario: true },
    });
    const n = ultimo ? parseInt(ultimo.numInventario.replace('CGA-INF-', ''), 10) + 1 : 1;
    return `CGA-INF-${String(n).padStart(4, '0')}`;
  }

  async criar(dto: any, quem: { nome: string; perfil: string }) {
    if (!dto.categoria || !dto.marca || !dto.modelo) {
      throw new BadRequestException('Categoria, marca e modelo são obrigatórios.');
    }
    const numInventario = dto.numInventario?.trim() || (await this.proximoNumero());
    const jaExiste = await this.prisma.activo.findUnique({ where: { numInventario } });
    if (jaExiste) throw new BadRequestException(`O número de inventário ${numInventario} já está em uso.`);

    const a = await this.prisma.activo.create({
      data: {
        numInventario,
        categoria: dto.categoria, marca: dto.marca, modelo: dto.modelo, numSerie: dto.numSerie || null,
        dataAquisicao: new Date(dto.dataAquisicao ?? Date.now()),
        fimGarantia: dto.fimGarantia ? new Date(dto.fimGarantia) : null,
        localizacao: dto.localizacao?.trim() || 'Por definir',
        departamentoId: dto.departamentoId || null,
        responsavelId: dto.responsavelId || null,
        estado: dto.estado ?? 'OPERACIONAL',
        temDisco: !!dto.temDisco,
      },
    });
    await this.prisma.eventoActivo.create({
      data: { activoId: a.id, descricao: 'Entrada em inventário', autor: quem.nome, tipo: 'instalacao' },
    });
    await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Registou o activo ${numInventario}` });
    return a;
  }

  /** Actualização com registo automático das alterações relevantes no histórico */
  async actualizar(id: string, dto: any, quem: { nome: string; perfil: string }) {
    const antes = await this.prisma.activo.findUnique({ where: { id }, include: { responsavel: { select: { nome: true } } } });
    if (!antes) throw new NotFoundException('Equipamento não encontrado.');

    const dados: any = {};
    for (const campo of ['categoria', 'marca', 'modelo', 'numSerie', 'localizacao', 'estado']) {
      if (dto[campo] !== undefined) dados[campo] = dto[campo];
    }
    if (dto.dataAquisicao) dados.dataAquisicao = new Date(dto.dataAquisicao);
    if (dto.fimGarantia !== undefined) dados.fimGarantia = dto.fimGarantia ? new Date(dto.fimGarantia) : null;
    if (dto.departamentoId !== undefined) dados.departamentoId = dto.departamentoId || null;
    if (dto.responsavelId !== undefined) dados.responsavelId = dto.responsavelId || null;
    if (dto.temDisco !== undefined) dados.temDisco = !!dto.temDisco;
    if (dto.falhas6m !== undefined) dados.falhas6m = Number(dto.falhas6m);
    if (dto.custoReparacao !== undefined) dados.custoReparacao = dto.custoReparacao === null || dto.custoReparacao === '' ? null : Number(dto.custoReparacao);
    if (dto.valorSubstituicao !== undefined) dados.valorSubstituicao = dto.valorSubstituicao === null || dto.valorSubstituicao === '' ? null : Number(dto.valorSubstituicao);

    const depois = await this.prisma.activo.update({ where: { id }, data: dados });

    if (dto.localizacao && dto.localizacao !== antes.localizacao) {
      await this.prisma.eventoActivo.create({
        data: { activoId: id, descricao: `Movimentação: «${antes.localizacao}» → «${dto.localizacao}»`, autor: quem.nome, tipo: 'movimentacao' },
      });
    }
    if (dto.estado && dto.estado !== antes.estado) {
      await this.prisma.eventoActivo.create({
        data: { activoId: id, descricao: `Estado alterado: ${antes.estado} → ${dto.estado}`, autor: quem.nome, tipo: 'intervencao' },
      });
    }
    await this.auditoria.registar({
      quemNome: quem.nome, quemPerfil: quem.perfil,
      accao: `Actualizou o activo ${antes.numInventario}`, titularNome: antes.responsavel?.nome,
    });
    return depois;
  }

  async candidatosAbate() {
    const activos = await this.prisma.activo.findMany({
      where: { estado: { not: 'ABATIDO' } },
      include: { propostas: { where: { estado: { in: ['COM_PARECER', 'AGUARDA_APROVACAO'] } } } },
    });
    return activos
      .map((a) => ({ ...a, motivos: analisarObsolescencia(a) }))
      .filter((a) => a.motivos.length >= 2 && a.propostas.length === 0)
      .map(({ propostas, ...a }) => a);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { analisarObsolescencia, CICLOS_VIDA } from './obsolescencia';

@Injectable()
export class ActivosService {
  constructor(private prisma: PrismaService, private auditoria: AuditoriaService) {}

  async listar() {
    const activos = await this.prisma.activo.findMany({
      include: { departamento: true, responsavel: { select: { nome: true } } },
      orderBy: { numInventario: 'asc' },
    });
    return activos.map((a) => ({ ...a, motivosObsolescencia: analisarObsolescencia(a), cicloVida: CICLOS_VIDA[a.categoria] ?? 6 }));
  }

  async obter(id: string, quem: { nome: string; perfil: string }) {
    const a = await this.prisma.activo.findUnique({
      where: { id },
      include: {
        departamento: true,
        responsavel: { select: { nome: true } },
        eventos: { orderBy: { data: 'desc' } },
        pedidos: { select: { id: true, numero: true, assunto: true, estado: true }, orderBy: { criadoEm: 'desc' } },
      },
    });
    if (!a) throw new NotFoundException('Equipamento não encontrado.');
    // Data Tracker: consulta a dados de terceiros fica registada
    if (a.responsavel && a.responsavel.nome !== quem.nome) {
      await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Consultou a ficha do equipamento ${a.numInventario}`, titularNome: a.responsavel.nome });
    }
    return { ...a, motivosObsolescencia: analisarObsolescencia(a), cicloVida: CICLOS_VIDA[a.categoria] ?? 6 };
  }

  async criar(dto: any, quem: { nome: string; perfil: string }) {
    const total = await this.prisma.activo.count();
    const numInventario = dto.numInventario ?? `CGA-INF-${String(total + 1).padStart(4, '0')}`;
    const a = await this.prisma.activo.create({
      data: {
        numInventario, categoria: dto.categoria, marca: dto.marca, modelo: dto.modelo, numSerie: dto.numSerie,
        dataAquisicao: new Date(dto.dataAquisicao ?? Date.now()),
        fimGarantia: dto.fimGarantia ? new Date(dto.fimGarantia) : null,
        localizacao: dto.localizacao ?? 'Por definir', departamentoId: dto.departamentoId ?? null,
        responsavelId: dto.responsavelId ?? null, temDisco: !!dto.temDisco,
      },
    });
    await this.prisma.eventoActivo.create({ data: { activoId: a.id, descricao: 'Instalação inicial e entrada em inventário', autor: quem.nome, tipo: 'instalacao' } });
    await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Registou o activo ${numInventario}` });
    return a;
  }

  /** Relatorio de candidatos a abate: 2+ criterios cumpridos e sem processo em curso (RF-ABT-01/02) */
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

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class FornecedoresService {
  constructor(private prisma: PrismaService, private notificacoes: NotificacoesService) {}

  listar() {
    return this.prisma.fornecedor.findMany({
      orderBy: [{ activo: 'desc' }, { nome: 'asc' }],
      include: { contratos: { where: { activo: true } }, _count: { select: { itens: true } } },
    });
  }

  criar(dto: any) {
    if (!dto.nome?.trim()) throw new BadRequestException('O nome do fornecedor é obrigatório.');
    return this.prisma.fornecedor.create({
      data: {
        nome: dto.nome.trim(), nif: dto.nif || null, contactoNome: dto.contactoNome || null,
        telefone: dto.telefone || null, email: dto.email || null,
        apoioTecnico: dto.apoioTecnico || null, observacoes: dto.observacoes || null,
      },
    });
  }

  actualizar(id: string, dto: any) {
    const dados: any = {};
    for (const c of ['nome', 'nif', 'contactoNome', 'telefone', 'email', 'apoioTecnico', 'observacoes', 'activo']) {
      if (dto[c] !== undefined) dados[c] = dto[c];
    }
    return this.prisma.fornecedor.update({ where: { id }, data: dados });
  }

  async listarContratos() {
    const contratos = await this.prisma.contrato.findMany({
      include: { fornecedor: true, _count: { select: { itens: true } } },
      orderBy: [{ activo: 'desc' }, { dataFim: 'asc' }],
    });
    return contratos.map((c) => ({ ...c, alerta: this.estadoRenovacao(c) }));
  }

  /** Um contrato que se renova sozinho sem ninguém dar por isso é dinheiro mal gerido */
  private estadoRenovacao(c: { dataFim: Date | null; avisoDias: number; renovacaoAutomatica: boolean }) {
    if (!c.dataFim) return { estado: 'SEM_TERMO', dias: null };
    const dias = Math.round((new Date(c.dataFim).getTime() - Date.now()) / 86400000);
    if (dias < 0) return { estado: 'EXPIRADO', dias };
    if (dias <= c.avisoDias) return { estado: c.renovacaoAutomatica ? 'RENOVA_AUTOMATICAMENTE' : 'A_EXPIRAR', dias };
    return { estado: 'VIGENTE', dias };
  }

  async criarContrato(dto: any) {
    if (!dto.designacao?.trim() || !dto.fornecedorId) {
      throw new BadRequestException('Designação e fornecedor são obrigatórios.');
    }
    const total = await this.prisma.contrato.count();
    const numero = dto.numero?.trim() || `CT-${new Date().getFullYear()}-${String(total + 1).padStart(3, '0')}`;
    return this.prisma.contrato.create({
      data: {
        numero, designacao: dto.designacao.trim(), tipo: dto.tipo ?? 'Serviço',
        fornecedorId: dto.fornecedorId,
        dataInicio: new Date(dto.dataInicio ?? Date.now()),
        dataFim: dto.dataFim ? new Date(dto.dataFim) : null,
        renovacaoAutomatica: !!dto.renovacaoAutomatica,
        avisoDias: Number(dto.avisoDias ?? 60),
        valorMensal: dto.valorMensal ? Number(dto.valorMensal) : null,
        slaHoras: dto.slaHoras ? Number(dto.slaHoras) : null,
        numeroCliente: dto.numeroCliente || null,
        observacoes: dto.observacoes || null,
      },
    });
  }

  actualizarContrato(id: string, dto: any) {
    const dados: any = {};
    for (const c of ['designacao', 'tipo', 'numeroCliente', 'observacoes', 'activo', 'renovacaoAutomatica']) {
      if (dto[c] !== undefined) dados[c] = dto[c];
    }
    if (dto.dataInicio) dados.dataInicio = new Date(dto.dataInicio);
    if (dto.dataFim !== undefined) dados.dataFim = dto.dataFim ? new Date(dto.dataFim) : null;
    for (const c of ['avisoDias', 'slaHoras']) if (dto[c] !== undefined) dados[c] = dto[c] ? Number(dto[c]) : null;
    if (dto.valorMensal !== undefined) dados.valorMensal = dto.valorMensal ? Number(dto.valorMensal) : null;
    return this.prisma.contrato.update({ where: { id }, data: dados });
  }

  /** Alertas de renovação para o painel e para as notificações proactivas */
  async contratosAExpirar() {
    const contratos = await this.prisma.contrato.findMany({
      where: { activo: true, dataFim: { not: null } },
      include: { fornecedor: { select: { nome: true } } },
    });
    return contratos
      .map((c) => ({ ...c, alerta: this.estadoRenovacao(c) }))
      .filter((c) => ['A_EXPIRAR', 'EXPIRADO', 'RENOVA_AUTOMATICAMENTE'].includes(c.alerta.estado))
      .sort((a, b) => (a.alerta.dias ?? 0) - (b.alerta.dias ?? 0));
  }
}

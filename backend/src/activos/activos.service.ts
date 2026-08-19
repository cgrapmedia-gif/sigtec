import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { analisarObsolescencia, parametrosDe } from './obsolescencia';

const INCLUDE_BASE = {
  departamento: true,
  responsavel: { select: { id: true, nome: true } },
  categoriaRef: true,
  fornecedor: { select: { id: true, nome: true, telefone: true, apoioTecnico: true } },
  contrato: { select: { id: true, numero: true, designacao: true, dataFim: true, slaHoras: true } },
};

@Injectable()
export class ActivosService {
  constructor(private prisma: PrismaService, private auditoria: AuditoriaService) {}

  /**
   * Falhas reais dos últimos 6 meses, calculadas a partir dos pedidos registados.
   * Substitui o valor declarado manualmente: a decisão de abate passa a assentar em factos.
   */
  private async falhasReais(): Promise<Record<string, number>> {
    const limite = new Date(Date.now() - 182 * 86400000);
    const grupos = await this.prisma.pedido.groupBy({
      by: ['activoId'],
      where: { activoId: { not: null }, criadoEm: { gte: limite }, categoria: { not: 'Aplicação' } },
      _count: { _all: true },
    });
    const mapa: Record<string, number> = {};
    for (const g of grupos) if (g.activoId) mapa[g.activoId] = g._count._all;
    return mapa;
  }

  async listar(tipo?: string) {
    const [activos, falhas] = await Promise.all([
      this.prisma.activo.findMany({
        where: tipo ? { tipo: tipo as any } : {},
        include: INCLUDE_BASE,
        orderBy: { numInventario: 'asc' },
      }),
      this.falhasReais(),
    ]);
    return activos.map((a) => {
      const reais = falhas[a.id] ?? 0;
      return {
        ...a,
        falhasCalculadas: reais,
        motivosObsolescencia: analisarObsolescencia(a, Math.max(reais, a.falhas6m)),
        cicloVida: parametrosDe(a).cicloVidaAnos,
      };
    });
  }

  /** Once-Only: os itens do próprio utilizador */
  meus(userId: string) {
    return this.prisma.activo.findMany({
      where: { responsavelId: userId, estado: { not: 'ABATIDO' } },
      select: {
        id: true, numInventario: true, categoria: true, marca: true, modelo: true, designacao: true,
        localizacao: true, piso: true, sala: true, sector: true, posto: true, estado: true, tipo: true,
        categoriaRef: { select: { icone: true } },
      },
      orderBy: [{ sector: 'asc' }, { numInventario: 'asc' }],
    });
  }

  async obter(id: string, quem: { nome: string; perfil: string }) {
    const a = await this.prisma.activo.findUnique({
      where: { id },
      include: {
        ...INCLUDE_BASE,
        eventos: { orderBy: { data: 'desc' } },
        pedidos: { select: { id: true, numero: true, assunto: true, estado: true, criadoEm: true }, orderBy: { criadoEm: 'desc' } },
        relacoesOrigem: { include: { destino: { select: { id: true, numInventario: true, designacao: true, marca: true, modelo: true, tipo: true, estado: true } } } },
        relacoesDestino: { include: { origem: { select: { id: true, numInventario: true, designacao: true, marca: true, modelo: true, tipo: true, estado: true } } } },
      },
    });
    if (!a) throw new NotFoundException('Item não encontrado.');
    if (a.responsavel && a.responsavel.nome !== quem.nome) {
      await this.auditoria.registar({
        quemNome: quem.nome, quemPerfil: quem.perfil,
        accao: `Consultou a ficha do item ${a.numInventario}`, titularNome: a.responsavel.nome,
      });
    }
    const limite = new Date(Date.now() - 182 * 86400000);
    const reais = a.pedidos.filter((p) => new Date(p.criadoEm) >= limite).length;
    return {
      ...a,
      falhasCalculadas: reais,
      motivosObsolescencia: analisarObsolescencia(a, Math.max(reais, a.falhas6m)),
      cicloVida: parametrosDe(a).cicloVidaAnos,
    };
  }

  private async proximoNumero(tipo: string): Promise<string> {
    const prefixos: Record<string, string> = {
      EQUIPAMENTO: 'CGA-INF', SOFTWARE: 'CGA-SW', SERVICO: 'CGA-SRV',
      CONTRATO: 'CGA-CT', INFRAESTRUTURA: 'CGA-INFR', CONSUMIVEL: 'CGA-CONS',
    };
    const prefixo = prefixos[tipo] ?? 'CGA-INF';
    const ultimo = await this.prisma.activo.findFirst({
      where: { numInventario: { startsWith: `${prefixo}-` } },
      orderBy: { numInventario: 'desc' }, select: { numInventario: true },
    });
    const n = ultimo ? parseInt(ultimo.numInventario.split('-').pop() ?? '0', 10) + 1 : 1;
    return `${prefixo}-${String(n).padStart(4, '0')}`;
  }

  async criar(dto: any, quem: { nome: string; perfil: string }) {
    const tipo = dto.tipo ?? 'EQUIPAMENTO';
    if (tipo === 'EQUIPAMENTO' && (!dto.marca || !dto.modelo)) {
      throw new BadRequestException('Marca e modelo são obrigatórios para equipamentos.');
    }
    if (tipo !== 'EQUIPAMENTO' && !dto.designacao?.trim()) {
      throw new BadRequestException('A designação é obrigatória para este tipo de item.');
    }
    const numInventario = dto.numInventario?.trim() || (await this.proximoNumero(tipo));
    if (await this.prisma.activo.findUnique({ where: { numInventario } })) {
      throw new BadRequestException(`O identificador ${numInventario} já está em uso.`);
    }
    const categoria = dto.categoriaId
      ? (await this.prisma.categoria.findUnique({ where: { id: dto.categoriaId } }))?.nome ?? dto.categoria
      : dto.categoria;

    const a = await this.prisma.activo.create({
      data: {
        numInventario, tipo, designacao: dto.designacao?.trim() || null,
        categoria: categoria ?? 'Outro', categoriaId: dto.categoriaId || null,
        camposPersonalizados: dto.camposPersonalizados ?? undefined,
        criticidade: Number(dto.criticidade ?? 3),
        marca: dto.marca || '—', modelo: dto.modelo || '—', numSerie: dto.numSerie || null,
        dataAquisicao: new Date(dto.dataAquisicao ?? Date.now()),
        fimGarantia: dto.fimGarantia ? new Date(dto.fimGarantia) : null,
        localizacao: dto.localizacao?.trim() || [dto.piso, dto.sala].filter(Boolean).join(' · ') || 'Por definir',
        piso: dto.piso?.trim() || null,
        sala: dto.sala?.trim() || null,
        sector: dto.sector?.trim() || null,
        posto: dto.posto?.trim() || null,
        departamentoId: dto.departamentoId || null,
        responsavelId: dto.responsavelId || null,
        fornecedorId: dto.fornecedorId || null,
        contratoId: dto.contratoId || null,
        estado: dto.estado ?? 'OPERACIONAL',
        temDisco: !!dto.temDisco,
        valorSubstituicao: dto.valorSubstituicao ? Number(dto.valorSubstituicao) : null,
      },
    });
    await this.prisma.eventoActivo.create({
      data: { activoId: a.id, descricao: 'Entrada em inventário', autor: quem.nome, tipo: 'instalacao' },
    });
    await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Registou o item ${numInventario}` });
    return a;
  }

  /**
   * Inserção em lote — para registar de uma vez um conjunto de equipamentos iguais
   * (por exemplo, dez computadores idênticos recebidos na mesma remessa).
   */
  async criarLote(dto: { base: any; quantidade?: number; variacoes?: any[] }, quem: { nome: string; perfil: string }) {
    const itens = dto.variacoes?.length
      ? dto.variacoes.map((v) => ({ ...dto.base, ...v }))
      : Array.from({ length: Math.min(Number(dto.quantidade ?? 1), 100) }, () => ({ ...dto.base }));
    if (itens.length === 0) throw new BadRequestException('Nada a registar.');

    const criados: any[] = [];
    const erros: { linha: number; erro: string }[] = [];
    for (let i = 0; i < itens.length; i++) {
      try {
        criados.push(await this.criar(itens[i], quem));
      } catch (e: any) {
        erros.push({ linha: i + 1, erro: e?.message ?? 'Erro desconhecido' });
      }
    }
    return { criados: criados.length, itens: criados, erros };
  }

  async actualizar(id: string, dto: any, quem: { nome: string; perfil: string }) {
    const antes = await this.prisma.activo.findUnique({ where: { id }, include: { responsavel: { select: { nome: true } } } });
    if (!antes) throw new NotFoundException('Item não encontrado.');

    const dados: any = {};
    for (const c of ['designacao', 'marca', 'modelo', 'numSerie', 'localizacao', 'estado', 'tipo', 'piso', 'sala', 'sector', 'posto']) {
      if (dto[c] !== undefined) dados[c] = dto[c] || null;
    }
    // Mantém a localização legível coerente com piso e sala
    if ((dto.piso !== undefined || dto.sala !== undefined) && dto.localizacao === undefined) {
      const piso = dto.piso ?? antes.piso;
      const sala = dto.sala ?? antes.sala;
      const composta = [piso, sala].filter(Boolean).join(' · ');
      if (composta) dados.localizacao = composta;
    }
    if (dto.categoriaId !== undefined) {
      dados.categoriaId = dto.categoriaId || null;
      if (dto.categoriaId) {
        const cat = await this.prisma.categoria.findUnique({ where: { id: dto.categoriaId } });
        if (cat) dados.categoria = cat.nome;
      }
    } else if (dto.categoria !== undefined) dados.categoria = dto.categoria;
    if (dto.camposPersonalizados !== undefined) dados.camposPersonalizados = dto.camposPersonalizados;
    if (dto.criticidade !== undefined) dados.criticidade = Number(dto.criticidade);
    if (dto.dataAquisicao) dados.dataAquisicao = new Date(dto.dataAquisicao);
    if (dto.fimGarantia !== undefined) dados.fimGarantia = dto.fimGarantia ? new Date(dto.fimGarantia) : null;
    for (const c of ['departamentoId', 'responsavelId', 'fornecedorId', 'contratoId']) {
      if (dto[c] !== undefined) dados[c] = dto[c] || null;
    }
    if (dto.temDisco !== undefined) dados.temDisco = !!dto.temDisco;
    if (dto.custoReparacao !== undefined) dados.custoReparacao = dto.custoReparacao === '' || dto.custoReparacao === null ? null : Number(dto.custoReparacao);
    if (dto.valorSubstituicao !== undefined) dados.valorSubstituicao = dto.valorSubstituicao === '' || dto.valorSubstituicao === null ? null : Number(dto.valorSubstituicao);

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
      accao: `Actualizou o item ${antes.numInventario}`, titularNome: antes.responsavel?.nome,
    });
    return depois;
  }

  /** Registo manual de uma intervenção ou ocorrência no histórico do item */
  async registarEvento(id: string, dto: { descricao: string; tipo?: string; data?: string }, quem: { nome: string; perfil: string }) {
    const a = await this.prisma.activo.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Item não encontrado.');
    if (!dto.descricao?.trim()) throw new BadRequestException('Descreva a intervenção.');
    const evento = await this.prisma.eventoActivo.create({
      data: {
        activoId: id, descricao: dto.descricao.trim(), autor: quem.nome,
        tipo: dto.tipo ?? 'intervencao',
        data: dto.data ? new Date(dto.data) : new Date(),
      },
    });
    await this.auditoria.registar({
      quemNome: quem.nome, quemPerfil: quem.perfil,
      accao: `Registou intervenção em ${a.numInventario}`,
    });
    return evento;
  }

  /* ---------- Relações e análise de impacto ---------- */

  async criarRelacao(dto: { origemId: string; destinoId: string; tipo: string; critica?: boolean; nota?: string }) {
    if (dto.origemId === dto.destinoId) throw new BadRequestException('Um item não pode depender de si próprio.');
    return this.prisma.relacaoItem.create({
      data: { origemId: dto.origemId, destinoId: dto.destinoId, tipo: dto.tipo as any, critica: !!dto.critica, nota: dto.nota || null },
    });
  }

  removerRelacao(id: string) {
    return this.prisma.relacaoItem.delete({ where: { id } });
  }

  /**
   * «Se isto falhar, o que para?» — percorre em profundidade os itens que dependem deste.
   */
  async analiseImpacto(id: string) {
    const raiz = await this.prisma.activo.findUnique({
      where: { id }, select: { id: true, numInventario: true, designacao: true, marca: true, modelo: true },
    });
    if (!raiz) throw new NotFoundException('Item não encontrado.');

    const afectados: any[] = [];
    const visitados = new Set<string>([id]);
    let fronteira = [id];
    let nivel = 1;

    while (fronteira.length && nivel <= 5) {
      const relacoes = await this.prisma.relacaoItem.findMany({
        where: { destinoId: { in: fronteira }, tipo: { in: ['DEPENDE_DE', 'INSTALADO_EM', 'LIGADO_A'] } },
        include: { origem: { select: { id: true, numInventario: true, designacao: true, marca: true, modelo: true, tipo: true, localizacao: true, criticidade: true } } },
      });
      const seguinte: string[] = [];
      for (const r of relacoes) {
        if (visitados.has(r.origem.id)) continue;
        visitados.add(r.origem.id);
        afectados.push({ ...r.origem, nivel, viaRelacao: r.tipo, critica: r.critica });
        seguinte.push(r.origem.id);
      }
      fronteira = seguinte;
      nivel++;
    }

    return {
      item: raiz,
      totalAfectados: afectados.length,
      criticos: afectados.filter((a) => a.critica || a.criticidade >= 4).length,
      afectados,
    };
  }

  /** Valores já usados em piso, sala e sector — alimentam as sugestões dos formulários */
  async localizacoes() {
    const activos = await this.prisma.activo.findMany({
      where: { estado: { not: 'ABATIDO' } },
      select: { piso: true, sala: true, sector: true, posto: true },
    });
    const unicos = (campo: 'piso' | 'sala' | 'sector' | 'posto') =>
      Array.from(new Set(activos.map((a) => a[campo]).filter(Boolean) as string[])).sort();
    return { pisos: unicos('piso'), salas: unicos('sala'), sectores: unicos('sector'), postos: unicos('posto') };
  }

  async candidatosAbate() {
    const [activos, falhas] = await Promise.all([
      this.prisma.activo.findMany({
        where: { estado: { not: 'ABATIDO' } },
        include: { categoriaRef: true, propostas: { where: { estado: { in: ['COM_PARECER', 'AGUARDA_APROVACAO'] } } } },
      }),
      this.falhasReais(),
    ]);
    return activos
      .map((a) => ({ ...a, falhasCalculadas: falhas[a.id] ?? 0, motivos: analisarObsolescencia(a, Math.max(falhas[a.id] ?? 0, a.falhas6m)) }))
      .filter((a) => a.motivos.length >= 2 && a.propostas.length === 0)
      .map(({ propostas, ...a }) => a);
  }
}

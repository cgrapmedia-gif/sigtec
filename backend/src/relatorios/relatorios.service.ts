import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { analisarObsolescencia, CICLOS_VIDA } from '../activos/obsolescencia';
import { resumoExecutivo, riscoFalha } from '../ia/regras';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  /** Indicadores calculados a partir dos dados reais — nada é fixo no código */
  async indicadores() {
    const [pedidos, activos, autos, ordens] = await Promise.all([
      this.prisma.pedido.findMany({ include: { activo: { select: { numInventario: true } } } }),
      this.prisma.activo.findMany({ where: { estado: { not: 'ABATIDO' } } }),
      this.prisma.autoAbate.count(),
      this.prisma.ordemManutencao.findMany(),
    ]);

    const fechados = pedidos.filter((p) => p.fechadoEm);
    const duracoes = fechados.map((p) => (new Date(p.fechadoEm!).getTime() - new Date(p.criadoEm).getTime()) / 3600000);
    const tempoMedioHoras = duracoes.length ? duracoes.reduce((a, b) => a + b, 0) / duracoes.length : 0;
    const dentroSla = fechados.filter((p, i) => duracoes[i] <= p.slaHoras).length;
    const slaCumpridoPct = fechados.length ? Math.round((dentroSla / fechados.length) * 100) : 100;

    // Evolução mensal dos últimos 6 meses
    const agora = new Date();
    const evolucao: { mes: string; pedidos: number; resolvidos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const fim = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 1);
      evolucao.push({
        mes: MESES[ref.getMonth()],
        pedidos: pedidos.filter((p) => new Date(p.criadoEm) >= ref && new Date(p.criadoEm) < fim).length,
        resolvidos: pedidos.filter((p) => p.fechadoEm && new Date(p.fechadoEm) >= ref && new Date(p.fechadoEm) < fim).length,
      });
    }
    const ultimo = evolucao[evolucao.length - 1]?.pedidos ?? 0;
    const penultimo = evolucao[evolucao.length - 2]?.pedidos ?? 0;
    const variacaoAvarias = penultimo ? Math.round(((ultimo - penultimo) / penultimo) * 100) : 0;

    const porPrioridade = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'].map((p) => ({
      prioridade: p, total: pedidos.filter((x) => x.prioridade === p).length,
    }));
    const porCategoria = Object.entries(
      pedidos.reduce((acc: Record<string, number>, p) => { acc[p.categoria] = (acc[p.categoria] ?? 0) + 1; return acc; }, {}),
    ).map(([categoria, total]) => ({ categoria, total }));

    const topFalhas = [...activos].sort((a, b) => b.falhas6m - a.falhas6m).slice(0, 6)
      .map((a) => ({ numInventario: a.numInventario, marca: a.marca, modelo: a.modelo, falhas6m: a.falhas6m }));

    const parqueRisco = activos.map((a) => ({
      numInventario: a.numInventario, marca: a.marca, modelo: a.modelo, categoria: a.categoria,
      ...riscoFalha({ falhas6m: a.falhas6m, dataAquisicao: a.dataAquisicao, fimGarantia: a.fimGarantia, cicloVida: CICLOS_VIDA[a.categoria] ?? 6 }),
    })).sort((a, b) => b.pontos - a.pontos);

    const candidatos = activos.filter((a) => analisarObsolescencia(a).length >= 2);
    const custoEstimadoRenovacao = candidatos.reduce((s, a) => s + (a.valorSubstituicao ? Number(a.valorSubstituicao) : 0), 0);

    const avaliados = pedidos.filter((p) => p.satisfacao != null);
    const satisfacaoMedia = avaliados.length ? avaliados.reduce((s, p) => s + (p.satisfacao ?? 0), 0) / avaliados.length : null;

    const planoRenovacao = candidatos.map((a) => ({
      numInventario: a.numInventario, equipamento: `${a.marca} ${a.modelo}`,
      motivos: analisarObsolescencia(a),
      estimativa: a.valorSubstituicao ? Number(a.valorSubstituicao) : null,
    }));

    const resumo = resumoExecutivo({
      pedidosAbertos: pedidos.filter((p) => !['RESOLVIDO', 'FECHADO'].includes(p.estado)).length,
      criticos: pedidos.filter((p) => p.prioridade === 'CRITICA' && !['RESOLVIDO', 'FECHADO'].includes(p.estado)).length,
      slaCumpridoPct, tempoMedioHoras, candidatosAbate: candidatos.length,
      topFalhas, custoEstimadoRenovacao, variacaoAvarias, satisfacaoMedia,
    });

    return {
      totais: {
        activos: activos.length, pedidos: pedidos.length, resolvidos: fechados.length,
        autosAbate: autos, ordensPendentes: ordens.filter((o) => !o.concluida).length,
      },
      desempenho: {
        tempoMedioHoras: Math.round(tempoMedioHoras * 10) / 10,
        slaCumpridoPct,
        satisfacaoMedia: satisfacaoMedia ? Math.round(satisfacaoMedia * 10) / 10 : null,
        totalAvaliacoes: avaliados.length,
      },
      evolucao, porPrioridade, porCategoria, topFalhas, parqueRisco,
      planoRenovacao, custoEstimadoRenovacao, resumo,
    };
  }

  /** KPIs de digitalização — calculados, deixam de ser valores ilustrativos */
  async digitalizacao() {
    const [pedidos, autos, logs] = await Promise.all([
      this.prisma.pedido.findMany({ select: { criadoEm: true, fechadoEm: true, slaHoras: true, satisfacao: true } }),
      this.prisma.autoAbate.count(),
      this.prisma.logAuditoria.count(),
    ]);
    const anoActual = new Date().getFullYear();
    const doAno = pedidos.filter((p) => new Date(p.criadoEm).getFullYear() === anoActual);
    // Estimativa conservadora: cada processo digital evita 2 folhas (pedido + comprovativo); cada auto de abate evita 4
    const folhasEvitadas = doAno.length * 2 + autos * 4;
    // Estimativa: 12 minutos poupados por processo digital face ao circuito em papel
    const horasPoupadas = Math.round((doAno.length * 12) / 60);
    const fechados = doAno.filter((p) => p.fechadoEm);
    const avaliados = doAno.filter((p) => p.satisfacao != null);

    return {
      pedidosDigitaisAno: doAno.length,
      percentagemDigital: 100, // todos os pedidos registados nascem digitais no SIGTEC
      folhasEvitadas,
      horasPoupadas,
      autosDigitais: autos,
      registosAuditoria: logs,
      resolvidosAno: fechados.length,
      satisfacaoMedia: avaliados.length
        ? Math.round((avaliados.reduce((s, p) => s + (p.satisfacao ?? 0), 0) / avaliados.length) * 10) / 10
        : null,
    };
  }

  /** Exportação CSV do inventário (interoperabilidade / Once-Only entre serviços) */
  async csvInventario(): Promise<string> {
    const activos = await this.prisma.activo.findMany({
      include: { departamento: true, responsavel: { select: { nome: true } } },
      orderBy: { numInventario: 'asc' },
    });
    const cab = ['N.º Inventário', 'Categoria', 'Marca', 'Modelo', 'N.º Série', 'Aquisição', 'Fim de garantia', 'Localização', 'Departamento', 'Responsável', 'Estado', 'Falhas 6m'];
    const linhas = activos.map((a) => [
      a.numInventario, a.categoria, a.marca, a.modelo, a.numSerie ?? '',
      new Date(a.dataAquisicao).toISOString().slice(0, 10),
      a.fimGarantia ? new Date(a.fimGarantia).toISOString().slice(0, 10) : '',
      a.localizacao, a.departamento?.nome ?? '', a.responsavel?.nome ?? '', a.estado, String(a.falhas6m),
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'));
    return '\uFEFF' + [cab.join(';'), ...linhas].join('\n');
  }
}

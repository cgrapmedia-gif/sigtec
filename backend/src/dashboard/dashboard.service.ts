import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { analisarObsolescencia } from '../activos/obsolescencia';

const ROTULO_ESTADO: Record<string, string> = {
  NOVO: 'Recebido — a aguardar técnico',
  EM_ANALISE: 'Um técnico está a analisar',
  EM_RESOLUCAO: 'A ser resolvido neste momento',
  AGUARDA_MATERIAL: 'À espera de material ou peça',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Concluído',
};

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /** O painel muda conforme quem está a olhar: cada perfil vê o que tem de fazer a seguir */
  async resumo(user: { id: string; nome: string; perfil: string }) {
    if (user.perfil === 'FUNCIONARIO') return this.painelFuncionario(user);
    if (user.perfil === 'DIRECCAO') return this.painelDireccao();
    return this.painelTecnico(user);
  }

  private sla(p: { criadoEm: Date; fechadoEm: Date | null; slaHoras: number }) {
    const limite = new Date(new Date(p.criadoEm).getTime() + p.slaHoras * 3600000);
    const ref = p.fechadoEm ? new Date(p.fechadoEm) : new Date();
    const horasRestantes = (limite.getTime() - ref.getTime()) / 3600000;
    return {
      horasRestantes: Math.round(horasRestantes * 10) / 10,
      violado: horasRestantes < 0,
      emRisco: horasRestantes >= 0 && horasRestantes <= p.slaHoras * 0.25,
    };
  }

  /* ---------------- FUNCIONÁRIO: «o que se passa com os meus pedidos» ---------------- */
  private async painelFuncionario(user: { id: string; nome: string }) {
    const [meus, meusItens, artigos] = await Promise.all([
      this.prisma.pedido.findMany({
        where: { autorId: user.id },
        include: { tecnico: { select: { nome: true } }, sintoma: { select: { icone: true } } },
        orderBy: { criadoEm: 'desc' }, take: 10,
      }),
      this.prisma.activo.findMany({
        where: { responsavelId: user.id, estado: { not: 'ABATIDO' } },
        select: { id: true, numInventario: true, designacao: true, marca: true, modelo: true, categoria: true, estado: true },
      }),
      this.prisma.artigoConhecimento.findMany({
        where: { publicado: true }, orderBy: { visualizacoes: 'desc' }, take: 4,
        select: { id: true, titulo: true, categoria: true },
      }),
    ]);

    const emCurso = meus.filter((p) => !['RESOLVIDO', 'FECHADO'].includes(p.estado));
    const porAvaliar = meus.filter((p) => ['RESOLVIDO', 'FECHADO'].includes(p.estado) && p.satisfacao == null);

    return {
      tipo: 'FUNCIONARIO',
      saudacao: this.saudacao(user.nome),
      emCurso: emCurso.map((p) => ({
        id: p.id, numero: p.numero, assunto: p.assunto, icone: p.sintoma?.icone ?? '📋',
        estadoSimples: ROTULO_ESTADO[p.estado], tecnico: p.tecnico?.nome ?? null,
        criadoEm: p.criadoEm, prioridade: p.prioridade,
      })),
      porAvaliar: porAvaliar.map((p) => ({ id: p.id, numero: p.numero, assunto: p.assunto })),
      totalResolvidos: meus.filter((p) => ['RESOLVIDO', 'FECHADO'].includes(p.estado)).length,
      meusItens, artigos,
    };
  }

  /* ---------------- TÉCNICO E ADMIN: «o que preciso de fazer agora» ---------------- */
  private async painelTecnico(user: { id: string; nome: string; perfil: string }) {
    const [abertos, activos, ordens, propostas, contratos] = await Promise.all([
      this.prisma.pedido.findMany({
        where: { estado: { notIn: ['RESOLVIDO', 'FECHADO'] } },
        include: { autor: { select: { nome: true } }, tecnico: { select: { id: true, nome: true } }, sintoma: { select: { icone: true, diagnosticoProvavel: true } }, activo: { select: { numInventario: true } } },
        orderBy: { criadoEm: 'asc' },
      }),
      this.prisma.activo.findMany({ where: { estado: { not: 'ABATIDO' } }, include: { categoriaRef: true } }),
      this.prisma.ordemManutencao.findMany({
        where: { concluida: false, dataPrevista: { lte: new Date(Date.now() + 15 * 86400000) } },
        include: { activo: { select: { numInventario: true } } }, orderBy: { dataPrevista: 'asc' },
      }),
      this.prisma.propostaAbate.count({ where: { estado: { in: ['COM_PARECER', 'AGUARDA_APROVACAO'] } } }),
      this.prisma.contrato.findMany({ where: { activo: true, dataFim: { not: null } }, include: { fornecedor: { select: { nome: true } } } }),
    ]);

    const comSla = abertos.map((p) => ({ ...p, sla: this.sla(p) }));
    const fila = [...comSla].sort((a, b) => {
      const peso = (x: any) => (x.sla.violado ? 0 : x.sla.emRisco ? 1 : 2);
      if (peso(a) !== peso(b)) return peso(a) - peso(b);
      const ordemPrio: any = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
      return ordemPrio[a.prioridade] - ordemPrio[b.prioridade];
    });

    // Serviços proactivos: o sistema age antes do pedido
    const proactivos: { titulo: string; detalhe: string; accao: string }[] = [];
    for (const a of activos) {
      const g = a.fimGarantia ? Math.round((new Date(a.fimGarantia).getTime() - Date.now()) / 86400000) : null;
      if (g !== null && g > 0 && g <= 90) {
        proactivos.push({ titulo: `Garantia de ${a.numInventario} expira em ${g} dias`, detalhe: `${a.marca} ${a.modelo}`, accao: 'Avaliar extensão ou substituição' });
      }
    }
    for (const c of contratos) {
      const dias = Math.round((new Date(c.dataFim!).getTime() - Date.now()) / 86400000);
      if (dias >= 0 && dias <= c.avisoDias) {
        proactivos.push({
          titulo: `Contrato ${c.numero} expira em ${dias} dias`, detalhe: `${c.designacao} — ${c.fornecedor.nome}`,
          accao: c.renovacaoAutomatica ? 'Renovação automática: denunciar agora se não se pretender renovar' : 'Iniciar renovação ou consulta ao mercado',
        });
      }
    }
    const candidatosAbate = activos.filter((a) => analisarObsolescencia(a).length >= 2).length;
    if (candidatosAbate) {
      proactivos.push({ titulo: `${candidatosAbate} equipamento(s) candidatos a abate`, detalhe: 'Análise automática de obsolescência', accao: 'Rever no módulo Obsolescência & Abate' });
    }

    const fechadosMes = await this.prisma.pedido.count({
      where: { fechadoEm: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    });

    return {
      tipo: 'TECNICO',
      saudacao: this.saudacao(user.nome),
      contadores: {
        violados: comSla.filter((p) => p.sla.violado).length,
        emRisco: comSla.filter((p) => p.sla.emRisco && !p.sla.violado).length,
        naoAtribuidos: comSla.filter((p) => !p.tecnicoId).length,
        meus: comSla.filter((p) => p.tecnicoId === user.id).length,
        abertos: comSla.length,
        resolvidosMes: fechadosMes,
        manutencao15d: ordens.length,
        propostasAbate: propostas,
      },
      fila: fila.slice(0, 8).map((p) => ({
        id: p.id, numero: p.numero, assunto: p.assunto, icone: p.sintoma?.icone ?? '📋',
        prioridade: p.prioridade, estado: p.estado, autor: p.autor.nome,
        tecnico: p.tecnico?.nome ?? null, meu: p.tecnicoId === user.id,
        activo: p.activo?.numInventario ?? null, sla: p.sla,
        pista: p.sintoma?.diagnosticoProvavel ?? null,
      })),
      manutencao: ordens.slice(0, 5).map((o) => ({
        id: o.id, tarefa: o.tarefa, dataPrevista: o.dataPrevista,
        activo: o.activo?.numInventario ?? null,
        dias: Math.round((new Date(o.dataPrevista).getTime() - Date.now()) / 86400000),
      })),
      proactivos: proactivos.slice(0, 6),
    };
  }

  /* ---------------- DIRECÇÃO: «o que tenho de decidir e como vai o serviço» ---------------- */
  private async painelDireccao() {
    const [propostas, pedidos, activos, autos] = await Promise.all([
      this.prisma.propostaAbate.findMany({
        where: { estado: 'AGUARDA_APROVACAO' },
        include: { activos: { select: { numInventario: true, marca: true, modelo: true, valorSubstituicao: true } }, parecerPor: { select: { nome: true } } },
      }),
      this.prisma.pedido.findMany({ select: { estado: true, prioridade: true, criadoEm: true, fechadoEm: true, slaHoras: true, satisfacao: true } }),
      this.prisma.activo.findMany({ where: { estado: { not: 'ABATIDO' } }, include: { categoriaRef: true } }),
      this.prisma.autoAbate.count(),
    ]);

    const fechados = pedidos.filter((p) => p.fechadoEm);
    const dentro = fechados.filter((p) => (new Date(p.fechadoEm!).getTime() - new Date(p.criadoEm).getTime()) / 3600000 <= p.slaHoras).length;
    const avaliados = pedidos.filter((p) => p.satisfacao != null);
    const candidatos = activos.filter((a) => analisarObsolescencia(a).length >= 2);

    return {
      tipo: 'DIRECCAO',
      decisoesPendentes: propostas.map((p) => ({
        id: p.id, numero: p.numero, parecerPor: p.parecerPor.nome,
        equipamentos: p.activos.map((a) => `${a.numInventario} (${a.marca} ${a.modelo})`),
        valorSubstituicao: p.activos.reduce((s, a) => s + (a.valorSubstituicao ? Number(a.valorSubstituicao) : 0), 0),
      })),
      indicadores: {
        pedidosAbertos: pedidos.filter((p) => !['RESOLVIDO', 'FECHADO'].includes(p.estado)).length,
        criticos: pedidos.filter((p) => p.prioridade === 'CRITICA' && !['RESOLVIDO', 'FECHADO'].includes(p.estado)).length,
        slaCumprido: fechados.length ? Math.round((dentro / fechados.length) * 100) : 100,
        satisfacao: avaliados.length ? Math.round((avaliados.reduce((s, p) => s + (p.satisfacao ?? 0), 0) / avaliados.length) * 10) / 10 : null,
        totalActivos: activos.length,
        autosEmitidos: autos,
        candidatosAbate: candidatos.length,
        investimentoProposto: candidatos.reduce((s, a) => s + (a.valorSubstituicao ? Number(a.valorSubstituicao) : 0), 0),
      },
    };
  }

  private saudacao(nome: string) {
    const h = new Date().getHours();
    const parte = h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
    return `${parte}, ${nome.split(' ')[0]}`;
  }
}

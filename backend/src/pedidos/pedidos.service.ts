import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoPedido, Prioridade } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { triagem } from '../ia/regras';

const SLA_HORAS: Record<Prioridade, number> = { CRITICA: 4, ALTA: 8, MEDIA: 24, BAIXA: 72 };

@Injectable()
export class PedidosService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
    private notificacoes: NotificacoesService,
  ) {}

  /** Funcionarios veem apenas os proprios pedidos; gestores veem todos */
  async listar(user: { id: string; perfil: string }) {
    const filtro = user.perfil === 'FUNCIONARIO' ? { autorId: user.id } : {};
    const pedidos = await this.prisma.pedido.findMany({
      where: filtro,
      include: {
        autor: { select: { nome: true } },
        tecnico: { select: { nome: true } },
        activo: { select: { numInventario: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
    return pedidos.map((p) => ({ ...p, sla: this.calcularSla(p) }));
  }

  /** Estado do SLA: prazo, horas restantes e se foi violado (RF-HD-04) */
  private calcularSla(p: { criadoEm: Date; fechadoEm: Date | null; slaHoras: number; estado: string }) {
    const limite = new Date(new Date(p.criadoEm).getTime() + p.slaHoras * 3600000);
    const referencia = p.fechadoEm ? new Date(p.fechadoEm) : new Date();
    const horasRestantes = (limite.getTime() - referencia.getTime()) / 3600000;
    const concluido = !!p.fechadoEm;
    return {
      limite,
      horasRestantes: Math.round(horasRestantes * 10) / 10,
      violado: horasRestantes < 0,
      emRisco: !concluido && horasRestantes >= 0 && horasRestantes <= p.slaHoras * 0.25,
      concluido,
    };
  }

  /** Triagem automática — sugestão explicável de prioridade e categoria */
  sugerirTriagem(assunto: string, descricao?: string) {
    return triagem(assunto, descricao);
  }

  /** Avaliação de satisfação pelo requerente, após resolução (RF-HD-09) */
  async avaliar(id: string, nota: number, comentario: string | undefined, user: { id: string; nome: string; perfil: string }) {
    const p = await this.prisma.pedido.findUniqueOrThrow({ where: { id } });
    if (p.autorId !== user.id) throw new ForbiddenException('Só o requerente pode avaliar o pedido.');
    if (!['RESOLVIDO', 'FECHADO'].includes(p.estado)) throw new ForbiddenException('Só é possível avaliar pedidos resolvidos.');
    if (nota < 1 || nota > 5) throw new ForbiddenException('A avaliação deve estar entre 1 e 5.');
    const actualizado = await this.prisma.pedido.update({
      where: { id },
      data: { satisfacao: nota, satisfacaoComentario: comentario || null },
    });
    await this.prisma.eventoPedido.create({
      data: { pedidoId: id, descricao: `Avaliação do requerente: ${nota}/5${comentario ? ` — «${comentario}»` : ''}`, autorId: user.id },
    });
    return actualizado;
  }

  async obter(id: string, user: { id: string; nome: string; perfil: string }) {
    const p = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        autor: { select: { id: true, nome: true, localizacao: true, departamento: { select: { nome: true } } } },
        tecnico: { select: { nome: true } },
        activo: { select: { id: true, numInventario: true, marca: true, modelo: true } },
        eventos: { include: { autor: { select: { nome: true } } }, orderBy: { criadoEm: 'asc' } },
      },
    });
    if (!p) throw new NotFoundException('Pedido não encontrado.');
    if (user.perfil === 'FUNCIONARIO' && p.autor.id !== user.id) throw new ForbiddenException('Só pode consultar os seus pedidos.');
    // Notas internas so para tecnicos/admin
    if (!['ADMIN', 'TECNICO'].includes(user.perfil)) p.eventos = p.eventos.filter((e) => !e.interno);
    // Data Tracker
    if (p.autor.id !== user.id) {
      await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Consultou o pedido #${p.numero}`, titularNome: p.autor.nome });
    }
    return { ...p, sla: this.calcularSla(p) };
  }

  /**
   * Criação a partir de um sintoma escolhido do catálogo.
   * O requerente não precisa de saber categoria nem prioridade: o sistema deriva-as,
   * monta o assunto e compõe a descrição a partir das respostas dadas por toque.
   */
  async criarPorSintoma(
    dto: { sintomaId: string; respostas?: Record<string, string>; activoId?: string; observacoes?: string },
    user: { id: string; nome: string; perfil: string },
  ) {
    const sintoma = await this.prisma.sintoma.findUnique({ where: { id: dto.sintomaId } });
    if (!sintoma) throw new NotFoundException('Sintoma não encontrado.');

    // A urgência sobe se o atendimento ao público estiver afectado
    let prioridade = sintoma.prioridadeSugerida;
    const respostas = dto.respostas ?? {};
    const afectaPublico = Object.values(respostas).some((r) =>
      typeof r === 'string' && /sim, com fila|sim, muitos|a todos|também estão|também não conseguem|sim$/i.test(r.trim()),
    );
    if (afectaPublico && prioridade !== 'CRITICA') {
      prioridade = prioridade === 'ALTA' ? 'CRITICA' : 'ALTA';
    }

    const linhas: string[] = [];
    const perguntas = (sintoma.perguntas as any[]) ?? [];
    for (const p of perguntas) {
      if (respostas[p.chave]) linhas.push(`${p.pergunta} → ${respostas[p.chave]}`);
    }
    if (dto.observacoes?.trim()) linhas.push(`Observações do requerente: ${dto.observacoes.trim()}`);
    if (sintoma.diagnosticoProvavel) linhas.push(`\n[Orientação técnica] ${sintoma.diagnosticoProvavel}`);

    const ano = new Date().getFullYear();
    const total = await this.prisma.pedido.count();
    const numero = `INC-${ano}-${String(total + 132).padStart(5, '0')}`;

    const p = await this.prisma.pedido.create({
      data: {
        numero, assunto: sintoma.rotulo, descricao: linhas.join('\n'),
        categoria: sintoma.categoriaTecnica, prioridade, slaHoras: SLA_HORAS[prioridade],
        autorId: user.id, activoId: dto.activoId || null,
        sintomaId: sintoma.id, respostas: respostas as any,
        eventos: { create: { descricao: `Pedido submetido por ${user.nome} através do assistente de sintomas`, autorId: user.id } },
      },
    });

    await this.prisma.sintoma.update({ where: { id: sintoma.id }, data: { vezesUsado: { increment: 1 } } });
    await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Abriu o pedido #${numero}`, titularNome: user.nome });
    await this.notificacoes.criarParaPerfis(
      ['ADMIN', 'TECNICO'],
      `Novo pedido #${numero} (${prioridade})`,
      `${sintoma.rotulo} — ${user.nome}. SLA: ${SLA_HORAS[prioridade]}h.`,
      '/pedidos',
    );
    return p;
  }

  /** Contagem por categoria, para os separadores da lista de pedidos */
  async resumoPorCategoria(user: { id: string; perfil: string }) {
    const filtro: any = user.perfil === 'FUNCIONARIO' ? { autorId: user.id } : {};
    const grupos = await this.prisma.pedido.groupBy({
      by: ['categoria'], where: filtro, _count: { _all: true },
    });
    const abertos = await this.prisma.pedido.groupBy({
      by: ['categoria'],
      where: { ...filtro, estado: { notIn: ['RESOLVIDO', 'FECHADO'] } },
      _count: { _all: true },
    });
    return grupos.map((g) => ({
      categoria: g.categoria,
      total: g._count._all,
      abertos: abertos.find((a) => a.categoria === g.categoria)?._count._all ?? 0,
    }));
  }

  /** Once-Only: autor, localizacao e SLA sao derivados pelo sistema */
  async criar(dto: { assunto: string; descricao?: string; categoria: string; prioridade: Prioridade; activoId?: string }, user: { id: string; nome: string; perfil: string }) {
    const ano = new Date().getFullYear();
    const total = await this.prisma.pedido.count();
    const numero = `INC-${ano}-${String(total + 132).padStart(5, '0')}`;
    const p = await this.prisma.pedido.create({
      data: {
        numero, assunto: dto.assunto, descricao: dto.descricao, categoria: dto.categoria,
        prioridade: dto.prioridade, slaHoras: SLA_HORAS[dto.prioridade],
        autorId: user.id, activoId: dto.activoId || null,
        eventos: { create: { descricao: `Pedido submetido online por ${user.nome}`, autorId: user.id } },
      },
    });
    await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Abriu o pedido #${numero}`, titularNome: user.nome });
    // Serviço proactivo: a equipa técnica é avisada sem depender de contacto informal
    await this.notificacoes.criarParaPerfis(
      ['ADMIN', 'TECNICO'],
      `Novo pedido #${numero} (${dto.prioridade})`,
      `${dto.assunto} — aberto por ${user.nome}. SLA: ${SLA_HORAS[dto.prioridade]}h.`,
      '/pedidos',
    );
    return p;
  }

  async actualizarEstado(id: string, dto: { estado: EstadoPedido; nota?: string; interno?: boolean }, user: { id: string; nome: string; perfil: string }) {
    const p = await this.prisma.pedido.findUniqueOrThrow({ where: { id }, include: { autor: { select: { id: true, nome: true } } } });
    const dados: any = { estado: dto.estado };
    if (!p.tecnicoId) dados.tecnicoId = user.id;
    if (['RESOLVIDO', 'FECHADO'].includes(dto.estado)) dados.fechadoEm = new Date();
    const actualizado = await this.prisma.pedido.update({ where: { id }, data: dados });
    await this.prisma.eventoPedido.create({ data: { pedidoId: id, descricao: `Estado alterado para «${dto.estado}» por ${user.nome}`, autorId: user.id } });
    if (dto.nota) await this.prisma.eventoPedido.create({ data: { pedidoId: id, descricao: dto.nota, interno: !!dto.interno, autorId: user.id } });
    await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Actualizou o pedido #${p.numero} para «${dto.estado}»`, titularNome: p.autor.nome });
    if (p.autorId !== user.id) {
      await this.notificacoes.criar(
        p.autorId,
        `Pedido #${p.numero}: ${dto.estado}`,
        dto.interno ? undefined : dto.nota,
        '/pedidos',
      );
    }
    // Historico tecnico do activo alimentado automaticamente (RF-HD-07)
    if (p.activoId && dto.nota) {
      await this.prisma.eventoActivo.create({ data: { activoId: p.activoId, descricao: `[#${p.numero}] ${dto.nota}`, autor: user.nome, tipo: 'intervencao' } });
    }
    return actualizado;
  }

  async comentar(id: string, texto: string, user: { id: string; nome: string; perfil: string }) {
    const p = await this.prisma.pedido.findUniqueOrThrow({ where: { id }, include: { autor: true } });
    if (user.perfil === 'FUNCIONARIO' && p.autorId !== user.id) throw new ForbiddenException();
    return this.prisma.eventoPedido.create({ data: { pedidoId: id, descricao: texto, autorId: user.id } });
  }
}

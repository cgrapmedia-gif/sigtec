import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResolucoesService {
  constructor(private prisma: PrismaService) {}

  listar() {
    return this.prisma.resolucao.findMany({ orderBy: [{ categoria: 'asc' }, { marca: 'asc' }] });
  }

  criar(dto: any) {
    return this.prisma.resolucao.create({
      data: {
        marca: dto.marca || null, categoria: dto.categoria || null,
        sintomaChave: dto.sintomaChave, titulo: dto.titulo,
        passos: dto.passos ?? [], pecaProvavel: dto.pecaProvavel || null,
        tempoEstimado: dto.tempoEstimado ? Number(dto.tempoEstimado) : null,
        fonte: dto.fonte ?? 'Equipa técnica',
      },
    });
  }

  actualizar(id: string, dto: any) {
    const dados: any = {};
    for (const c of ['marca', 'categoria', 'sintomaChave', 'titulo', 'passos', 'pecaProvavel', 'fonte', 'activo']) {
      if (dto[c] !== undefined) dados[c] = dto[c];
    }
    if (dto.tempoEstimado !== undefined) dados.tempoEstimado = dto.tempoEstimado ? Number(dto.tempoEstimado) : null;
    return this.prisma.resolucao.update({ where: { id }, data: dados });
  }

  /** Marca que uma sugestão foi aplicada e se resolveu — o catálogo aprende com o uso */
  registarUso(id: string, resolveu: boolean) {
    return this.prisma.resolucao.update({
      where: { id },
      data: { vezesAplicada: { increment: 1 }, ...(resolveu ? { vezesResolvida: { increment: 1 } } : {}) },
    });
  }

  /**
   * Sugestões para um pedido, por três vias combinadas:
   *  1. conhecimento genérico do fabricante e da categoria;
   *  2. o que já resolveu este mesmo equipamento no passado;
   *  3. artigos da base de conhecimento na mesma categoria.
   */
  async sugerirParaPedido(pedidoId: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { activo: true, sintoma: true },
    });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');

    const marca = pedido.activo?.marca ?? null;
    const categoria = pedido.activo?.categoria ?? null;
    const chave = pedido.sintoma?.rotulo ?? pedido.assunto;

    const candidatas = await this.prisma.resolucao.findMany({ where: { activo: true } });
    const palavras = chave.toLowerCase().split(/\s+/).filter((p) => p.length > 4);

    const pontuadas = candidatas
      .map((r) => {
        let pontos = 0;
        if (marca && r.marca && r.marca.toLowerCase() === marca.toLowerCase()) pontos += 5;
        if (categoria && r.categoria && r.categoria.toLowerCase() === categoria.toLowerCase()) pontos += 4;
        const alvo = r.sintomaChave.toLowerCase();
        for (const p of palavras) if (alvo.includes(p)) pontos += 2;
        if (r.vezesAplicada > 0) pontos += Math.min(2, (r.vezesResolvida / r.vezesAplicada) * 2);
        return { ...r, pontos, taxaSucesso: r.vezesAplicada ? Math.round((r.vezesResolvida / r.vezesAplicada) * 100) : null };
      })
      .filter((r) => r.pontos >= 4)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 4);

    // Histórico do próprio equipamento: o que já foi feito e funcionou
    const historico = pedido.activoId
      ? await this.prisma.pedido.findMany({
          where: { activoId: pedido.activoId, id: { not: pedidoId }, estado: { in: ['RESOLVIDO', 'FECHADO'] } },
          include: { eventos: { where: { interno: false }, orderBy: { criadoEm: 'desc' }, take: 2 } },
          orderBy: { fechadoEm: 'desc' }, take: 3,
        })
      : [];

    // Casos idênticos noutros equipamentos do mesmo modelo
    const mesmoModelo = pedido.activo
      ? await this.prisma.pedido.findMany({
          where: {
            id: { not: pedidoId }, estado: { in: ['RESOLVIDO', 'FECHADO'] },
            activo: { marca: pedido.activo.marca, modelo: pedido.activo.modelo, id: { not: pedido.activoId ?? '' } },
            ...(pedido.sintomaId ? { sintomaId: pedido.sintomaId } : {}),
          },
          include: { activo: { select: { numInventario: true } }, eventos: { where: { interno: false }, orderBy: { criadoEm: 'desc' }, take: 1 } },
          orderBy: { fechadoEm: 'desc' }, take: 3,
        })
      : [];

    const artigos = categoria || pedido.categoria
      ? await this.prisma.artigoConhecimento.findMany({
          where: { publicado: true, categoria: pedido.categoria },
          select: { id: true, titulo: true, categoria: true }, take: 3,
        })
      : [];

    return {
      contexto: {
        equipamento: pedido.activo ? `${pedido.activo.marca} ${pedido.activo.modelo}` : null,
        numInventario: pedido.activo?.numInventario ?? null,
        falhas6m: pedido.activo?.falhas6m ?? 0,
        pistaDoSintoma: pedido.sintoma?.diagnosticoProvavel ?? null,
      },
      sugestoes: pontuadas.map(({ pontos, ...r }) => r),
      historicoEquipamento: historico.map((h) => ({
        numero: h.numero, assunto: h.assunto, fechadoEm: h.fechadoEm,
        intervencao: h.eventos.map((e) => e.descricao).join(' · ') || null,
      })),
      casosSemelhantes: mesmoModelo.map((h) => ({
        numero: h.numero, equipamento: h.activo?.numInventario ?? null,
        intervencao: h.eventos[0]?.descricao ?? null,
      })),
      artigos,
    };
  }
}

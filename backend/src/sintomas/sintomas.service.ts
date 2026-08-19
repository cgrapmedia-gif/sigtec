import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SintomasService {
  constructor(private prisma: PrismaService) {}

  /** Sintomas agrupados, ordenados por utilização real — os mais frequentes ficam à frente */
  async listarAgrupados() {
    const sintomas = await this.prisma.sintoma.findMany({
      where: { activo: true },
      orderBy: [{ ordem: 'asc' }],
    });
    const grupos: { grupo: string; sintomas: any[] }[] = [];
    for (const s of sintomas) {
      let g = grupos.find((x) => x.grupo === s.grupo);
      if (!g) { g = { grupo: s.grupo, sintomas: [] }; grupos.push(g); }
      g.sintomas.push(s);
    }
    return grupos;
  }

  listarTodos() {
    return this.prisma.sintoma.findMany({ orderBy: [{ grupo: 'asc' }, { ordem: 'asc' }] });
  }

  /** Os mais usados, para atalhos no painel */
  frequentes(limite = 6) {
    return this.prisma.sintoma.findMany({
      where: { activo: true, vezesUsado: { gt: 0 } },
      orderBy: { vezesUsado: 'desc' },
      take: limite,
    });
  }

  criar(dto: any) {
    return this.prisma.sintoma.create({
      data: {
        grupo: dto.grupo, rotulo: dto.rotulo, icone: dto.icone || null,
        descricaoAjuda: dto.descricaoAjuda || null,
        perguntas: dto.perguntas ?? [], passosAutoAjuda: dto.passosAutoAjuda ?? [],
        prioridadeSugerida: dto.prioridadeSugerida ?? 'MEDIA',
        categoriaTecnica: dto.categoriaTecnica ?? 'Hardware',
        diagnosticoProvavel: dto.diagnosticoProvavel || null,
        ordem: Number(dto.ordem ?? 50),
      },
    });
  }

  actualizar(id: string, dto: any) {
    const dados: any = {};
    for (const c of ['grupo', 'rotulo', 'icone', 'descricaoAjuda', 'categoriaTecnica', 'diagnosticoProvavel', 'prioridadeSugerida', 'activo', 'perguntas', 'passosAutoAjuda']) {
      if (dto[c] !== undefined) dados[c] = dto[c];
    }
    if (dto.ordem !== undefined) dados.ordem = Number(dto.ordem);
    return this.prisma.sintoma.update({ where: { id }, data: dados });
  }

  /** Regista que a auto-ajuda resolveu o problema — mede o valor do catálogo */
  async registarAutoAjuda(id: string) {
    return this.prisma.sintoma.update({ where: { id }, data: { vezesUsado: { increment: 1 } } });
  }
}

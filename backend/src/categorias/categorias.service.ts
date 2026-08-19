import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async listar(incluirInactivas = false) {
    const cats = await this.prisma.categoria.findMany({
      where: incluirInactivas ? {} : { activa: true },
      orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
      include: { _count: { select: { activos: true } } },
    });
    return cats.map((c) => ({ ...c, totalItens: c._count.activos }));
  }

  criar(dto: any) {
    if (!dto.nome?.trim()) throw new BadRequestException('O nome da categoria é obrigatório.');
    return this.prisma.categoria.create({
      data: {
        nome: dto.nome.trim(),
        tipo: dto.tipo ?? 'EQUIPAMENTO',
        icone: dto.icone || null,
        cicloVidaMeses: Number(dto.cicloVidaMeses ?? 72),
        falhasCriticas: Number(dto.falhasCriticas ?? 5),
        racioReparacao: Number(dto.racioReparacao ?? 50),
        esquemaCampos: dto.esquemaCampos ?? [],
        rotinaTarefa: dto.rotinaTarefa || null,
        rotinaMeses: dto.rotinaMeses ? Number(dto.rotinaMeses) : null,
      },
    });
  }

  actualizar(id: string, dto: any) {
    const dados: any = {};
    for (const c of ['nome', 'tipo', 'icone', 'rotinaTarefa', 'activa', 'esquemaCampos']) {
      if (dto[c] !== undefined) dados[c] = dto[c];
    }
    for (const c of ['cicloVidaMeses', 'falhasCriticas', 'racioReparacao']) {
      if (dto[c] !== undefined) dados[c] = Number(dto[c]);
    }
    if (dto.rotinaMeses !== undefined) dados.rotinaMeses = dto.rotinaMeses ? Number(dto.rotinaMeses) : null;
    return this.prisma.categoria.update({ where: { id }, data: dados });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConhecimentoService {
  constructor(private prisma: PrismaService) {}

  listar(pesquisa?: string, categoria?: string) {
    const filtros: any[] = [{ publicado: true }];
    if (categoria) filtros.push({ categoria });
    if (pesquisa) {
      filtros.push({
        OR: [
          { titulo: { contains: pesquisa, mode: 'insensitive' } },
          { corpo: { contains: pesquisa, mode: 'insensitive' } },
          { palavrasChave: { contains: pesquisa, mode: 'insensitive' } },
        ],
      });
    }
    return this.prisma.artigoConhecimento.findMany({
      where: { AND: filtros },
      include: { autor: { select: { nome: true } } },
      orderBy: [{ visualizacoes: 'desc' }, { actualizadoEm: 'desc' }],
    });
  }

  async obter(id: string) {
    const artigo = await this.prisma.artigoConhecimento.findUnique({
      where: { id },
      include: { autor: { select: { nome: true } } },
    });
    if (!artigo) throw new NotFoundException('Artigo não encontrado.');
    await this.prisma.artigoConhecimento.update({ where: { id }, data: { visualizacoes: { increment: 1 } } });
    return artigo;
  }

  criar(dto: any, autorId: string) {
    return this.prisma.artigoConhecimento.create({
      data: {
        titulo: dto.titulo, categoria: dto.categoria, corpo: dto.corpo,
        palavrasChave: dto.palavrasChave || null, autorId,
      },
    });
  }

  actualizar(id: string, dto: any) {
    const dados: any = {};
    for (const c of ['titulo', 'categoria', 'corpo', 'palavrasChave', 'publicado']) {
      if (dto[c] !== undefined) dados[c] = dto[c];
    }
    return this.prisma.artigoConhecimento.update({ where: { id }, data: dados });
  }
}

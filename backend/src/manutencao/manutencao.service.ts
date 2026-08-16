import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ManutencaoService {
  constructor(private prisma: PrismaService) {}

  listar() {
    return this.prisma.ordemManutencao.findMany({
      where: { concluida: false },
      include: { activo: { select: { numInventario: true } } },
      orderBy: { dataPrevista: 'asc' },
    });
  }

  criar(dto: { tarefa: string; categoria: string; dataPrevista: string; activoId?: string }) {
    return this.prisma.ordemManutencao.create({
      data: { tarefa: dto.tarefa, categoria: dto.categoria, dataPrevista: new Date(dto.dataPrevista), activoId: dto.activoId || null },
    });
  }

  async concluir(id: string, quem: string, observacoes?: string) {
    const ordem = await this.prisma.ordemManutencao.update({
      where: { id },
      data: { concluida: true, concluidaEm: new Date(), concluidaPor: quem, observacoes },
    });
    if (ordem.activoId) {
      await this.prisma.eventoActivo.create({
        data: { activoId: ordem.activoId, descricao: `Manutenção preventiva concluída: ${ordem.tarefa}`, autor: quem, tipo: 'intervencao' },
      });
    }
    return ordem;
  }
}

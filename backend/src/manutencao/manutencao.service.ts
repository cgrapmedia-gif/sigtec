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

  criar(dto: { tarefa: string; categoria: string; dataPrevista: string; activoId?: string; recorrenciaMeses?: number }) {
    return this.prisma.ordemManutencao.create({
      data: {
        tarefa: dto.tarefa, categoria: dto.categoria,
        dataPrevista: new Date(dto.dataPrevista),
        activoId: dto.activoId || null,
        recorrenciaMeses: dto.recorrenciaMeses ? Number(dto.recorrenciaMeses) : null,
      },
    });
  }

  /** Rotinas por categoria — cria o calendário preventivo automaticamente (RF-MAN-02) */
  async gerarRotinas(quem: string) {
    const ROTINAS: { categoria: string; tarefa: string; meses: number }[] = [
      { categoria: 'Computador', tarefa: 'Limpeza interna, actualizações e verificação de antivírus', meses: 3 },
      { categoria: 'Impressora', tarefa: 'Manutenção preventiva e reposição de consumíveis', meses: 3 },
      { categoria: 'Servidor', tarefa: 'Backup completo e teste de restauro', meses: 1 },
      { categoria: 'UPS', tarefa: 'Teste de autonomia e verificação de baterias', meses: 6 },
      { categoria: 'Leitor biométrico', tarefa: 'Calibração e limpeza do sensor', meses: 6 },
      { categoria: 'Switch', tarefa: 'Análise de desempenho e revisão de configuração', meses: 6 },
      { categoria: 'Router', tarefa: 'Actualização de firmware e revisão de segurança', meses: 6 },
    ];
    const activos = await this.prisma.activo.findMany({ where: { estado: { not: 'ABATIDO' } } });
    const pendentes = await this.prisma.ordemManutencao.findMany({ where: { concluida: false } });
    let criadas = 0;

    for (const rotina of ROTINAS) {
      for (const a of activos.filter((x) => x.categoria === rotina.categoria)) {
        const jaTem = pendentes.some((o) => o.activoId === a.id && o.tarefa === rotina.tarefa);
        if (jaTem) continue;
        const data = new Date();
        data.setMonth(data.getMonth() + rotina.meses);
        await this.prisma.ordemManutencao.create({
          data: {
            tarefa: rotina.tarefa, categoria: rotina.categoria, dataPrevista: data,
            activoId: a.id, recorrenciaMeses: rotina.meses,
          },
        });
        criadas++;
      }
    }
    return { criadas, quem };
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
    // Recorrência: ao concluir, a próxima ocorrência é agendada automaticamente
    if (ordem.recorrenciaMeses) {
      const proxima = new Date();
      proxima.setMonth(proxima.getMonth() + ordem.recorrenciaMeses);
      await this.prisma.ordemManutencao.create({
        data: {
          tarefa: ordem.tarefa, categoria: ordem.categoria, dataPrevista: proxima,
          activoId: ordem.activoId, recorrenciaMeses: ordem.recorrenciaMeses,
        },
      });
    }
    return ordem;
  }
}

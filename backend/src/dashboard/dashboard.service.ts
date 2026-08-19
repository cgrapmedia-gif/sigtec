import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { analisarObsolescencia } from '../activos/obsolescencia';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async resumo() {
    const [totalActivos, operacionais, abatidos, pedidosAbertos, criticos, ordens15d, activos] = await Promise.all([
      this.prisma.activo.count({ where: { estado: { not: 'ABATIDO' } } }),
      this.prisma.activo.count({ where: { estado: 'OPERACIONAL' } }),
      this.prisma.autoAbate.count(),
      this.prisma.pedido.count({ where: { estado: { notIn: ['RESOLVIDO', 'FECHADO'] } } }),
      this.prisma.pedido.count({ where: { prioridade: 'CRITICA', estado: { notIn: ['RESOLVIDO', 'FECHADO'] } } }),
      this.prisma.ordemManutencao.count({ where: { concluida: false, dataPrevista: { lte: new Date(Date.now() + 15 * 86400000) } } }),
      this.prisma.activo.findMany({ where: { estado: { not: 'ABATIDO' } } }),
    ]);

    // Servicos proactivos (e-Estonia): o sistema age antes do pedido
    const proactivos: { titulo: string; detalhe: string; accao: string }[] = [];
    for (const a of activos) {
      const g = a.fimGarantia ? Math.round((new Date(a.fimGarantia).getTime() - Date.now()) / 86400000) : null;
      if (g !== null && g > 0 && g <= 90) {
        proactivos.push({ titulo: `Garantia de ${a.numInventario} expira em ${g} dias`, detalhe: `${a.marca} ${a.modelo}`, accao: 'Proposta de renovação criada automaticamente' });
      }
      if (a.falhas6m >= 5 && a.estado !== 'AVARIADO') {
        proactivos.push({ titulo: `Padrão de falhas em ${a.numInventario}`, detalhe: `${a.falhas6m} falhas em 6 meses`, accao: 'Ordem preventiva agendada automaticamente' });
      }
    }
    const candidatosAbate = activos.filter((a) => analisarObsolescencia(a).length >= 2).length;

    // Contratos a expirar — evita renovações automáticas despercebidas
    const contratos = await this.prisma.contrato.findMany({
      where: { activo: true, dataFim: { not: null } },
      include: { fornecedor: { select: { nome: true } } },
    });
    for (const c of contratos) {
      const dias = Math.round((new Date(c.dataFim!).getTime() - Date.now()) / 86400000);
      if (dias >= 0 && dias <= c.avisoDias) {
        proactivos.push({
          titulo: `Contrato ${c.numero} expira em ${dias} dias`,
          detalhe: `${c.designacao} — ${c.fornecedor.nome}`,
          accao: c.renovacaoAutomatica
            ? 'Renovação automática: denunciar agora se não se pretender renovar'
            : 'Iniciar processo de renovação ou consulta ao mercado',
        });
      }
    }

    return { totalActivos, operacionais, abatidos, pedidosAbertos, criticos, ordens15d, candidatosAbate, proactivos };
  }
}

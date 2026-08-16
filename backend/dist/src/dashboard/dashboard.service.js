"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const obsolescencia_1 = require("../activos/obsolescencia");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        const proactivos = [];
        for (const a of activos) {
            const g = a.fimGarantia ? Math.round((new Date(a.fimGarantia).getTime() - Date.now()) / 86400000) : null;
            if (g !== null && g > 0 && g <= 90) {
                proactivos.push({ titulo: `Garantia de ${a.numInventario} expira em ${g} dias`, detalhe: `${a.marca} ${a.modelo}`, accao: 'Proposta de renovação criada automaticamente' });
            }
            if (a.falhas6m >= 5 && a.estado !== 'AVARIADO') {
                proactivos.push({ titulo: `Padrão de falhas em ${a.numInventario}`, detalhe: `${a.falhas6m} falhas em 6 meses`, accao: 'Ordem preventiva agendada automaticamente' });
            }
        }
        const candidatosAbate = activos.filter((a) => (0, obsolescencia_1.analisarObsolescencia)(a).length >= 2).length;
        return { totalActivos, operacionais, abatidos, pedidosAbertos, criticos, ordens15d, candidatosAbate, proactivos };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);

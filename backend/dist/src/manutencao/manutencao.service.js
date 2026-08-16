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
exports.ManutencaoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ManutencaoService = class ManutencaoService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    listar() {
        return this.prisma.ordemManutencao.findMany({
            where: { concluida: false },
            include: { activo: { select: { numInventario: true } } },
            orderBy: { dataPrevista: 'asc' },
        });
    }
    criar(dto) {
        return this.prisma.ordemManutencao.create({
            data: { tarefa: dto.tarefa, categoria: dto.categoria, dataPrevista: new Date(dto.dataPrevista), activoId: dto.activoId || null },
        });
    }
    async concluir(id, quem, observacoes) {
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
};
exports.ManutencaoService = ManutencaoService;
exports.ManutencaoService = ManutencaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ManutencaoService);

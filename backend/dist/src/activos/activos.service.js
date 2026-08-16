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
exports.ActivosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auditoria_service_1 = require("../auditoria/auditoria.service");
const obsolescencia_1 = require("./obsolescencia");
let ActivosService = class ActivosService {
    constructor(prisma, auditoria) {
        this.prisma = prisma;
        this.auditoria = auditoria;
    }
    async listar() {
        const activos = await this.prisma.activo.findMany({
            include: { departamento: true, responsavel: { select: { nome: true } } },
            orderBy: { numInventario: 'asc' },
        });
        return activos.map((a) => ({ ...a, motivosObsolescencia: (0, obsolescencia_1.analisarObsolescencia)(a), cicloVida: obsolescencia_1.CICLOS_VIDA[a.categoria] ?? 6 }));
    }
    async obter(id, quem) {
        const a = await this.prisma.activo.findUnique({
            where: { id },
            include: {
                departamento: true,
                responsavel: { select: { nome: true } },
                eventos: { orderBy: { data: 'desc' } },
                pedidos: { select: { id: true, numero: true, assunto: true, estado: true }, orderBy: { criadoEm: 'desc' } },
            },
        });
        if (!a)
            throw new common_1.NotFoundException('Equipamento não encontrado.');
        if (a.responsavel && a.responsavel.nome !== quem.nome) {
            await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Consultou a ficha do equipamento ${a.numInventario}`, titularNome: a.responsavel.nome });
        }
        return { ...a, motivosObsolescencia: (0, obsolescencia_1.analisarObsolescencia)(a), cicloVida: obsolescencia_1.CICLOS_VIDA[a.categoria] ?? 6 };
    }
    async criar(dto, quem) {
        const total = await this.prisma.activo.count();
        const numInventario = dto.numInventario ?? `CGA-INF-${String(total + 1).padStart(4, '0')}`;
        const a = await this.prisma.activo.create({
            data: {
                numInventario, categoria: dto.categoria, marca: dto.marca, modelo: dto.modelo, numSerie: dto.numSerie,
                dataAquisicao: new Date(dto.dataAquisicao ?? Date.now()),
                fimGarantia: dto.fimGarantia ? new Date(dto.fimGarantia) : null,
                localizacao: dto.localizacao ?? 'Por definir', departamentoId: dto.departamentoId ?? null,
                responsavelId: dto.responsavelId ?? null, temDisco: !!dto.temDisco,
            },
        });
        await this.prisma.eventoActivo.create({ data: { activoId: a.id, descricao: 'Instalação inicial e entrada em inventário', autor: quem.nome, tipo: 'instalacao' } });
        await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Registou o activo ${numInventario}` });
        return a;
    }
    async candidatosAbate() {
        const activos = await this.prisma.activo.findMany({
            where: { estado: { not: 'ABATIDO' } },
            include: { propostas: { where: { estado: { in: ['COM_PARECER', 'AGUARDA_APROVACAO'] } } } },
        });
        return activos
            .map((a) => ({ ...a, motivos: (0, obsolescencia_1.analisarObsolescencia)(a) }))
            .filter((a) => a.motivos.length >= 2 && a.propostas.length === 0)
            .map(({ propostas, ...a }) => a);
    }
};
exports.ActivosService = ActivosService;
exports.ActivosService = ActivosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, auditoria_service_1.AuditoriaService])
], ActivosService);

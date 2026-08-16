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
exports.AbateService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const auditoria_service_1 = require("../auditoria/auditoria.service");
const pdf_service_1 = require("../pdf/pdf.service");
const obsolescencia_1 = require("../activos/obsolescencia");
let AbateService = class AbateService {
    constructor(prisma, auditoria, pdf) {
        this.prisma = prisma;
        this.auditoria = auditoria;
        this.pdf = pdf;
    }
    listarPropostas() {
        return this.prisma.propostaAbate.findMany({
            include: { activos: true, parecerPor: { select: { nome: true } }, auto: { include: { aprovadoPor: { select: { nome: true } } } } },
            orderBy: { criadoEm: 'desc' },
        });
    }
    listarAutos() {
        return this.prisma.autoAbate.findMany({
            include: { aprovadoPor: { select: { nome: true } }, proposta: { include: { activos: true, parecerPor: { select: { nome: true } } } } },
            orderBy: { data: 'desc' },
        });
    }
    async criarProposta(dto, user) {
        const activos = await this.prisma.activo.findMany({ where: { id: { in: dto.activoIds } } });
        if (activos.length === 0)
            throw new common_1.BadRequestException('Indique pelo menos um equipamento.');
        const motivo = activos.map((a) => `${a.numInventario}: ${(0, obsolescencia_1.analisarObsolescencia)(a).join('; ') || 'avaliação técnica'}`).join(' | ');
        const ano = new Date().getFullYear();
        const total = await this.prisma.propostaAbate.count();
        const numero = `PA-${ano}-${String(total + 3).padStart(3, '0')}`;
        const proposta = await this.prisma.propostaAbate.create({
            data: {
                numero, motivo, parecer: dto.parecer, parecerPorId: user.id,
                destino: dto.destino, sanitizacao: dto.sanitizacao,
                estado: user.perfil === 'ADMIN' ? client_1.EstadoProposta.AGUARDA_APROVACAO : client_1.EstadoProposta.COM_PARECER,
                activos: { connect: dto.activoIds.map((id) => ({ id })) },
            },
            include: { activos: true },
        });
        await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Criou a proposta de abate ${numero}` });
        return proposta;
    }
    async submeterDireccao(id, user) {
        const p = await this.prisma.propostaAbate.update({ where: { id }, data: { estado: client_1.EstadoProposta.AGUARDA_APROVACAO } });
        await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Submeteu a proposta ${p.numero} à Direcção` });
        return p;
    }
    async aprovar(id, user) {
        const proposta = await this.prisma.propostaAbate.findUnique({ where: { id }, include: { activos: true } });
        if (!proposta)
            throw new common_1.NotFoundException('Proposta não encontrada.');
        if (proposta.estado !== client_1.EstadoProposta.AGUARDA_APROVACAO)
            throw new common_1.BadRequestException('A proposta não está em fase de aprovação.');
        const ano = new Date().getFullYear();
        const total = await this.prisma.autoAbate.count();
        const numero = `AB-${ano}-${String(total + 3).padStart(3, '0')}`;
        const [auto] = await this.prisma.$transaction([
            this.prisma.autoAbate.create({ data: { numero, propostaId: id, aprovadoPorId: user.id } }),
            this.prisma.propostaAbate.update({ where: { id }, data: { estado: client_1.EstadoProposta.APROVADA } }),
            this.prisma.activo.updateMany({ where: { id: { in: proposta.activos.map((a) => a.id) } }, data: { estado: 'ABATIDO' } }),
            ...proposta.activos.map((a) => this.prisma.eventoActivo.create({ data: { activoId: a.id, descricao: `Abatido — ${numero}`, autor: user.nome, tipo: 'movimentacao' } })),
        ]);
        await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Aprovou a proposta ${proposta.numero} e emitiu o ${numero}` });
        return auto;
    }
    async pdfAuto(autoId) {
        const auto = await this.prisma.autoAbate.findUnique({
            where: { id: autoId },
            include: { aprovadoPor: true, proposta: { include: { activos: true, parecerPor: true } } },
        });
        if (!auto)
            throw new common_1.NotFoundException('Auto não encontrado.');
        const buffer = await this.pdf.gerarAutoAbate({
            numero: auto.numero,
            data: auto.data,
            aprovadoPor: `${auto.aprovadoPor.nome} — Direcção`,
            parecerPor: auto.proposta.parecerPor.nome,
            motivo: auto.proposta.motivo,
            parecer: auto.proposta.parecer,
            destino: auto.proposta.destino,
            sanitizacao: auto.proposta.sanitizacao,
            activos: auto.proposta.activos.map((a) => ({
                numInventario: a.numInventario,
                descricao: `${a.marca} ${a.modelo} (${a.categoria})`,
                numSerie: a.numSerie,
                dataAquisicao: a.dataAquisicao,
            })),
        });
        return { numero: auto.numero, buffer };
    }
};
exports.AbateService = AbateService;
exports.AbateService = AbateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, auditoria_service_1.AuditoriaService, pdf_service_1.PdfService])
], AbateService);

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
exports.PedidosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auditoria_service_1 = require("../auditoria/auditoria.service");
const SLA_HORAS = { CRITICA: 4, ALTA: 8, MEDIA: 24, BAIXA: 72 };
let PedidosService = class PedidosService {
    constructor(prisma, auditoria) {
        this.prisma = prisma;
        this.auditoria = auditoria;
    }
    listar(user) {
        const filtro = user.perfil === 'FUNCIONARIO' ? { autorId: user.id } : {};
        return this.prisma.pedido.findMany({
            where: filtro,
            include: {
                autor: { select: { nome: true } },
                tecnico: { select: { nome: true } },
                activo: { select: { numInventario: true } },
            },
            orderBy: { criadoEm: 'desc' },
        });
    }
    async obter(id, user) {
        const p = await this.prisma.pedido.findUnique({
            where: { id },
            include: {
                autor: { select: { id: true, nome: true, localizacao: true, departamento: { select: { nome: true } } } },
                tecnico: { select: { nome: true } },
                activo: { select: { id: true, numInventario: true, marca: true, modelo: true } },
                eventos: { include: { autor: { select: { nome: true } } }, orderBy: { criadoEm: 'asc' } },
            },
        });
        if (!p)
            throw new common_1.NotFoundException('Pedido não encontrado.');
        if (user.perfil === 'FUNCIONARIO' && p.autor.id !== user.id)
            throw new common_1.ForbiddenException('Só pode consultar os seus pedidos.');
        if (!['ADMIN', 'TECNICO'].includes(user.perfil))
            p.eventos = p.eventos.filter((e) => !e.interno);
        if (p.autor.id !== user.id) {
            await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Consultou o pedido #${p.numero}`, titularNome: p.autor.nome });
        }
        return p;
    }
    async criar(dto, user) {
        const ano = new Date().getFullYear();
        const total = await this.prisma.pedido.count();
        const numero = `INC-${ano}-${String(total + 132).padStart(5, '0')}`;
        const p = await this.prisma.pedido.create({
            data: {
                numero, assunto: dto.assunto, descricao: dto.descricao, categoria: dto.categoria,
                prioridade: dto.prioridade, slaHoras: SLA_HORAS[dto.prioridade],
                autorId: user.id, activoId: dto.activoId || null,
                eventos: { create: { descricao: `Pedido submetido online por ${user.nome}`, autorId: user.id } },
            },
        });
        await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Abriu o pedido #${numero}`, titularNome: user.nome });
        return p;
    }
    async actualizarEstado(id, dto, user) {
        const p = await this.prisma.pedido.findUniqueOrThrow({ where: { id }, include: { autor: { select: { nome: true } } } });
        const dados = { estado: dto.estado };
        if (!p.tecnicoId)
            dados.tecnicoId = user.id;
        if (['RESOLVIDO', 'FECHADO'].includes(dto.estado))
            dados.fechadoEm = new Date();
        const actualizado = await this.prisma.pedido.update({ where: { id }, data: dados });
        await this.prisma.eventoPedido.create({ data: { pedidoId: id, descricao: `Estado alterado para «${dto.estado}» por ${user.nome}`, autorId: user.id } });
        if (dto.nota)
            await this.prisma.eventoPedido.create({ data: { pedidoId: id, descricao: dto.nota, interno: !!dto.interno, autorId: user.id } });
        await this.auditoria.registar({ quemNome: user.nome, quemPerfil: user.perfil, accao: `Actualizou o pedido #${p.numero} para «${dto.estado}»`, titularNome: p.autor.nome });
        if (p.activoId && dto.nota) {
            await this.prisma.eventoActivo.create({ data: { activoId: p.activoId, descricao: `[#${p.numero}] ${dto.nota}`, autor: user.nome, tipo: 'intervencao' } });
        }
        return actualizado;
    }
    async comentar(id, texto, user) {
        const p = await this.prisma.pedido.findUniqueOrThrow({ where: { id }, include: { autor: true } });
        if (user.perfil === 'FUNCIONARIO' && p.autorId !== user.id)
            throw new common_1.ForbiddenException();
        return this.prisma.eventoPedido.create({ data: { pedidoId: id, descricao: texto, autorId: user.id } });
    }
};
exports.PedidosService = PedidosService;
exports.PedidosService = PedidosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, auditoria_service_1.AuditoriaService])
], PedidosService);

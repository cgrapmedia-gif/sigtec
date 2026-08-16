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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionarioController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const user_decorator_1 = require("../auth/user.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let QuestionarioController = class QuestionarioController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    listar() {
        return this.prisma.respostaQuestionario.findMany({ include: { autor: { select: { nome: true } } }, orderBy: { criadoEm: 'desc' } });
    }
    responder(dto, user) {
        return this.prisma.respostaQuestionario.create({
            data: { autorId: user.id, problema: dto.problema, equipamento: dto.equipamento, ferramenta: dto.ferramenta, automatizar: dto.automatizar, formacao: dto.formacao },
        });
    }
};
exports.QuestionarioController = QuestionarioController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionarioController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionarioController.prototype, "responder", null);
exports.QuestionarioController = QuestionarioController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO'),
    (0, common_1.Controller)('questionario'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuestionarioController);

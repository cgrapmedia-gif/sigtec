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
exports.PedidosController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const user_decorator_1 = require("../auth/user.decorator");
const pedidos_service_1 = require("./pedidos.service");
class CriarPedidoDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CriarPedidoDto.prototype, "assunto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CriarPedidoDto.prototype, "descricao", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['Hardware', 'Software', 'Rede', 'Impressão', 'Aplicação', 'Sistema biométrico']),
    __metadata("design:type", String)
], CriarPedidoDto.prototype, "categoria", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
    __metadata("design:type", Object)
], CriarPedidoDto.prototype, "prioridade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CriarPedidoDto.prototype, "activoId", void 0);
class ActualizarEstadoDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['NOVO', 'EM_ANALISE', 'EM_RESOLUCAO', 'AGUARDA_MATERIAL', 'RESOLVIDO', 'FECHADO']),
    __metadata("design:type", Object)
], ActualizarEstadoDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActualizarEstadoDto.prototype, "nota", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ActualizarEstadoDto.prototype, "interno", void 0);
let PedidosController = class PedidosController {
    constructor(svc) {
        this.svc = svc;
    }
    listar(user) { return this.svc.listar(user); }
    obter(id, user) { return this.svc.obter(id, user); }
    criar(dto, user) { return this.svc.criar(dto, user); }
    estado(id, dto, user) {
        return this.svc.actualizarEstado(id, dto, user);
    }
    comentar(id, texto, user) {
        return this.svc.comentar(id, texto, user);
    }
};
exports.PedidosController = PedidosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "obter", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CriarPedidoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)(':id/estado'),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ActualizarEstadoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "estado", null);
__decorate([
    (0, common_1.Post)(':id/comentarios'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('texto')),
    __param(2, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "comentar", null);
exports.PedidosController = PedidosController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('pedidos'),
    __metadata("design:paramtypes", [pedidos_service_1.PedidosService])
], PedidosController);

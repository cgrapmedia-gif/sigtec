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
exports.ManutencaoController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const user_decorator_1 = require("../auth/user.decorator");
const manutencao_service_1 = require("./manutencao.service");
let ManutencaoController = class ManutencaoController {
    constructor(svc) {
        this.svc = svc;
    }
    listar() { return this.svc.listar(); }
    criar(dto) { return this.svc.criar(dto); }
    concluir(id, obs, user) {
        return this.svc.concluir(id, user.nome, obs);
    }
};
exports.ManutencaoController = ManutencaoController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ManutencaoController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ManutencaoController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)(':id/concluir'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('observacoes')),
    __param(2, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ManutencaoController.prototype, "concluir", null);
exports.ManutencaoController = ManutencaoController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO'),
    (0, common_1.Controller)('manutencao'),
    __metadata("design:paramtypes", [manutencao_service_1.ManutencaoService])
], ManutencaoController);

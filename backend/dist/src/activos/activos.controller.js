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
exports.ActivosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const user_decorator_1 = require("../auth/user.decorator");
const activos_service_1 = require("./activos.service");
let ActivosController = class ActivosController {
    constructor(svc) {
        this.svc = svc;
    }
    listar() { return this.svc.listar(); }
    candidatos() { return this.svc.candidatosAbate(); }
    obter(id, user) { return this.svc.obter(id, user); }
    criar(dto, user) { return this.svc.criar(dto, user); }
};
exports.ActivosController = ActivosController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO', 'DIRECCAO'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActivosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('candidatos-abate'),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO', 'DIRECCAO'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActivosController.prototype, "candidatos", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ActivosController.prototype, "obter", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ActivosController.prototype, "criar", null);
exports.ActivosController = ActivosController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('activos'),
    __metadata("design:paramtypes", [activos_service_1.ActivosService])
], ActivosController);

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
exports.AbateController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const user_decorator_1 = require("../auth/user.decorator");
const abate_service_1 = require("./abate.service");
class CriarPropostaDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    __metadata("design:type", Array)
], CriarPropostaDto.prototype, "activoIds", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], CriarPropostaDto.prototype, "parecer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CriarPropostaDto.prototype, "destino", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CriarPropostaDto.prototype, "sanitizacao", void 0);
let AbateController = class AbateController {
    constructor(svc) {
        this.svc = svc;
    }
    propostas() { return this.svc.listarPropostas(); }
    autos() { return this.svc.listarAutos(); }
    criar(dto, user) { return this.svc.criarProposta(dto, user); }
    submeter(id, user) { return this.svc.submeterDireccao(id, user); }
    aprovar(id, user) { return this.svc.aprovar(id, user); }
    async pdf(id, res) {
        const { numero, buffer } = await this.svc.pdfAuto(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="Auto-de-Abate-${numero}.pdf"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
};
exports.AbateController = AbateController;
__decorate([
    (0, common_1.Get)('propostas'),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO', 'DIRECCAO'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AbateController.prototype, "propostas", null);
__decorate([
    (0, common_1.Get)('autos'),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO', 'DIRECCAO'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AbateController.prototype, "autos", null);
__decorate([
    (0, common_1.Post)('propostas'),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CriarPropostaDto, Object]),
    __metadata("design:returntype", void 0)
], AbateController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)('propostas/:id/submeter'),
    (0, roles_guard_1.Perfis)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AbateController.prototype, "submeter", null);
__decorate([
    (0, common_1.Patch)('propostas/:id/aprovar'),
    (0, roles_guard_1.Perfis)('DIRECCAO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.UserActual)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AbateController.prototype, "aprovar", null);
__decorate([
    (0, common_1.Get)('autos/:id/pdf'),
    (0, roles_guard_1.Perfis)('ADMIN', 'TECNICO', 'DIRECCAO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AbateController.prototype, "pdf", null);
exports.AbateController = AbateController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('abate'),
    __metadata("design:paramtypes", [abate_service_1.AbateService])
], AbateController);

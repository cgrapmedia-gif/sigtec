"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const activos_module_1 = require("./activos/activos.module");
const pedidos_module_1 = require("./pedidos/pedidos.module");
const manutencao_module_1 = require("./manutencao/manutencao.module");
const abate_module_1 = require("./abate/abate.module");
const auditoria_module_1 = require("./auditoria/auditoria.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const questionario_module_1 = require("./questionario/questionario.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            activos_module_1.ActivosModule,
            pedidos_module_1.PedidosModule,
            manutencao_module_1.ManutencaoModule,
            abate_module_1.AbateModule,
            auditoria_module_1.AuditoriaModule,
            dashboard_module_1.DashboardModule,
            questionario_module_1.QuestionarioModule,
        ],
    })
], AppModule);

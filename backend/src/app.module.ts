import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivosModule } from './activos/activos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ManutencaoModule } from './manutencao/manutencao.module';
import { AbateModule } from './abate/abate.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QuestionarioModule } from './questionario/questionario.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { ConhecimentoModule } from './conhecimento/conhecimento.module';
import { CategoriasModule } from './categorias/categorias.module';
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { DepartamentosModule } from './departamentos/departamentos.module';
import { SintomasModule } from './sintomas/sintomas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Protecção contra abuso: 120 pedidos por minuto por IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ActivosModule,
    PedidosModule,
    ManutencaoModule,
    AbateModule,
    AuditoriaModule,
    NotificacoesModule,
    RelatoriosModule,
    ConhecimentoModule,
    CategoriasModule,
    FornecedoresModule,
    DepartamentosModule,
    SintomasModule,
    DashboardModule,
    QuestionarioModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

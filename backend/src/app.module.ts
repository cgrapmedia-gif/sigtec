import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ActivosModule,
    PedidosModule,
    ManutencaoModule,
    AbateModule,
    AuditoriaModule,
    NotificacoesModule,
    DashboardModule,
    QuestionarioModule,
  ],
})
export class AppModule {}

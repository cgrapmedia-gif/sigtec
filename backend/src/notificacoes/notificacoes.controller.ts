import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserActual } from '../auth/user.decorator';
import { NotificacoesService } from './notificacoes.service';

@UseGuards(JwtAuthGuard)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private svc: NotificacoesService) {}

  @Get()
  listar(@UserActual() user: any) { return this.svc.listar(user.id); }

  @Get('por-ler')
  porLer(@UserActual() user: any) { return this.svc.contarPorLer(user.id); }

  @Patch(':id/lida')
  lida(@Param('id') id: string, @UserActual() user: any) { return this.svc.marcarLida(id, user.id); }

  @Patch('ler-todas')
  lerTodas(@UserActual() user: any) { return this.svc.lerTodas(user.id); }
}

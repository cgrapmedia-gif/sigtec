import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { ManutencaoService } from './manutencao.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Perfis('ADMIN', 'TECNICO')
@Controller('manutencao')
export class ManutencaoController {
  constructor(private svc: ManutencaoService) {}

  @Get()
  listar() { return this.svc.listar(); }

  @Post()
  criar(@Body() dto: any) { return this.svc.criar(dto); }

  @Patch(':id/concluir')
  concluir(@Param('id') id: string, @Body('observacoes') obs: string, @UserActual() user: any) {
    return this.svc.concluir(id, user.nome, obs);
  }
}

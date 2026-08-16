import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { ActivosService } from './activos.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activos')
export class ActivosController {
  constructor(private svc: ActivosService) {}

  @Get() @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  listar() { return this.svc.listar(); }

  @Get('candidatos-abate') @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  candidatos() { return this.svc.candidatosAbate(); }

  @Get(':id')
  obter(@Param('id') id: string, @UserActual() user: any) { return this.svc.obter(id, user); }

  @Post() @Perfis('ADMIN', 'TECNICO')
  criar(@Body() dto: any, @UserActual() user: any) { return this.svc.criar(dto, user); }
}

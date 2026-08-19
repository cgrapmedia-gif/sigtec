import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { DepartamentosService } from './departamentos.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departamentos')
export class DepartamentosController {
  constructor(private svc: DepartamentosService) {}

  @Get()
  listar() { return this.svc.listar(); }

  @Post() @Perfis('ADMIN')
  criar(@Body('nome') nome: string, @UserActual() user: any) { return this.svc.criar(nome, user); }

  @Patch(':id') @Perfis('ADMIN')
  actualizar(@Param('id') id: string, @Body('nome') nome: string, @UserActual() user: any) {
    return this.svc.actualizar(id, nome, user);
  }

  @Delete(':id') @Perfis('ADMIN')
  eliminar(@Param('id') id: string, @UserActual() user: any) { return this.svc.eliminar(id, user); }
}

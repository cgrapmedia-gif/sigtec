import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { PedidosService } from './pedidos.service';

class CriarPedidoDto {
  @IsString() @MaxLength(200) assunto!: string;
  @IsOptional() @IsString() descricao?: string;
  @IsIn(['Hardware', 'Software', 'Rede', 'Impressão', 'Aplicação', 'Sistema biométrico']) categoria!: string;
  @IsIn(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']) prioridade!: any;
  @IsOptional() @IsString() activoId?: string;
}

class ActualizarEstadoDto {
  @IsIn(['NOVO', 'EM_ANALISE', 'EM_RESOLUCAO', 'AGUARDA_MATERIAL', 'RESOLVIDO', 'FECHADO']) estado!: any;
  @IsOptional() @IsString() nota?: string;
  @IsOptional() interno?: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pedidos')
export class PedidosController {
  constructor(private svc: PedidosService) {}

  @Get()
  listar(@UserActual() user: any) { return this.svc.listar(user); }

  @Get(':id')
  obter(@Param('id') id: string, @UserActual() user: any) { return this.svc.obter(id, user); }

  @Post()
  criar(@Body() dto: CriarPedidoDto, @UserActual() user: any) { return this.svc.criar(dto, user); }

  @Patch(':id/estado') @Perfis('ADMIN', 'TECNICO')
  estado(@Param('id') id: string, @Body() dto: ActualizarEstadoDto, @UserActual() user: any) {
    return this.svc.actualizarEstado(id, dto, user);
  }

  @Post(':id/comentarios')
  comentar(@Param('id') id: string, @Body('texto') texto: string, @UserActual() user: any) {
    return this.svc.comentar(id, texto, user);
  }
}

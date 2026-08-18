import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { ConhecimentoService } from './conhecimento.service';

class ArtigoDto {
  @IsString() @MinLength(5) titulo!: string;
  @IsIn(['Hardware', 'Software', 'Rede', 'Impressão', 'Aplicação', 'Sistema biométrico', 'Procedimentos']) categoria!: string;
  @IsString() @MinLength(20) corpo!: string;
  @IsOptional() @IsString() palavrasChave?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conhecimento')
export class ConhecimentoController {
  constructor(private svc: ConhecimentoService) {}

  @Get()
  listar(@Query('pesquisa') pesquisa?: string, @Query('categoria') categoria?: string) {
    return this.svc.listar(pesquisa, categoria);
  }

  @Get(':id')
  obter(@Param('id') id: string) { return this.svc.obter(id); }

  @Post() @Perfis('ADMIN', 'TECNICO')
  criar(@Body() dto: ArtigoDto, @UserActual() user: any) { return this.svc.criar(dto, user.id); }

  @Patch(':id') @Perfis('ADMIN', 'TECNICO')
  actualizar(@Param('id') id: string, @Body() dto: any) { return this.svc.actualizar(id, dto); }
}

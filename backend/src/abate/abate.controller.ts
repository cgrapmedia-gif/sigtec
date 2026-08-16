import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ArrayNotEmpty, IsArray, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { AbateService } from './abate.service';

class CriarPropostaDto {
  @IsArray() @ArrayNotEmpty() activoIds!: string[];
  @IsString() @MinLength(10) parecer!: string;
  @IsString() destino!: string;
  @IsString() sanitizacao!: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('abate')
export class AbateController {
  constructor(private svc: AbateService) {}

  @Get('propostas') @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  propostas() { return this.svc.listarPropostas(); }

  @Get('autos') @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  autos() { return this.svc.listarAutos(); }

  @Post('propostas') @Perfis('ADMIN', 'TECNICO')
  criar(@Body() dto: CriarPropostaDto, @UserActual() user: any) { return this.svc.criarProposta(dto, user); }

  @Patch('propostas/:id/submeter') @Perfis('ADMIN')
  submeter(@Param('id') id: string, @UserActual() user: any) { return this.svc.submeterDireccao(id, user); }

  @Patch('propostas/:id/aprovar') @Perfis('DIRECCAO')
  aprovar(@Param('id') id: string, @UserActual() user: any) { return this.svc.aprovar(id, user); }

  @Get('autos/:id/pdf') @Perfis('ADMIN', 'TECNICO', 'DIRECCAO')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const { numero, buffer } = await this.svc.pdfAuto(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Auto-de-Abate-${numero}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}

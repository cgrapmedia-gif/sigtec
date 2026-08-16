import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Perfis, RolesGuard } from '../auth/roles.guard';
import { UserActual } from '../auth/user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Perfis('ADMIN', 'TECNICO')
@Controller('questionario')
export class QuestionarioController {
  constructor(private prisma: PrismaService) {}

  @Get()
  listar() {
    return this.prisma.respostaQuestionario.findMany({ include: { autor: { select: { nome: true } } }, orderBy: { criadoEm: 'desc' } });
  }

  @Post()
  responder(@Body() dto: any, @UserActual() user: any) {
    return this.prisma.respostaQuestionario.create({
      data: { autorId: user.id, problema: dto.problema, equipamento: dto.equipamento, ferramenta: dto.ferramenta, automatizar: dto.automatizar, formacao: dto.formacao },
    });
  }
}

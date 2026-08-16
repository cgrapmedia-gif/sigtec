import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  registar(dados: { quemNome: string; quemPerfil: string; accao: string; titularNome?: string; ip?: string }) {
    // Registo imutavel: apenas insercao, nunca edicao/apagamento
    return this.prisma.logAuditoria.create({ data: dados });
  }

  /** Data Tracker: um funcionario ve apenas os acessos aos seus dados; gestores veem tudo */
  listar(user: { nome: string; perfil: string }) {
    const filtro = user.perfil === 'FUNCIONARIO' ? { titularNome: user.nome } : {};
    return this.prisma.logAuditoria.findMany({ where: filtro, orderBy: { quando: 'desc' }, take: 100 });
  }
}

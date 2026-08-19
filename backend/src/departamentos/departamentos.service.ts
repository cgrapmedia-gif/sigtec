import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class DepartamentosService {
  constructor(private prisma: PrismaService, private auditoria: AuditoriaService) {}

  async listar() {
    const deps = await this.prisma.departamento.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { users: true, activos: true } } },
    });
    return deps.map((d) => ({ ...d, totalUsers: d._count.users, totalItens: d._count.activos }));
  }

  async criar(nome: string, quem: { nome: string; perfil: string }) {
    const limpo = nome?.trim();
    if (!limpo || limpo.length < 2) throw new BadRequestException('Indique o nome do departamento.');
    if (await this.prisma.departamento.findUnique({ where: { nome: limpo } })) {
      throw new BadRequestException('Já existe um departamento com este nome.');
    }
    const d = await this.prisma.departamento.create({ data: { nome: limpo } });
    await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Criou o departamento «${limpo}»` });
    return d;
  }

  async actualizar(id: string, nome: string, quem: { nome: string; perfil: string }) {
    const limpo = nome?.trim();
    if (!limpo) throw new BadRequestException('Indique o nome do departamento.');
    const d = await this.prisma.departamento.update({ where: { id }, data: { nome: limpo } });
    await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Renomeou um departamento para «${limpo}»` });
    return d;
  }

  /** Só é possível eliminar departamentos sem utilizadores nem itens associados */
  async eliminar(id: string, quem: { nome: string; perfil: string }) {
    const d = await this.prisma.departamento.findUnique({
      where: { id }, include: { _count: { select: { users: true, activos: true } } },
    });
    if (!d) throw new BadRequestException('Departamento não encontrado.');
    if (d._count.users > 0 || d._count.activos > 0) {
      throw new BadRequestException(
        `Não é possível eliminar: há ${d._count.users} utilizador(es) e ${d._count.activos} item(ns) associados. Reafecte-os primeiro.`,
      );
    }
    await this.prisma.departamento.delete({ where: { id } });
    await this.auditoria.registar({ quemNome: quem.nome, quemPerfil: quem.perfil, accao: `Eliminou o departamento «${d.nome}»` });
    return { ok: true };
  }
}

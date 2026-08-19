import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

const SELECT_PUBLICO = {
  id: true, nome: true, utilizador: true, email: true, perfil: true, activo: true,
  localizacao: true, criadoEm: true, precisaTrocarPassword: true,
  departamento: { select: { id: true, nome: true } },
};

/** Normaliza um nome para utilizador: «Luísa Baptista» → «luisa.baptista» */
export function utilizadorDe(nome: string): string {
  const partes = nome.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/[^a-z\s-]/g, '')
    .split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0];
  return `${partes[0]}.${partes[partes.length - 1]}`;
}

export const DOMINIO_INSTITUCIONAL = 'consuladoporto.gov.ao';

/** Gera uma palavra-passe temporária legível (ex.: SIGTEC-4821-kx) */
function gerarPasswordTemporaria(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const letras = Math.random().toString(36).slice(2, 4);
  return `SIGTEC-${num}-${letras}`;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
    private notificacoes: NotificacoesService,
  ) {}

  listar() {
    return this.prisma.user.findMany({ select: SELECT_PUBLICO, orderBy: [{ activo: 'desc' }, { nome: 'asc' }] });
  }

  /** Contas criadas apenas por convite do Administrador (RF-AUTH-02) */
  listarSimples() {
    return this.prisma.user.findMany({
      where: { activo: true },
      select: { id: true, nome: true, perfil: true, localizacao: true, departamento: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  /** Sugere o utilizador institucional a partir do nome, garantindo unicidade */
  async sugerirUtilizador(nome: string) {
    const base = utilizadorDe(nome);
    if (!base) return { utilizador: '', email: '' };
    let candidato = base;
    let n = 1;
    while (await this.prisma.user.findFirst({ where: { OR: [{ utilizador: candidato }, { email: `${candidato}@${DOMINIO_INSTITUCIONAL}` }] } })) {
      n++;
      candidato = `${base}${n}`;
    }
    return { utilizador: candidato, email: `${candidato}@${DOMINIO_INSTITUCIONAL}` };
  }

  async criar(
    dto: { nome: string; email?: string; utilizador?: string; perfil: any; departamentoId?: string; localizacao?: string },
    quem: { nome: string; perfil: string },
  ) {
    // O utilizador segue o formato institucional primeiro.ultimo
    const utilizador = (dto.utilizador?.trim() || utilizadorDe(dto.nome)).toLowerCase();
    const email = (dto.email?.trim() || `${utilizador}@${DOMINIO_INSTITUCIONAL}`).toLowerCase();
    if (!/^[a-z0-9]+\.[a-z0-9.]+@/.test(email) && !dto.email) {
      throw new BadRequestException('Não foi possível gerar o utilizador a partir do nome. Indique-o manualmente.');
    }
    const existe = await this.prisma.user.findFirst({ where: { OR: [{ utilizador }, { email }] } });
    if (existe) throw new BadRequestException('Já existe uma conta com este utilizador.');

    const passwordTemporaria = gerarPasswordTemporaria();
    const user = await this.prisma.user.create({
      data: {
        nome: dto.nome.trim(),
        utilizador,
        email,
        perfil: dto.perfil,
        passwordHash: await bcrypt.hash(passwordTemporaria, 10),
        departamentoId: dto.departamentoId || null,
        localizacao: dto.localizacao || null,
        precisaTrocarPassword: true,
      },
      select: SELECT_PUBLICO,
    });

    await this.auditoria.registar({
      quemNome: quem.nome, quemPerfil: quem.perfil,
      accao: `Criou a conta de ${user.nome} (${user.perfil})`, titularNome: user.nome,
    });
    await this.notificacoes.criar(
      user.id,
      'Bem-vindo(a) ao SIGTEC',
      'A sua conta foi criada. Por segurança, defina uma palavra-passe pessoal no primeiro acesso.',
      '/conta',
    );

    // A password temporária é devolvida uma única vez, para entrega ao utilizador
    return { user, passwordTemporaria };
  }

  /** Alteração de perfil, departamento e posto pelo Administrador */
  async actualizar(id: string, dto: any, quem: { nome: string; perfil: string }) {
    const antes = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const dados: any = {};
    if (dto.nome !== undefined) dados.nome = String(dto.nome).trim();
    if (dto.perfil !== undefined) dados.perfil = dto.perfil;
    if (dto.departamentoId !== undefined) dados.departamentoId = dto.departamentoId || null;
    if (dto.localizacao !== undefined) dados.localizacao = dto.localizacao || null;
    const user = await this.prisma.user.update({ where: { id }, data: dados, select: SELECT_PUBLICO });
    if (dto.perfil && dto.perfil !== antes.perfil) {
      await this.notificacoes.criar(id, 'Perfil de acesso alterado', `O seu perfil passou a ${dto.perfil}.`, '/permissoes');
    }
    await this.auditoria.registar({
      quemNome: quem.nome, quemPerfil: quem.perfil,
      accao: `Actualizou a conta de ${antes.nome}${dto.perfil && dto.perfil !== antes.perfil ? ` (perfil: ${antes.perfil} → ${dto.perfil})` : ''}`,
      titularNome: antes.nome,
    });
    return user;
  }

  async definirActivo(id: string, activo: boolean, quem: { nome: string; perfil: string }) {
    const user = await this.prisma.user.update({ where: { id }, data: { activo }, select: SELECT_PUBLICO });
    await this.auditoria.registar({
      quemNome: quem.nome, quemPerfil: quem.perfil,
      accao: `${activo ? 'Reactivou' : 'Desactivou'} a conta de ${user.nome}`, titularNome: user.nome,
    });
    return user;
  }

  /** Administrador repõe a password de um utilizador (esquecimento) */
  async reporPassword(id: string, quem: { nome: string; perfil: string }) {
    const alvo = await this.prisma.user.findUnique({ where: { id } });
    if (!alvo) throw new NotFoundException('Utilizador não encontrado.');
    const passwordTemporaria = gerarPasswordTemporaria();
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(passwordTemporaria, 10), precisaTrocarPassword: true },
    });
    await this.auditoria.registar({
      quemNome: quem.nome, quemPerfil: quem.perfil,
      accao: `Repôs a palavra-passe de ${alvo.nome}`, titularNome: alvo.nome,
    });
    await this.notificacoes.criar(id, 'Palavra-passe reposta', 'O Administrador repôs a sua palavra-passe. Defina uma nova no próximo acesso.', '/conta');
    return { passwordTemporaria };
  }

  /** O próprio utilizador altera a sua palavra-passe */
  async alterarPassword(userId: string, actual: string, nova: string) {
    if (nova.length < 8) throw new BadRequestException('A nova palavra-passe deve ter pelo menos 8 caracteres.');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await bcrypt.compare(actual, user.passwordHash);
    if (!ok) throw new UnauthorizedException('A palavra-passe actual não está correcta.');
    if (actual === nova) throw new BadRequestException('A nova palavra-passe tem de ser diferente da actual.');
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(nova, 10), precisaTrocarPassword: false },
    });
    await this.auditoria.registar({
      quemNome: user.nome, quemPerfil: user.perfil,
      accao: 'Alterou a própria palavra-passe', titularNome: user.nome,
    });
    return { ok: true };
  }

  departamentos() {
    return this.prisma.departamento.findMany({ orderBy: { nome: 'asc' } });
  }
}

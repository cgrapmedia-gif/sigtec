import { getUser } from './api';

/** Verifica uma permissão do utilizador em sessão. A lista vem do backend no início de sessão. */
export function pode(permissao: string): boolean {
  const u = getUser();
  return Array.isArray(u?.permissoes) ? u.permissoes.includes(permissao) : false;
}

export const ROTULO_PERFIL: Record<string, string> = {
  FUNCIONARIO: 'Funcionário(a)',
  TECNICO: 'Técnico',
  ADMIN: 'Administrador',
  DIRECCAO: 'Direcção',
};

/** Cliente HTTP do SIGTEC — anexa o token JWT e trata sessões expiradas. */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sigtec_token');
}
export function setSessao(token: string, user: unknown) {
  localStorage.setItem('sigtec_token', token);
  localStorage.setItem('sigtec_user', JSON.stringify(user));
}
export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('sigtec_user');
  return raw ? JSON.parse(raw) : null;
}
export function terminarSessao() {
  localStorage.removeItem('sigtec_token');
  localStorage.removeItem('sigtec_user');
  window.location.href = '/login';
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/login')) {
    terminarSessao();
    throw new Error('Sessão expirada. Inicie sessão novamente.');
  }
  if (!res.ok) {
    const corpo = await res.json().catch(() => null);
    throw new Error(corpo?.message ?? `Erro ${res.status}`);
  }
  return res.json();
}

export const API_BASE = BASE;

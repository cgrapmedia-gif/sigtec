'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, getUser, terminarSessao } from '@/lib/api';
import Notificacoes from '@/components/Notificacoes';

type Item = { href: string; nome: string; curto?: string; ico: string; grupo: string; perfis: string[] };

const NAV: Item[] = [
  { href: '/painel', nome: 'Painel', curto: 'Painel', ico: '▦', grupo: 'Visão', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/pedidos', nome: 'Pedidos Técnicos', curto: 'Pedidos', ico: '⚑', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/activos', nome: 'Itens de Configuração', curto: 'Itens', ico: '⛁', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/inventario', nome: 'Inventário Geral', curto: 'Invent.', ico: '📋', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/abate', nome: 'Obsolescência & Abate', curto: 'Abate', ico: '♻', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/manutencao', nome: 'Manutenção Preventiva', curto: 'Manut.', ico: '⚙', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO'] },
  { href: '/conhecimento', nome: 'Base de Conhecimento', curto: 'Ajuda', ico: '📖', grupo: 'Conhecimento', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/questionario', nome: 'Questionário Técnico', ico: '✎', grupo: 'Conhecimento', perfis: ['ADMIN', 'TECNICO'] },
  { href: '/relatorios', nome: 'Relatórios & Indicadores', curto: 'Relat.', ico: '▤', grupo: 'Conhecimento', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/transparencia', nome: 'Transparência', ico: '◉', grupo: 'Governação Digital', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/categorias', nome: 'Categorias', ico: '🏷', grupo: 'Configuração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/fornecedores', nome: 'Fornecedores & Contratos', ico: '🤝', grupo: 'Configuração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/departamentos', nome: 'Departamentos', ico: '🏛', grupo: 'Configuração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/sintomas', nome: 'Catálogo de Sintomas', ico: '🩺', grupo: 'Configuração', perfis: ['ADMIN', 'TECNICO'] },
  { href: '/resolucoes', nome: 'Procedimentos de Resolução', ico: '🔧', grupo: 'Configuração', perfis: ['ADMIN', 'TECNICO'] },
  { href: '/utilizadores', nome: 'Utilizadores', ico: '👤', grupo: 'Administração', perfis: ['ADMIN', 'DIRECCAO'] },
  { href: '/permissoes', nome: 'Quadro de Permissões', ico: '🔒', grupo: 'Administração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/conta', nome: 'A Minha Conta', ico: '🔑', grupo: 'Administração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
];

/** Quatro destinos na barra inferior, escolhidos pelo que cada perfil faz mais vezes */
const NAV_INFERIOR: Record<string, string[]> = {
  FUNCIONARIO: ['/painel', '/pedidos', '/conhecimento', '/conta'],
  TECNICO: ['/painel', '/pedidos', '/activos', '/manutencao'],
  ADMIN: ['/painel', '/pedidos', '/activos', '/abate'],
  DIRECCAO: ['/painel', '/pedidos', '/abate', '/relatorios'],
};

const ROTULO_PERFIL: Record<string, string> = {
  FUNCIONARIO: 'Funcionário(a)', TECNICO: 'Técnico', ADMIN: 'Administrador', DIRECCAO: 'Direcção',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    const u = getUser();
    setUser(u);
    if (u?.precisaTrocarPassword && pathname !== '/conta') router.replace('/conta');
  }, [router, pathname]);

  // Fecha o menu ao navegar e bloqueia o deslize do fundo enquanto está aberto
  useEffect(() => { setMenuAberto(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuAberto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuAberto]);

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-cinza text-sm">A carregar sessão…</div>
    );
  }

  const itensPerfil = NAV.filter((n) => n.perfis.includes(user.perfil));
  const inferior = (NAV_INFERIOR[user.perfil] ?? NAV_INFERIOR.FUNCIONARIO)
    .map((h) => itensPerfil.find((n) => n.href === h)).filter(Boolean) as Item[];
  const actual = itensPerfil.find((n) => pathname.startsWith(n.href));
  const iniciais = user.nome.split(' ').map((p: string) => p[0]).slice(0, 2).join('');
  let grupoAnterior = '';

  return (
    <div className="min-h-dvh">
      {/* ---------- Menu lateral: permanente a partir de 1024 px, gaveta abaixo disso ---------- */}
      <aside
        className={`barra-lateral w-[270px] max-w-[85vw] bg-preto text-[#EDE9E0] flex flex-col fixed inset-y-0 left-0 z-50
                    transition-transform duration-200 lg:translate-x-0 ${menuAberto ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!menuAberto}
      >
        <div className="p-5 border-b border-white/10 flex items-start gap-2">
          <div className="flex-1">
            <div className="text-xl font-bold">SIG<span className="text-douradoClaro">TEC</span></div>
            <div className="text-[10px] uppercase tracking-wider text-[#A79F92] mt-1 leading-snug">
              Consulado Geral de Angola<br />no Porto
            </div>
          </div>
          <button onClick={() => setMenuAberto(false)} aria-label="Fechar menu"
            className="lg:hidden w-9 h-9 rounded-lg border border-white/20 text-[#CFC9BD]">✕</button>
        </div>
        <div className="h-[3px] bg-[linear-gradient(90deg,#B5121B_0_50%,#B8860B_50%_100%)]" />

        <nav className="flex-1 p-2.5 overflow-y-auto">
          {itensPerfil.map((n) => {
            const mostrarGrupo = n.grupo !== grupoAnterior;
            grupoAnterior = n.grupo;
            const activo = pathname.startsWith(n.href);
            return (
              <div key={n.href}>
                {mostrarGrupo && <div className="text-[10px] uppercase tracking-widest text-[#7C7568] px-3 pt-3 pb-1.5">{n.grupo}</div>}
                <Link href={n.href}
                  className={`flex items-center gap-2.5 px-3 rounded-lg text-[13.5px] font-medium mb-0.5 transition min-h-[44px]
                              ${activo ? 'bg-vermelho text-white' : 'text-[#CFC9BD] hover:bg-white/5 active:bg-white/10'}`}>
                  <span className="w-5 text-center">{n.ico}</span>{n.nome}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-dourado text-white flex items-center justify-center font-bold text-[13px] shrink-0">{iniciais}</span>
          <span className="flex-1 min-w-0">
            <b className="block text-[12.5px] truncate">{user.nome}</b>
            <span className="text-[10.5px] text-[#A79F92]">{ROTULO_PERFIL[user.perfil]}</span>
          </span>
          <button onClick={terminarSessao} className="text-[11px] border border-white/20 rounded-md px-2.5 py-2 hover:border-dourado">Sair</button>
        </div>
      </aside>

      {menuAberto && (
        <div className="fixed inset-0 bg-preto/60 z-40 lg:hidden" onClick={() => setMenuAberto(false)} aria-hidden />
      )}

      {/* ---------- Conteúdo ---------- */}
      <div className="lg:ml-[270px] flex flex-col min-h-dvh">
        <header className="sticky top-0 z-30 bg-papel/95 backdrop-blur border-b border-linha">
          <div className="flex items-center gap-2 px-4 lg:px-7 py-2.5 max-w-[1240px]">
            <button className="lg:hidden w-11 h-11 -ml-1 rounded-lg text-xl" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">☰</button>
            <h1 className="flex-1 text-[15px] lg:text-base font-bold truncate">{actual?.nome ?? 'SIGTEC'}</h1>
            <span className="hidden xl:inline text-[11px] text-cinza mr-1">Sessão auditada</span>
            <Notificacoes />
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-7 pt-4 pb-24 lg:pb-10 max-w-[1240px] w-full">
          {children}
        </main>
      </div>

      {/* ---------- Barra inferior: as acções mais usadas ao alcance do polegar ---------- */}
      <nav className="nav-inferior" aria-label="Navegação principal">
        {inferior.map((n) => (
          <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? 'activo' : ''}>
            <span>{n.ico}</span>
            <span>{n.curto ?? n.nome}</span>
          </Link>
        ))}
        <button onClick={() => setMenuAberto(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-cinza min-h-[56px]">
          <span className="text-[19px] leading-none">☰</span>
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
}

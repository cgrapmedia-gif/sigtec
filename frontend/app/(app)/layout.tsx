'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, getUser, terminarSessao } from '@/lib/api';
import Notificacoes from '@/components/Notificacoes';

const NAV = [
  { href: '/painel', nome: 'Painel Geral', ico: '▦', grupo: 'Visão', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/pedidos', nome: 'Pedidos Técnicos', ico: '⚑', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/activos', nome: 'Itens de Configuração', ico: '⛁', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/abate', nome: 'Obsolescência & Abate', ico: '♻', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/manutencao', nome: 'Manutenção Preventiva', ico: '⚙', grupo: 'Operação', perfis: ['ADMIN', 'TECNICO'] },
  { href: '/conhecimento', nome: 'Base de Conhecimento', ico: '📖', grupo: 'Conhecimento', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/questionario', nome: 'Questionário Técnico', ico: '✎', grupo: 'Conhecimento', perfis: ['ADMIN', 'TECNICO'] },
  { href: '/relatorios', nome: 'Relatórios & Indicadores', ico: '▤', grupo: 'Conhecimento', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/transparencia', nome: 'Transparência', ico: '◉', grupo: 'Governação Digital', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/categorias', nome: 'Categorias', ico: '🏷', grupo: 'Configuração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/fornecedores', nome: 'Fornecedores & Contratos', ico: '🤝', grupo: 'Configuração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/departamentos', nome: 'Departamentos', ico: '🏛', grupo: 'Configuração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO'] },
  { href: '/utilizadores', nome: 'Utilizadores', ico: '👤', grupo: 'Administração', perfis: ['ADMIN', 'DIRECCAO'] },
  { href: '/permissoes', nome: 'Quadro de Permissões', ico: '🔒', grupo: 'Administração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
  { href: '/conta', nome: 'A Minha Conta', ico: '🔑', grupo: 'Administração', perfis: ['ADMIN', 'TECNICO', 'DIRECCAO', 'FUNCIONARIO'] },
];

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
    // Primeiro acesso ou password reposta: definir palavra-passe pessoal antes de usar o sistema
    if (u?.precisaTrocarPassword && pathname !== '/conta') router.replace('/conta');
  }, [router, pathname]);

  if (!user) return <div className="min-h-screen flex items-center justify-center text-cinza text-sm">A carregar sessão…</div>;

  const iniciais = user.nome.split(' ').map((p: string) => p[0]).slice(0, 2).join('');
  let grupoAnterior = '';

  return (
    <div className="flex min-h-screen">
      <aside className={`barra-lateral w-[250px] max-w-[82vw] bg-preto text-[#EDE9E0] flex flex-col fixed inset-y-0 left-0 z-40 transition-transform md:translate-x-0 ${menuAberto ? '' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-white/10">
          <div className="text-xl font-bold">SIG<span className="text-douradoClaro">TEC</span> 2.0</div>
          <div className="text-[10px] uppercase tracking-wider text-[#A79F92] mt-1 leading-snug">
            Consulado Geral de Angola<br />no Porto · Gestão Tecnológica
          </div>
        </div>
        <div className="h-[3px] bg-[linear-gradient(90deg,#B5121B_0_50%,#B8860B_50%_100%)]" />
        <nav className="flex-1 p-2.5 overflow-y-auto">
          {NAV.filter((n) => n.perfis.includes(user.perfil)).map((n) => {
            const mostrarGrupo = n.grupo !== grupoAnterior;
            grupoAnterior = n.grupo;
            const activo = pathname.startsWith(n.href);
            return (
              <div key={n.href}>
                {mostrarGrupo && <div className="text-[10px] uppercase tracking-widest text-[#7C7568] px-3 pt-3 pb-1.5">{n.grupo}</div>}
                <Link href={n.href} onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium mb-0.5 transition ${activo ? 'bg-vermelho text-white' : 'text-[#CFC9BD] hover:bg-white/5'}`}>
                  <span className="w-4 text-center">{n.ico}</span>{n.nome}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-dourado text-white flex items-center justify-center font-bold text-[13px]">{iniciais}</span>
          <span className="flex-1 min-w-0">
            <b className="block text-[12.5px] truncate">{user.nome}</b>
            <span className="text-[10.5px] text-[#A79F92]">{ROTULO_PERFIL[user.perfil]}</span>
          </span>
          <button onClick={terminarSessao} className="text-[11px] border border-white/20 rounded-md px-2 py-1 hover:border-dourado">Sair</button>
        </div>
      </aside>

      {menuAberto && <div className="fixed inset-0 bg-preto/50 z-30 md:hidden" onClick={() => setMenuAberto(false)} />}

      <main className="flex-1 md:ml-[250px] px-4 md:px-7 pb-10 max-w-[1240px]">
        <header className="flex items-center gap-3 py-3.5 border-b border-linha mb-5 sticky top-0 bg-papel z-20">
          <button className="md:hidden border border-linha rounded-lg w-11 h-11 text-lg bg-white" onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu">☰</button>
          <div className="flex-1" />
          <span className="hidden sm:inline text-[11px] text-cinza">Sessão auditada · Data Tracker activo</span>
          <Notificacoes />
        </header>
        {children}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </main>
    </div>
  );
}

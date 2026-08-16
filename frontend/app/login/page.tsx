'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSessao } from '@/lib/api';

const CONTAS = [
  { email: 'l.baptista@consuladoporto.gov.ao', nome: 'Luísa Baptista', cargo: 'Funcionária — Secretaria', ini: 'LB', cor: 'bg-azul' },
  { email: 'r.sousa@consuladoporto.gov.ao', nome: 'Rui Sousa', cargo: 'Técnico de Informática', ini: 'RS', cor: 'bg-verde' },
  { email: 'c.miranda@consuladoporto.gov.ao', nome: 'Carlos Miranda', cargo: 'Administrador do Sistema', ini: 'CM', cor: 'bg-vermelho' },
  { email: 'direccao@consuladoporto.gov.ao', nome: 'Ana Van-Dúnem', cargo: 'Direcção', ini: 'DV', cor: 'bg-dourado' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(false);

  async function entrar(e?: React.FormEvent, emailDirecto?: string) {
    e?.preventDefault();
    setErro('');
    setACarregar(true);
    try {
      const r = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailDirecto ?? email, password: password || 'sigtec2026' }),
      });
      setSessao(r.access_token, r.user);
      router.push('/painel');
    } catch (err: any) {
      setErro(err.message ?? 'Não foi possível iniciar sessão.');
    } finally {
      setACarregar(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-5 bg-[radial-gradient(1100px_600px_at_20%_-10%,#2E2820,#16130F_60%)]">
      <div className="w-full max-w-4xl grid md:grid-cols-[1fr_1.2fr] bg-white rounded-2xl overflow-hidden shadow-2xl">
        <section className="bg-preto text-[#EDE9E0] p-9 flex flex-col">
          <h1 className="text-3xl font-bold">SIG<span className="text-douradoClaro">TEC</span> <span className="text-base text-cinza">2.0</span></h1>
          <div className="h-1 w-24 mt-3 mb-4 bg-[linear-gradient(90deg,#B5121B_0_50%,#B8860B_50%_100%)]" />
          <p className="text-[11px] uppercase tracking-widest text-[#A79F92] leading-relaxed">
            Consulado Geral de Angola no Porto<br />Sistema Integrado de Gestão Tecnológica e Manutenção
          </p>
          <p className="text-[13px] text-[#CFC9BD] mt-5 leading-relaxed">
            Gestão de activos, pedidos técnicos e manutenção segundo os princípios da governação digital:
            dados pedidos uma única vez, transparência total e serviços proactivos.
          </p>
          <p className="mt-auto pt-6 text-[11px] text-[#7C7568] leading-relaxed">
            🔒 Acesso restrito · Contas criadas por convite<br />Sessões auditadas · RGPD
          </p>
        </section>

        <section className="p-9">
          <h2 className="text-lg font-bold">Iniciar sessão</h2>
          <p className="text-xs text-cinza mb-4">Email institucional e palavra-passe.</p>

          <form onSubmit={entrar} className="space-y-3 mb-5">
            <div>
              <label className="campo-rotulo">Email institucional</label>
              <input className="campo-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@consuladoporto.gov.ao" required />
            </div>
            <div>
              <label className="campo-rotulo">Palavra-passe</label>
              <input className="campo-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {erro && <p className="text-[13px] text-vermelho font-medium">{erro}</p>}
            <button className="btn-primario w-full justify-center" disabled={aCarregar}>
              {aCarregar ? 'A validar…' : 'Entrar'}
            </button>
          </form>

          <p className="text-[11px] uppercase tracking-wide text-cinza mb-2">Contas de demonstração (password: sigtec2026)</p>
          <div className="space-y-2">
            {CONTAS.map((c) => (
              <button key={c.email} onClick={() => entrar(undefined, c.email)}
                className="w-full flex items-center gap-3 border border-linha rounded-xl p-3 text-left hover:border-dourado hover:bg-[#FDFBF5] transition">
                <span className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm ${c.cor}`}>{c.ini}</span>
                <span className="flex-1 min-w-0">
                  <b className="block text-sm">{c.nome}</b>
                  <span className="text-[11px] text-cinza">{c.cargo}</span>
                </span>
                <span className="text-cinza">→</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

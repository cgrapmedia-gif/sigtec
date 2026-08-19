'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSessao } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [utilizador, setUtilizador] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [ajuda, setAjuda] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!utilizador.trim() || !password) { setErro('Preencha o utilizador e a palavra-passe.'); return; }
    setACarregar(true);
    try {
      const r = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ utilizador: utilizador.trim().toLowerCase(), password }),
      });
      setSessao(r.access_token, r.user);
      router.push('/painel');
    } catch (err: any) {
      setErro(err.message === 'Credenciais inválidas.'
        ? 'Utilizador ou palavra-passe incorrectos. Verifique e tente novamente.'
        : err.message);
    } finally { setACarregar(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(1100px_600px_at_20%_-10%,#2E2820,#16130F_60%)]">
      <div className="w-full max-w-4xl grid md:grid-cols-[1fr_1.1fr] bg-white rounded-2xl overflow-hidden shadow-2xl">

        <section className="bg-preto text-[#EDE9E0] p-7 sm:p-9 flex flex-col">
          <h1 className="text-3xl font-bold">SIG<span className="text-douradoClaro">TEC</span></h1>
          <div className="h-1 w-24 mt-3 mb-4 bg-[linear-gradient(90deg,#B5121B_0_50%,#B8860B_50%_100%)]" />
          <p className="text-[11px] uppercase tracking-widest text-[#A79F92] leading-relaxed">
            Consulado Geral de Angola no Porto<br />Gestão Tecnológica e Manutenção
          </p>
          <p className="text-[13.5px] text-[#CFC9BD] mt-5 leading-relaxed">
            Precisa de ajuda com um computador, impressora ou com a internet? Entre e descreva o problema
            por palavras suas — o sistema trata do resto.
          </p>
          <p className="mt-auto pt-6 text-[11px] text-[#7C7568] leading-relaxed">
            🔒 Acesso restrito · Todas as sessões são registadas
          </p>
        </section>

        <section className="p-7 sm:p-9">
          <h2 className="text-xl font-bold">Iniciar sessão</h2>
          <p className="text-[13px] text-cinza mb-5">Use o seu utilizador institucional.</p>

          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label htmlFor="utilizador" className="campo-rotulo">Utilizador</label>
              <input id="utilizador" className="campo-input" value={utilizador}
                onChange={(e) => setUtilizador(e.target.value)}
                placeholder="primeiro.ultimo"
                autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
              <p className="text-[11.5px] text-cinza mt-1">
                É o seu nome no formato <b>primeiro.ultimo</b> — por exemplo, <span className="font-mono">joao.domingos</span>
              </p>
            </div>

            <div>
              <label htmlFor="password" className="campo-rotulo">Palavra-passe</label>
              <div className="relative">
                <input id="password" className="campo-input pr-14" type={verPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 h-10 text-[12px] text-cinza font-semibold"
                  aria-label={verPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}>
                  {verPassword ? 'Esconder' : 'Mostrar'}
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-[13px] text-vermelho font-medium bg-vermelho/5 border border-vermelho/20 rounded-lg p-3">
                {erro}
              </p>
            )}

            <button className="btn-primario w-full" disabled={aCarregar}>
              {aCarregar ? 'A validar…' : 'Entrar'}
            </button>
          </form>

          <button onClick={() => setAjuda(!ajuda)}
            className="text-[12.5px] text-cinza hover:text-preto mt-5 font-medium">
            Não consigo entrar {ajuda ? '▾' : '▸'}
          </button>
          {ajuda && (
            <div className="text-[12.5px] text-cinza mt-2.5 space-y-2 border-t border-linha pt-3 leading-relaxed">
              <p><b className="text-preto">Não sabe o seu utilizador?</b> É o seu primeiro e último nome separados
                por um ponto, sem acentos. Maria Fernandes entra como <span className="font-mono">maria.fernandes</span>.</p>
              <p><b className="text-preto">Esqueceu-se da palavra-passe?</b> Contacte o Administrador do Sistema,
                que a repõe de imediato.</p>
              <p><b className="text-preto">Não tem conta?</b> As contas são criadas por convite. Peça ao seu
                superior hierárquico para solicitar o acesso.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

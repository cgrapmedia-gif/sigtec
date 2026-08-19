'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import { fmtData } from '@/lib/formato';

const CATEGORIAS = ['Hardware', 'Software', 'Rede', 'Impressão', 'Aplicação', 'Sistema biométrico', 'Procedimentos'];

export default function ConhecimentoPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const podeEscrever = ['ADMIN', 'TECNICO'].includes(user?.perfil);
  const [artigos, setArtigos] = useState<any[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [categoria, setCategoria] = useState('');
  const [aberto, setAberto] = useState<any>(null);
  const [editar, setEditar] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => {
    const q = new URLSearchParams();
    if (pesquisa) q.set('pesquisa', pesquisa);
    if (categoria) q.set('categoria', categoria);
    api(`/conhecimento?${q}`).then(setArtigos).catch((e) => setMsg(e.message));
  }, [pesquisa, categoria]);

  useEffect(() => {
    const t = setTimeout(carregar, 250); // pequena espera para não pesquisar a cada tecla
    return () => clearTimeout(t);
  }, [carregar]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex-1">Base de Conhecimento</h1>
        {podeEscrever && <button className="btn-primario" onClick={() => setEditar({})}>＋ Novo artigo</button>}
      </div>
      <p className="text-[13px] text-cinza">
        Soluções para os problemas mais frequentes. Consulte antes de abrir um pedido — muitas situações resolvem-se em minutos.
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <div className="flex gap-2.5 flex-wrap">
        <input className="campo-input flex-1 min-w-[180px]" type="search" placeholder="Pesquisar por problema, equipamento ou palavra-chave…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        <select className="campo-input w-auto" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        {artigos.map((a) => (
          <button key={a.id} onClick={() => api(`/conhecimento/${a.id}`).then(setAberto).catch((e) => setMsg(e.message))}
            className="cartao text-left hover:border-dourado transition">
            <div className="flex items-start gap-2 mb-1.5">
              <span className="pill bg-linha text-cinza">{a.categoria}</span>
              <span className="text-[11px] text-cinza ml-auto whitespace-nowrap">👁 {a.visualizacoes}</span>
            </div>
            <b className="block text-[14px] leading-snug mb-1">{a.titulo}</b>
            <p className="text-[12.5px] text-cinza line-clamp-2">{a.corpo.slice(0, 120)}…</p>
            <p className="text-[11px] text-cinza mt-2">{a.autor?.nome} · {fmtData(a.actualizadoEm)}</p>
          </button>
        ))}
        {artigos.length === 0 && (
          <p className="text-sm text-cinza col-span-full py-6 text-center">
            Nenhum artigo corresponde à pesquisa. {podeEscrever && 'Crie o primeiro artigo sobre este tema.'}
          </p>
        )}
      </div>

      {aberto && (
        <Modal titulo={aberto.categoria} fechar={() => setAberto(null)} rodape={
          <>
            {podeEscrever && <button className="btn-contorno" onClick={() => { setEditar(aberto); setAberto(null); }}>Editar artigo</button>}
            <button className="btn-secundario" onClick={() => setAberto(null)}>Fechar</button>
          </>
        }>
          <h3 className="text-lg font-bold mb-1">{aberto.titulo}</h3>
          <p className="text-[11.5px] text-cinza mb-4">Por {aberto.autor?.nome} · actualizado a {fmtData(aberto.actualizadoEm)}</p>
          <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{aberto.corpo}</div>
          {aberto.palavrasChave && <p className="text-[11.5px] text-cinza mt-4">Palavras-chave: {aberto.palavrasChave}</p>}
        </Modal>
      )}

      {editar && <FormArtigo artigo={editar} fechar={() => setEditar(null)} feito={() => { setEditar(null); carregar(); }} />}
    </div>
  );
}

function FormArtigo({ artigo, fechar, feito }: any) {
  const novo = !artigo.id;
  const [titulo, setTitulo] = useState(artigo.titulo ?? '');
  const [categoria, setCategoria] = useState(artigo.categoria ?? CATEGORIAS[0]);
  const [corpo, setCorpo] = useState(artigo.corpo ?? '');
  const [palavrasChave, setPalavrasChave] = useState(artigo.palavrasChave ?? '');
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function guardar() {
    setErro('');
    if (titulo.trim().length < 5) { setErro('O título deve ter pelo menos 5 caracteres.'); return; }
    if (corpo.trim().length < 20) { setErro('O conteúdo deve ter pelo menos 20 caracteres.'); return; }
    setAGuardar(true);
    try {
      const corpoPedido = JSON.stringify({ titulo, categoria, corpo, palavrasChave: palavrasChave || undefined });
      if (novo) await api('/conhecimento', { method: 'POST', body: corpoPedido });
      else await api(`/conhecimento/${artigo.id}`, { method: 'PATCH', body: corpoPedido });
      feito();
    } catch (e: any) { setErro(e.message); } finally { setAGuardar(false); }
  }

  return (
    <Modal titulo={novo ? 'Novo artigo' : 'Editar artigo'} fechar={fechar} rodape={
      <>
        <button className="btn-contorno" onClick={fechar}>Cancelar</button>
        <button className="btn-primario" onClick={guardar} disabled={aGuardar}>{aGuardar ? 'A guardar…' : 'Guardar artigo'}</button>
      </>
    }>
      <div className="space-y-3.5">
        <div>
          <label className="campo-rotulo">Título — descreva o problema como o utilizador o vê</label>
          <input className="campo-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Impressora encrava papel com frequência" />
        </div>
        <div>
          <label className="campo-rotulo">Categoria</label>
          <select className="campo-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="campo-rotulo">Solução (passo a passo)</label>
          <textarea className="campo-input min-h-[200px]" value={corpo} onChange={(e) => setCorpo(e.target.value)}
            placeholder={'1. Primeiro passo\n2. Segundo passo\n3. Se não resolver, abra pedido indicando…'} />
        </div>
        <div>
          <label className="campo-rotulo">Palavras-chave (separadas por vírgula)</label>
          <input className="campo-input" value={palavrasChave} onChange={(e) => setPalavrasChave(e.target.value)} placeholder="encravamento, papel, fusor" />
          <p className="text-[11px] text-cinza mt-1">Ajudam a encontrar o artigo mesmo quando o utilizador usa outras palavras.</p>
        </div>
        {erro && <p className="text-vermelho text-sm">{erro}</p>}
      </div>
    </Modal>
  );
}

function Modal({ titulo, children, rodape, fechar }: any) {
  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa sm:max-w-2xl">
        <div className="modal-cabecalho">
          <h3 className="font-bold flex-1">{titulo}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo">{children}</div>
        <div className="modal-rodape">{rodape}</div>
      </div>
    </div>
  );
}

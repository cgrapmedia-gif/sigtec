'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ResolucoesPage() {
  const [lista, setLista] = useState<any[]>([]);
  const [editar, setEditar] = useState<any>(null);
  const [filtro, setFiltro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => { api('/resolucoes').then(setLista).catch((e) => setMsg(e.message)); }, []);
  useEffect(carregar, [carregar]);

  const filtrada = lista.filter((r) =>
    (r.titulo + (r.marca ?? '') + (r.categoria ?? '') + r.sintomaChave).toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex-1">Procedimentos de Resolução</h1>
        <button className="btn-primario" onClick={() => setEditar({})}>＋ Novo procedimento</button>
      </div>
      <p className="text-[13px] text-cinza">
        Procedimentos conhecidos por fabricante e categoria. São sugeridos ao técnico quando abre um pedido
        compatível, e o sistema regista a taxa de sucesso real de cada um — os mais eficazes sobem sozinhos.
        <b> Cada procedimento aqui registado é experiência que deixa de depender de quem está de serviço.</b>
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <input className="campo-input" type="search" placeholder="Pesquisar por título, marca ou sintoma…"
        value={filtro} onChange={(e) => setFiltro(e.target.value)} />

      <div className="space-y-2.5">
        {filtrada.map((r) => (
          <button key={r.id} onClick={() => setEditar(r)}
            className={`cartao w-full text-left hover:border-dourado transition ${r.activo ? '' : 'opacity-50'}`}>
            <div className="flex items-start gap-2 flex-wrap">
              <b className="text-[14px] flex-1">{r.titulo}</b>
              {r.vezesAplicada > 0 && (
                <span className="pill bg-verde/10 text-verde">
                  {Math.round((r.vezesResolvida / r.vezesAplicada) * 100)}% sucesso ({r.vezesAplicada}×)
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-cinza mt-1">
              {[r.marca, r.categoria].filter(Boolean).join(' · ') || 'Genérico'} ·{' '}
              {(r.passos as any[])?.length ?? 0} passo(s)
              {r.tempoEstimado ? ` · ~${r.tempoEstimado} min` : ''}
              {r.pecaProvavel ? ` · peça: ${r.pecaProvavel}` : ''} · fonte: {r.fonte}
            </p>
          </button>
        ))}
        {filtrada.length === 0 && <p className="cartao text-sm text-cinza text-center">Nenhum procedimento encontrado.</p>}
      </div>

      {editar && <FormResolucao resolucao={editar} fechar={() => setEditar(null)} feito={() => { setEditar(null); carregar(); }} />}
    </div>
  );
}

function FormResolucao({ resolucao, fechar, feito }: any) {
  const novo = !resolucao.id;
  const [f, setF] = useState<any>({
    titulo: resolucao.titulo ?? '', marca: resolucao.marca ?? '', categoria: resolucao.categoria ?? '',
    sintomaChave: resolucao.sintomaChave ?? '', pecaProvavel: resolucao.pecaProvavel ?? '',
    tempoEstimado: resolucao.tempoEstimado ?? '', fonte: resolucao.fonte ?? 'Equipa técnica',
    activo: resolucao.activo ?? true,
  });
  const [passos, setPassos] = useState<string[]>((resolucao.passos as string[]) ?? ['']);
  const [erro, setErro] = useState('');
  const set = (c: string, v: any) => setF((s: any) => ({ ...s, [c]: v }));

  async function guardar() {
    if (f.titulo.trim().length < 5) { setErro('Indique um título claro.'); return; }
    if (!f.sintomaChave.trim()) { setErro('Indique as palavras-chave do sintoma.'); return; }
    try {
      const corpo = JSON.stringify({ ...f, passos: passos.filter((p) => p.trim()) });
      if (novo) await api('/resolucoes', { method: 'POST', body: corpo });
      else await api(`/resolucoes/${resolucao.id}`, { method: 'PATCH', body: corpo });
      feito();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa md:max-w-2xl">
        <div className="modal-cabecalho">
          <h3 className="font-bold flex-1">{novo ? 'Novo procedimento' : 'Editar procedimento'}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo space-y-3.5">
          <div>
            <label className="campo-rotulo">Título</label>
            <input className="campo-input" value={f.titulo} onChange={(e) => set('titulo', e.target.value)}
              placeholder="Ex.: HP LaserJet — reposição do serviço de impressão" />
          </div>
          <div className="grid md:grid-cols-2 gap-3.5">
            <div>
              <label className="campo-rotulo">Marca (opcional)</label>
              <input className="campo-input" value={f.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Ex.: HP" />
            </div>
            <div>
              <label className="campo-rotulo">Categoria (opcional)</label>
              <input className="campo-input" value={f.categoria} onChange={(e) => set('categoria', e.target.value)} placeholder="Ex.: Impressora" />
            </div>
          </div>
          <div>
            <label className="campo-rotulo">Palavras-chave do sintoma</label>
            <input className="campo-input" value={f.sintomaChave} onChange={(e) => set('sintomaChave', e.target.value)}
              placeholder="não imprime fila trabalhos parados" />
            <p className="text-[11px] text-cinza mt-1">
              O sistema compara estas palavras com o sintoma do pedido. Quanto mais específicas, melhor a sugestão.
            </p>
          </div>
          <fieldset className="border border-linha rounded-xl p-3.5">
            <legend className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza px-1.5">Passos</legend>
            {passos.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-dourado text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-2.5">{i + 1}</span>
                <textarea className="campo-input flex-1 min-h-[56px]" value={p}
                  onChange={(e) => setPassos((s) => s.map((x, j) => j === i ? e.target.value : x))} />
                <button className="text-vermelho px-2" onClick={() => setPassos((s) => s.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button className="btn-contorno !min-h-0 !px-3 !py-1.5 !text-xs" onClick={() => setPassos((s) => [...s, ''])}>＋ Passo</button>
          </fieldset>
          <div className="grid md:grid-cols-3 gap-3.5">
            <div>
              <label className="campo-rotulo">Peça provável</label>
              <input className="campo-input" value={f.pecaProvavel} onChange={(e) => set('pecaProvavel', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Tempo (min)</label>
              <input className="campo-input" type="number" value={f.tempoEstimado} onChange={(e) => set('tempoEstimado', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Fonte</label>
              <input className="campo-input" value={f.fonte} onChange={(e) => set('fonte', e.target.value)} />
            </div>
          </div>
          {!novo && (
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={f.activo} onChange={(e) => set('activo', e.target.checked)} />
              Procedimento activo
            </label>
          )}
          {erro && <p className="text-vermelho text-sm">{erro}</p>}
        </div>
        <div className="modal-rodape">
          <button className="btn-contorno" onClick={fechar}>Cancelar</button>
          <button className="btn-primario" onClick={guardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

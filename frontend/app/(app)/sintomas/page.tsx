'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PRIORIDADE } from '@/lib/formato';

const CATEGORIAS_TECNICAS = ['Hardware', 'Software', 'Rede', 'Impressão', 'Aplicação', 'Sistema biométrico'];

export default function SintomasPage() {
  const [sintomas, setSintomas] = useState<any[]>([]);
  const [editar, setEditar] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => { api('/sintomas?todos=1').then(setSintomas).catch((e) => setMsg(e.message)); }, []);
  useEffect(carregar, [carregar]);

  const grupos = Array.from(new Set(sintomas.map((s) => s.grupo)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex-1">Catálogo de Sintomas</h1>
        <button className="btn-primario" onClick={() => setEditar({})}>＋ Novo sintoma</button>
      </div>
      <p className="text-[13px] text-cinza">
        É este catálogo que permite a quem pede ajuda descrever o problema sem saber vocabulário técnico.
        Cada sintoma define a prioridade e a categoria automaticamente, sugere passos de auto-ajuda ao requerente
        e entrega ao técnico uma pista de diagnóstico. <b>Enriquecer este catálogo é a forma mais rápida de melhorar
        o sistema</b> — sempre que uma avaria nova aparecer, acrescente-a aqui.
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      {grupos.map((g) => (
        <section key={g} className="cartao">
          <h2 className="text-[15px] font-bold mb-2.5">{g}</h2>
          <div className="space-y-2">
            {sintomas.filter((s) => s.grupo === g).map((s) => (
              <button key={s.id} onClick={() => setEditar(s)}
                className={`w-full flex items-start gap-3 border border-linha rounded-xl p-3 text-left hover:border-dourado transition ${s.activo ? '' : 'opacity-50'}`}>
                <span className="text-xl shrink-0">{s.icone}</span>
                <span className="flex-1 min-w-0">
                  <b className="block text-[13.5px]">{s.rotulo}</b>
                  <span className="block text-[11.5px] text-cinza mt-0.5">
                    {s.categoriaTecnica} · {(s.perguntas as any[])?.length ?? 0} pergunta(s) ·{' '}
                    {(s.passosAutoAjuda as any[])?.length ?? 0} passo(s) de auto-ajuda · usado {s.vezesUsado}×
                  </span>
                </span>
                <span className={`pill ${PRIORIDADE[s.prioridadeSugerida].classe}`}>{PRIORIDADE[s.prioridadeSugerida].rotulo}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {editar && <FormSintoma sintoma={editar} grupos={grupos} fechar={() => setEditar(null)} feito={() => { setEditar(null); carregar(); }} />}
    </div>
  );
}

function FormSintoma({ sintoma, grupos, fechar, feito }: any) {
  const novo = !sintoma.id;
  const [f, setF] = useState<any>({
    grupo: sintoma.grupo ?? grupos[0] ?? 'Computador', rotulo: sintoma.rotulo ?? '', icone: sintoma.icone ?? '🔧',
    categoriaTecnica: sintoma.categoriaTecnica ?? 'Hardware', prioridadeSugerida: sintoma.prioridadeSugerida ?? 'MEDIA',
    diagnosticoProvavel: sintoma.diagnosticoProvavel ?? '', ordem: sintoma.ordem ?? 50, activo: sintoma.activo ?? true,
  });
  const [perguntas, setPerguntas] = useState<any[]>((sintoma.perguntas as any[]) ?? []);
  const [passos, setPassos] = useState<string[]>((sintoma.passosAutoAjuda as string[]) ?? []);
  const [erro, setErro] = useState('');
  const set = (c: string, v: any) => setF((s: any) => ({ ...s, [c]: v }));

  async function guardar() {
    if (f.rotulo.trim().length < 5) { setErro('Escreva o sintoma como o utilizador o descreveria.'); return; }
    try {
      const corpo = JSON.stringify({ ...f, perguntas, passosAutoAjuda: passos });
      if (novo) await api('/sintomas', { method: 'POST', body: corpo });
      else await api(`/sintomas/${sintoma.id}`, { method: 'PATCH', body: corpo });
      feito();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa sm:max-w-2xl">
        <div className="modal-cabecalho">
          <h3 className="font-bold flex-1">{novo ? 'Novo sintoma' : 'Editar sintoma'}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo space-y-3.5">
          <div className="grid sm:grid-cols-[auto_1fr] gap-3.5">
            <div>
              <label className="campo-rotulo">Ícone</label>
              <input className="campo-input w-20 text-center text-xl" value={f.icone} onChange={(e) => set('icone', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Grupo</label>
              <input className="campo-input" value={f.grupo} onChange={(e) => set('grupo', e.target.value)} list="grupos-sintoma" />
              <datalist id="grupos-sintoma">{grupos.map((g: string) => <option key={g} value={g} />)}</datalist>
            </div>
          </div>
          <div>
            <label className="campo-rotulo">Sintoma — nas palavras de quem tem o problema</label>
            <input className="campo-input" value={f.rotulo} onChange={(e) => set('rotulo', e.target.value)}
              placeholder="Ex.: O ecrã fica preto a meio do trabalho" />
            <p className="text-[11px] text-cinza mt-1">Evite termos técnicos: quem escolhe isto não é informático.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3.5">
            <div>
              <label className="campo-rotulo">Categoria técnica</label>
              <select className="campo-input" value={f.categoriaTecnica} onChange={(e) => set('categoriaTecnica', e.target.value)}>
                {CATEGORIAS_TECNICAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-rotulo">Prioridade</label>
              <select className="campo-input" value={f.prioridadeSugerida} onChange={(e) => set('prioridadeSugerida', e.target.value)}>
                {Object.entries(PRIORIDADE).map(([v, r]) => <option key={v} value={v}>{r.rotulo}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-rotulo">Ordem</label>
              <input className="campo-input" type="number" value={f.ordem} onChange={(e) => set('ordem', e.target.value)} />
            </div>
          </div>

          <fieldset className="border border-linha rounded-xl p-3.5">
            <legend className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza px-1.5">Passos de auto-ajuda</legend>
            <p className="text-[11.5px] text-cinza mb-2">
              Mostrados antes de o pedido ser aberto. Bons passos aqui evitam deslocações desnecessárias da equipa.
            </p>
            {passos.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="campo-input flex-1" value={p}
                  onChange={(e) => setPassos((s) => s.map((x, j) => j === i ? e.target.value : x))} />
                <button className="text-vermelho px-2" onClick={() => setPassos((s) => s.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button className="btn-contorno !min-h-0 !px-3 !py-1.5 !text-xs" onClick={() => setPassos((s) => [...s, ''])}>＋ Passo</button>
          </fieldset>

          <fieldset className="border border-linha rounded-xl p-3.5">
            <legend className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza px-1.5">Perguntas de esclarecimento</legend>
            <p className="text-[11.5px] text-cinza mb-2">
              Respondidas por toque, sem escrita. Uma opção que indique impacto no atendimento faz subir a prioridade automaticamente.
            </p>
            {perguntas.map((p, i) => (
              <div key={i} className="border border-linha rounded-lg p-2.5 mb-2 space-y-2">
                <div className="flex gap-2">
                  <input className="campo-input flex-1" value={p.pergunta} placeholder="Pergunta"
                    onChange={(e) => setPerguntas((s) => s.map((x, j) => j === i ? { ...x, pergunta: e.target.value, chave: x.chave || `p${i + 1}` } : x))} />
                  <button className="text-vermelho px-2" onClick={() => setPerguntas((s) => s.filter((_, j) => j !== i))}>✕</button>
                </div>
                <input className="campo-input" value={(p.opcoes ?? []).join(' | ')} placeholder="Opções separadas por | (ex.: Sim | Não | Não sei)"
                  onChange={(e) => setPerguntas((s) => s.map((x, j) => j === i ? { ...x, opcoes: e.target.value.split('|').map((o) => o.trim()).filter(Boolean) } : x))} />
              </div>
            ))}
            <button className="btn-contorno !min-h-0 !px-3 !py-1.5 !text-xs"
              onClick={() => setPerguntas((s) => [...s, { chave: `p${s.length + 1}`, pergunta: '', opcoes: [] }])}>＋ Pergunta</button>
          </fieldset>

          <div>
            <label className="campo-rotulo">Pista de diagnóstico (só o técnico vê)</label>
            <textarea className="campo-input min-h-[70px]" value={f.diagnosticoProvavel} onChange={(e) => set('diagnosticoProvavel', e.target.value)}
              placeholder="Ex.: Luz laranja no ecrã indica ausência de sinal — verificar cabo antes de trocar o monitor." />
            <p className="text-[11px] text-cinza mt-1">
              É aqui que a experiência da equipa fica registada e deixa de depender de quem está de serviço.
            </p>
          </div>

          {!novo && (
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={f.activo} onChange={(e) => set('activo', e.target.checked)} />
              Sintoma activo (visível a quem abre pedidos)
            </label>
          )}
          {erro && <p className="text-vermelho text-sm">{erro}</p>}
        </div>
        <div className="modal-rodape">
          <button className="btn-contorno" onClick={fechar}>Cancelar</button>
          <button className="btn-primario" onClick={guardar}>Guardar sintoma</button>
        </div>
      </div>
    </div>
  );
}

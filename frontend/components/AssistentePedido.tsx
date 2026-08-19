'use client';
import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';

/**
 * Assistente de abertura de pedido.
 * Três passos, quase sem escrita: escolher o sintoma, responder por toque, confirmar.
 * Antes de submeter, mostra passos de auto-ajuda — muitos problemas resolvem-se aqui.
 */
export default function AssistentePedido({ fechar, feito, sintomaInicial }: any) {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [grupos, setGrupos] = useState<any[]>([]);
  const [meusItens, setMeusItens] = useState<any[]>([]);
  const [passo, setPasso] = useState<'sintoma' | 'ajuda' | 'perguntas' | 'confirmar'>('sintoma');
  const [sintoma, setSintoma] = useState<any>(sintomaInicial ?? null);
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState('');
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [activoId, setActivoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    api('/sintomas').then(setGrupos).catch((e) => setErro(e.message));
    api('/activos/meus').then(setMeusItens).catch(() => {});
  }, []);

  useEffect(() => {
    if (sintomaInicial) escolher(sintomaInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function escolher(s: any) {
    setSintoma(s);
    setRespostas({});
    const passos = (s.passosAutoAjuda ?? []) as string[];
    setPasso(passos.length > 0 ? 'ajuda' : (s.perguntas ?? []).length > 0 ? 'perguntas' : 'confirmar');
  }

  async function resolvidoSozinho() {
    try { await api(`/sintomas/${sintoma.id}/auto-ajuda`, { method: 'POST', body: '{}' }); } catch { /* métrica auxiliar */ }
    fechar();
  }

  async function submeter() {
    setAEnviar(true);
    setErro('');
    try {
      await api('/pedidos/por-sintoma', {
        method: 'POST',
        body: JSON.stringify({ sintomaId: sintoma.id, respostas, activoId: activoId || undefined, observacoes }),
      });
      feito();
    } catch (e: any) { setErro(e.message); } finally { setAEnviar(false); }
  }

  const perguntas: any[] = (sintoma?.perguntas ?? []) as any[];
  const passosAjuda: string[] = (sintoma?.passosAutoAjuda ?? []) as string[];

  const sintomasFiltrados = pesquisa.trim().length > 1
    ? grupos.flatMap((g) => g.sintomas.filter((s: any) => s.rotulo.toLowerCase().includes(pesquisa.toLowerCase())))
    : null;

  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa sm:max-w-2xl">
        <div className="modal-cabecalho">
          <div className="flex-1">
            <h3 className="font-bold">Preciso de ajuda</h3>
            <p className="text-[11.5px] text-cinza">
              {passo === 'sintoma' && 'Passo 1 de 3 — o que está a acontecer?'}
              {passo === 'ajuda' && 'Antes de continuar, experimente isto'}
              {passo === 'perguntas' && 'Passo 2 de 3 — duas perguntas rápidas'}
              {passo === 'confirmar' && 'Passo 3 de 3 — confirmar e enviar'}
            </p>
          </div>
          <button className="text-cinza text-xl px-2" onClick={fechar} aria-label="Fechar">✕</button>
        </div>

        <div className="modal-corpo">
          {/* ---------- Passo 1: escolher sintoma ---------- */}
          {passo === 'sintoma' && (
            <>
              <input className="campo-input mb-4" type="search" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Escreva o problema (ex.: não liga, sem internet…)" />

              {sintomasFiltrados ? (
                <div className="space-y-2">
                  {sintomasFiltrados.map((s: any) => (
                    <BotaoSintoma key={s.id} sintoma={s} onClick={() => escolher(s)} />
                  ))}
                  {sintomasFiltrados.length === 0 && (
                    <p className="text-sm text-cinza text-center py-4">
                      Nada encontrado. Limpe a pesquisa e escolha «Outro problema não listado».
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {grupos.map((g) => (
                    <div key={g.grupo} className="border border-linha rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center gap-2 px-4 py-3.5 text-left hover:bg-[#FAF8F3] transition"
                        onClick={() => setGrupoAberto(grupoAberto === g.grupo ? null : g.grupo)}
                      >
                        <span className="text-lg">{g.sintomas[0]?.icone ?? '📋'}</span>
                        <span className="flex-1 font-semibold text-[14px]">{g.grupo}</span>
                        <span className="text-[11px] text-cinza">{g.sintomas.length}</span>
                        <span className="text-cinza">{grupoAberto === g.grupo ? '▾' : '▸'}</span>
                      </button>
                      {grupoAberto === g.grupo && (
                        <div className="border-t border-linha p-2 space-y-2 bg-papel">
                          {g.sintomas.map((s: any) => (
                            <BotaoSintoma key={s.id} sintoma={s} onClick={() => escolher(s)} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ---------- Auto-ajuda ---------- */}
          {passo === 'ajuda' && (
            <>
              <p className="text-[15px] font-semibold mb-1">{sintoma.icone} {sintoma.rotulo}</p>
              <p className="text-[13px] text-cinza mb-4">
                Estes passos resolvem a maioria dos casos em menos de dois minutos. Experimente pela ordem indicada.
              </p>
              <ol className="space-y-2.5 mb-4">
                {passosAjuda.map((p, i) => (
                  <li key={i} className="flex gap-3 bg-papel rounded-xl p-3">
                    <span className="w-6 h-6 rounded-full bg-dourado text-white text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-[13.5px] leading-relaxed">{p}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button className="btn-secundario sm:flex-1" onClick={resolvidoSozinho}>✓ Isto resolveu, obrigado</button>
                <button className="btn-primario sm:flex-1"
                  onClick={() => setPasso(perguntas.length ? 'perguntas' : 'confirmar')}>
                  O problema continua →
                </button>
              </div>
            </>
          )}

          {/* ---------- Passo 2: perguntas ---------- */}
          {passo === 'perguntas' && (
            <>
              <p className="text-[15px] font-semibold mb-4">{sintoma.icone} {sintoma.rotulo}</p>
              <div className="space-y-4">
                {perguntas.map((p) => (
                  <div key={p.chave}>
                    <p className="text-[13.5px] font-semibold mb-2">{p.pergunta}</p>
                    <div className="flex flex-wrap gap-2">
                      {p.opcoes.map((o: string) => (
                        <button key={o}
                          onClick={() => setRespostas((s) => ({ ...s, [p.chave]: o }))}
                          className={`px-3.5 py-2.5 rounded-xl border text-[13px] font-medium transition min-h-[44px] ${
                            respostas[p.chave] === o
                              ? 'bg-vermelho text-white border-vermelho'
                              : 'bg-white border-linha hover:border-dourado'
                          }`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ---------- Passo 3: confirmar ---------- */}
          {passo === 'confirmar' && (
            <>
              <div className="bg-papel rounded-xl p-4 mb-4">
                <p className="text-[15px] font-semibold mb-2">{sintoma.icone} {sintoma.rotulo}</p>
                {perguntas.filter((p) => respostas[p.chave]).map((p) => (
                  <p key={p.chave} className="text-[12.5px] text-cinza">{p.pergunta} <b className="text-preto">{respostas[p.chave]}</b></p>
                ))}
                <p className="text-[11.5px] text-dourado mt-2">
                  ✓ Requerente, posto e urgência são preenchidos automaticamente pelo sistema
                </p>
              </div>

              {meusItens.length > 0 && (
                <div className="mb-3.5">
                  <label className="campo-rotulo">Qual equipamento? (opcional)</label>
                  <select className="campo-input" value={activoId} onChange={(e) => setActivoId(e.target.value)}>
                    <option value="">— Não sei / não se aplica —</option>
                    {meusItens.map((a) => (
                      <option key={a.id} value={a.id}>{a.numInventario} · {a.categoria} {a.marca}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="campo-rotulo">Quer acrescentar alguma coisa? (opcional)</label>
                <textarea className="campo-input min-h-[70px]" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Só se houver algum pormenor importante. Caso contrário, envie assim mesmo." />
              </div>
              {erro && <p className="text-vermelho text-sm mt-2">{erro}</p>}
            </>
          )}
        </div>

        <div className="modal-rodape">
          {passo === 'sintoma' && <button className="btn-contorno" onClick={fechar}>Cancelar</button>}
          {passo === 'perguntas' && (
            <>
              <button className="btn-contorno" onClick={() => setPasso(passosAjuda.length ? 'ajuda' : 'sintoma')}>← Voltar</button>
              <button className="btn-primario" onClick={() => setPasso('confirmar')}>Continuar →</button>
            </>
          )}
          {passo === 'confirmar' && (
            <>
              <button className="btn-contorno" onClick={() => setPasso(perguntas.length ? 'perguntas' : 'sintoma')}>← Voltar</button>
              <button className="btn-primario" onClick={submeter} disabled={aEnviar}>
                {aEnviar ? 'A enviar…' : 'Enviar pedido'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BotaoSintoma({ sintoma, onClick }: any) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 bg-white border border-linha rounded-xl px-3.5 py-3 text-left hover:border-dourado hover:bg-[#FDFBF5] transition min-h-[52px]">
      <span className="text-xl shrink-0">{sintoma.icone}</span>
      <span className="flex-1 text-[13.5px] font-medium leading-snug">{sintoma.rotulo}</span>
      <span className="text-cinza">→</span>
    </button>
  );
}

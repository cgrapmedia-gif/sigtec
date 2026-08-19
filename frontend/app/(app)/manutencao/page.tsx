'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import SeletorComCriar from '@/components/SeletorComCriar';
import { diasAte, fmtData } from '@/lib/formato';

export default function ManutencaoPage() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);
  const [nova, setNova] = useState<any>(null);
  const [filtroCat, setFiltroCat] = useState('');
  const [msg, setMsg] = useState('');
  const carregar = useCallback(() => {
    api('/manutencao').then(setOrdens).catch((e) => setMsg(e.message));
    api('/activos').then(setActivos).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  async function concluir(id: string) {
    try { await api(`/manutencao/${id}/concluir`, { method: 'PATCH', body: JSON.stringify({}) }); carregar(); } catch (e: any) { setMsg(e.message); }
  }

  async function gerarRotinas() {
    if (!confirm('Gerar o calendário preventivo para todo o parque, segundo as rotinas por categoria? As ordens já existentes não são duplicadas.')) return;
    try {
      const r = await api('/manutencao/gerar-rotinas', { method: 'POST', body: JSON.stringify({}) });
      setMsg(r.criadas ? `${r.criadas} ordem(ns) criada(s).` : 'O calendário já estava completo — nada a criar.');
      carregar();
    } catch (e: any) { setMsg(e.message); }
  }

  const urgentes = ordens.filter((o) => diasAte(o.dataPrevista) <= 15).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex-1">Manutenção Preventiva</h1>
        <button className="btn-contorno" onClick={gerarRotinas}>🧭 Gerar rotinas do parque</button>
        <button className="btn-primario" onClick={() => setNova({ assistido: true })}>＋ Nova ordem</button>
      </div>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}
      {urgentes > 0 && (
        <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-dourado rounded-lg p-3.5">
          ⏰ <b className="text-dourado">Alerta automático:</b> {urgentes} equipamento(s) necessitam de manutenção dentro de 15 dias.
        </p>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <BotaoCat activa={filtroCat === ''} onClick={() => setFiltroCat('')} rotulo="Todas" total={ordens.length} />
        {Array.from(new Set(ordens.map((o) => o.categoria))).map((c) => (
          <BotaoCat key={c} activa={filtroCat === c} onClick={() => setFiltroCat(c)} rotulo={c}
            total={ordens.filter((o) => o.categoria === c).length} />
        ))}
      </div>

      <div className="cartao divide-y divide-linha">
        {ordens.filter((o) => !filtroCat || o.categoria === filtroCat).map((o) => {
          const d = diasAte(o.dataPrevista);
          return (
            <div key={o.id} className="flex items-center gap-3.5 py-3.5">
              <div className={`w-16 text-center rounded-lg py-1.5 shrink-0 ${d <= 7 ? 'bg-vermelho/10 text-vermelho' : d <= 15 ? 'bg-ambar/10 text-ambar' : 'bg-verde/10 text-verde'}`}>
                <span className="block font-mono text-lg font-bold leading-none">{d}</span>
                <span className="text-[9.5px] uppercase tracking-wide">dias</span>
              </div>
              <div className="flex-1">
                <b className="block text-[13.5px]">{o.tarefa}</b>
                <span className="text-xs text-cinza">
                  {fmtData(o.dataPrevista)} · {o.categoria}{o.activo ? <> · <span className="font-mono">{o.activo.numInventario}</span></> : null}
                  {o.recorrenciaMeses ? <span className="pill bg-linha text-cinza ml-1.5">⟳ {o.recorrenciaMeses}m</span> : null}
                </span>
              </div>
              <button className="btn-contorno !px-3 !py-1.5 !text-xs" onClick={() => concluir(o.id)}>Concluir</button>
            </div>
          );
        })}
        {ordens.length === 0 && <p className="py-4 text-sm text-cinza">Todas as manutenções foram concluídas. Use «Gerar rotinas do parque» para criar o calendário preventivo automaticamente.</p>}
      </div>

      {nova && <NovaOrdem activos={activos} assistido={nova.assistido} fechar={() => setNova(null)} feito={() => { setNova(null); carregar(); }} />}
    </div>
  );
}

function NovaOrdem({ activos, assistido, fechar, feito }: any) {
  const [modo, setModo] = useState<'assistido' | 'completo'>(assistido ? 'assistido' : 'completo');
  const MODELOS = [
    { tarefa: 'Limpeza interna, actualizações e verificação de antivírus', categoria: 'Computador', meses: 3 },
    { tarefa: 'Manutenção preventiva e reposição de consumíveis', categoria: 'Impressora', meses: 3 },
    { tarefa: 'Backup completo e teste de restauro', categoria: 'Servidor', meses: 1 },
    { tarefa: 'Teste de autonomia e verificação de baterias', categoria: 'UPS', meses: 6 },
    { tarefa: 'Calibração e limpeza do sensor', categoria: 'Leitor biométrico', meses: 6 },
    { tarefa: 'Limpeza de filtros e verificação de gás', categoria: 'Outro', meses: 6 },
  ];
  const [tarefa, setTarefa] = useState('');
  const [categoria, setCategoria] = useState('Computador');
  const [dataPrevista, setDataPrevista] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [activoId, setActivoId] = useState('');
  const [recorrenciaMeses, setRecorrenciaMeses] = useState('');
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function criar() {
    if (tarefa.trim().length < 5) { setErro('Descreva a tarefa de manutenção.'); return; }
    setAGuardar(true);
    try {
      await api('/manutencao', {
        method: 'POST',
        body: JSON.stringify({ tarefa, categoria, dataPrevista, activoId: activoId || undefined, recorrenciaMeses: recorrenciaMeses ? Number(recorrenciaMeses) : undefined }),
      });
      feito();
    } catch (e: any) { setErro(e.message); } finally { setAGuardar(false); }
  }

  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa sm:max-w-xl">
        <div className="modal-cabecalho">
          <div className="flex-1">
            <h3 className="font-bold">Nova ordem de manutenção</h3>
            <div className="flex gap-1.5 mt-1.5">
              <button type="button" onClick={() => setModo('assistido')}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold ${modo === 'assistido' ? 'bg-preto text-white' : 'bg-papel text-cinza'}`}>
                🧭 Com ajuda
              </button>
              <button type="button" onClick={() => setModo('completo')}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold ${modo === 'completo' ? 'bg-preto text-white' : 'bg-papel text-cinza'}`}>
                ⚙ Preenchimento completo
              </button>
            </div>
          </div>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo space-y-3.5">
          {modo === 'assistido' && (
            <div>
              <p className="text-[12.5px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro rounded-xl p-3 mb-3">
                🧭 Escolha uma tarefa habitual e o sistema preenche categoria e periodicidade recomendadas.
              </p>
              <div className="space-y-2">
                {MODELOS.map((m) => (
                  <button key={m.tarefa} type="button"
                    onClick={() => { setTarefa(m.tarefa); setCategoria(m.categoria); setRecorrenciaMeses(String(m.meses)); setModo('completo'); }}
                    className="w-full text-left border border-linha rounded-xl p-3 hover:border-dourado transition min-h-[52px]">
                    <b className="block text-[13.5px]">{m.tarefa}</b>
                    <span className="text-[11.5px] text-cinza">{m.categoria} · a cada {m.meses} mês(es)</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {modo === 'completo' && <>
          <div>
            <label className="campo-rotulo">Tarefa</label>
            <input className="campo-input" value={tarefa} onChange={(e) => setTarefa(e.target.value)} placeholder="Ex.: Substituição de baterias da UPS" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="campo-rotulo">Categoria</label>
              <select className="campo-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {['Computador', 'Impressora', 'Servidor', 'UPS', 'Leitor biométrico', 'Switch', 'Router', 'Rede', 'Outro'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-rotulo">Data prevista</label>
              <input className="campo-input" type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="campo-rotulo">Equipamento (opcional)</label>
            <select className="campo-input" value={activoId} onChange={(e) => setActivoId(e.target.value)}>
              <option value="">— Nenhum específico —</option>
              {activos.filter((a: any) => a.estado !== 'ABATIDO').map((a: any) => (
                <option key={a.id} value={a.id}>{a.numInventario} · {a.marca} {a.modelo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="campo-rotulo">Repetir automaticamente</label>
            <select className="campo-input" value={recorrenciaMeses} onChange={(e) => setRecorrenciaMeses(e.target.value)}>
              <option value="">Não repetir</option>
              <option value="1">Mensalmente</option>
              <option value="3">Trimestralmente</option>
              <option value="6">Semestralmente</option>
              <option value="12">Anualmente</option>
            </select>
            <p className="text-[11px] text-dourado mt-1">✓ Ao concluir, a próxima ocorrência é agendada sozinha</p>
          </div>
          </>}
          {erro && <p className="text-vermelho text-sm">{erro}</p>}
        </div>
        <div className="modal-rodape">
          <button className="btn-contorno" onClick={fechar}>Cancelar</button>
          {modo === 'completo' && <button className="btn-primario" onClick={criar} disabled={aGuardar}>{aGuardar ? 'A criar…' : 'Criar ordem'}</button>}
        </div>
      </div>
    </div>
  );
}


function BotaoCat({ activa, onClick, rotulo, total }: any) {
  return (
    <button onClick={onClick}
      className={`shrink-0 px-3.5 py-2.5 rounded-xl border text-left transition min-h-[44px] ${
        activa ? 'bg-preto text-white border-preto' : 'bg-white border-linha hover:border-dourado'
      }`}>
      <span className="block text-[12.5px] font-semibold whitespace-nowrap">{rotulo}</span>
      <span className={`block text-[10.5px] ${activa ? 'text-douradoClaro' : 'text-cinza'}`}>{total} ordem(ns)</span>
    </button>
  );
}

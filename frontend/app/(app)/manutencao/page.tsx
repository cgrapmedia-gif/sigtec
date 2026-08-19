'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { diasAte, fmtData } from '@/lib/formato';

export default function ManutencaoPage() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);
  const [nova, setNova] = useState(false);
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
        <button className="btn-contorno" onClick={gerarRotinas}>⟳ Gerar rotinas do parque</button>
        <button className="btn-primario" onClick={() => setNova(true)}>＋ Nova ordem</button>
      </div>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}
      {urgentes > 0 && (
        <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-dourado rounded-lg p-3.5">
          ⏰ <b className="text-dourado">Alerta automático:</b> {urgentes} equipamento(s) necessitam de manutenção dentro de 15 dias.
        </p>
      )}
      <div className="cartao divide-y divide-linha">
        {ordens.map((o) => {
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

      {nova && <NovaOrdem activos={activos} fechar={() => setNova(false)} feito={() => { setNova(false); carregar(); }} />}
    </div>
  );
}

function NovaOrdem({ activos, fechar, feito }: any) {
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
          <h3 className="font-bold flex-1">Nova ordem de manutenção</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo space-y-3.5">
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
          {erro && <p className="text-vermelho text-sm">{erro}</p>}
        </div>
        <div className="modal-rodape">
          <button className="btn-contorno" onClick={fechar}>Cancelar</button>
          <button className="btn-primario" onClick={criar} disabled={aGuardar}>{aGuardar ? 'A criar…' : 'Criar ordem'}</button>
        </div>
      </div>
    </div>
  );
}

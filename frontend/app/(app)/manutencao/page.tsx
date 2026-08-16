'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { diasAte, fmtData } from '@/lib/formato';

export default function ManutencaoPage() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const carregar = useCallback(() => { api('/manutencao').then(setOrdens).catch((e) => setMsg(e.message)); }, []);
  useEffect(carregar, [carregar]);

  async function concluir(id: string) {
    try { await api(`/manutencao/${id}/concluir`, { method: 'PATCH', body: JSON.stringify({}) }); carregar(); } catch (e: any) { setMsg(e.message); }
  }

  const urgentes = ordens.filter((o) => diasAte(o.dataPrevista) <= 15).length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Manutenção Preventiva</h1>
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
                <span className="text-xs text-cinza">{fmtData(o.dataPrevista)} · {o.categoria}{o.activo ? <> · <span className="font-mono">{o.activo.numInventario}</span></> : null}</span>
              </div>
              <button className="btn-contorno !px-3 !py-1.5 !text-xs" onClick={() => concluir(o.id)}>Concluir</button>
            </div>
          );
        })}
        {ordens.length === 0 && <p className="py-4 text-sm text-cinza">Todas as manutenções foram concluídas. Crie novas ordens conforme o calendário de rotinas.</p>}
      </div>
    </div>
  );
}

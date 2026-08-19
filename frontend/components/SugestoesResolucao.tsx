'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtData } from '@/lib/formato';

/**
 * Sugestões de resolução apresentadas ao técnico.
 * Combina três fontes: procedimentos genéricos do fabricante, o que já resolveu
 * este mesmo equipamento, e casos idênticos noutros equipamentos do mesmo modelo.
 */
export default function SugestoesResolucao({ pedidoId }: { pedidoId: string }) {
  const [d, setD] = useState<any>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api(`/resolucoes/pedido/${pedidoId}`).then(setD).catch((e) => setErro(e.message));
  }, [pedidoId]);

  async function marcar(id: string, resolveu: boolean) {
    try { await api(`/resolucoes/${id}/uso`, { method: 'POST', body: JSON.stringify({ resolveu }) }); } catch { /* métrica auxiliar */ }
    setAberta(null);
  }

  if (erro) return null;
  if (!d) return <p className="text-[12.5px] text-cinza">A procurar sugestões…</p>;

  const nada = d.sugestoes.length === 0 && d.historicoEquipamento.length === 0 && d.casosSemelhantes.length === 0;

  return (
    <div className="border border-douradoClaro bg-[#FDFBF3] rounded-xl p-3.5 mb-4">
      <p className="text-[13px] font-bold uppercase tracking-wide text-dourado mb-2">💡 Sugestões de resolução</p>

      {d.contexto.pistaDoSintoma && (
        <p className="text-[12.5px] mb-2.5 bg-white border border-linha rounded-lg p-2.5">
          <b>Pista do sintoma:</b> {d.contexto.pistaDoSintoma}
        </p>
      )}
      {d.contexto.equipamento && (
        <p className="text-[11.5px] text-cinza mb-2.5">
          {d.contexto.equipamento} · <span className="font-mono">{d.contexto.numInventario}</span>
          {d.contexto.falhas6m > 0 && ` · ${d.contexto.falhas6m} falha(s) em 6 meses`}
        </p>
      )}

      {nada && (
        <p className="text-[12.5px] text-cinza">
          Sem procedimentos registados para este caso. Depois de resolver, considere acrescentar o
          procedimento em Resoluções — a próxima pessoa agradece.
        </p>
      )}

      {d.sugestoes.map((s: any) => (
        <div key={s.id} className="bg-white border border-linha rounded-lg mb-2 overflow-hidden">
          <button onClick={() => setAberta(aberta === s.id ? null : s.id)}
            className="w-full flex items-start gap-2 p-2.5 text-left hover:bg-papel transition">
            <span className="flex-1 min-w-0">
              <b className="block text-[13px] leading-snug">{s.titulo}</b>
              <span className="block text-[11px] text-cinza mt-0.5">
                {s.fonte}{s.tempoEstimado ? ` · ~${s.tempoEstimado} min` : ''}
                {s.pecaProvavel ? ` · peça provável: ${s.pecaProvavel}` : ''}
                {s.taxaSucesso !== null ? ` · ${s.taxaSucesso}% de sucesso aqui` : ''}
              </span>
            </span>
            <span className="text-cinza">{aberta === s.id ? '▾' : '▸'}</span>
          </button>
          {aberta === s.id && (
            <div className="border-t border-linha p-3">
              <ol className="space-y-2 mb-3">
                {(s.passos as string[]).map((p, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-dourado text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
              <div className="flex gap-2">
                <button className="btn-contorno !min-h-0 !py-1.5 !text-[11.5px] flex-1" onClick={() => marcar(s.id, false)}>
                  Apliquei, não resolveu
                </button>
                <button className="btn-secundario !min-h-0 !py-1.5 !text-[11.5px] flex-1" onClick={() => marcar(s.id, true)}>
                  ✓ Resolveu o problema
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {d.historicoEquipamento.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza mb-1">Já aconteceu neste equipamento</p>
          {d.historicoEquipamento.map((h: any) => (
            <p key={h.numero} className="text-[12.5px] leading-snug mb-1">
              <span className="font-mono text-[11px]">#{h.numero}</span> {h.assunto}
              {h.intervencao && <span className="block text-cinza text-[11.5px]">→ {h.intervencao}</span>}
              {h.fechadoEm && <span className="text-cinza text-[11px]"> ({fmtData(h.fechadoEm)})</span>}
            </p>
          ))}
        </div>
      )}

      {d.casosSemelhantes.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza mb-1">Casos iguais noutros equipamentos do mesmo modelo</p>
          {d.casosSemelhantes.map((h: any) => (
            <p key={h.numero} className="text-[12.5px] leading-snug mb-1">
              <span className="font-mono text-[11px]">{h.equipamento}</span>
              {h.intervencao && <span className="block text-cinza text-[11.5px]">→ {h.intervencao}</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

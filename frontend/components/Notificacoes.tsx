'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { fmtDataHora } from '@/lib/formato';

export default function Notificacoes() {
  const router = useRouter();
  const [aberta, setAberta] = useState(false);
  const [lista, setLista] = useState<any[]>([]);
  const [porLer, setPorLer] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);

  const carregar = useCallback(() => {
    api('/notificacoes').then(setLista).catch(() => {});
    api('/notificacoes/por-ler').then((r) => setPorLer(r.total)).catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
    // Actualização periódica — mantém o sino vivo sem recarregar a página
    const t = setInterval(carregar, 60000);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberta(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  async function abrir(n: any) {
    if (!n.lida) {
      await api(`/notificacoes/${n.id}/lida`, { method: 'PATCH' }).catch(() => {});
      carregar();
    }
    setAberta(false);
    if (n.link) router.push(n.link);
  }

  async function lerTodas() {
    await api('/notificacoes/ler-todas', { method: 'PATCH' }).catch(() => {});
    carregar();
  }

  return (
    <div className="relative" ref={caixa}>
      <button
        onClick={() => setAberta(!aberta)}
        className="relative w-9 h-9 rounded-full bg-white border border-linha hover:border-dourado transition"
        aria-label="Notificações"
      >
        🔔
        {porLer > 0 && (
          <span className="absolute -top-1 -right-1 bg-vermelho text-white text-[10px] font-bold min-w-[17px] h-[17px] rounded-full flex items-center justify-center px-1">
            {porLer > 9 ? '9+' : porLer}
          </span>
        )}
      </button>

      {aberta && (
        <div className="absolute right-0 top-11 w-[330px] max-w-[calc(100vw-2rem)] bg-white border border-linha rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center px-3.5 py-3 border-b border-linha">
            <b className="text-[13px] flex-1">Notificações</b>
            {porLer > 0 && <button onClick={lerTodas} className="text-[11px] text-vermelho font-semibold hover:underline">Marcar todas como lidas</button>}
          </div>
          <div className="max-h-[360px] overflow-y-auto divide-y divide-linha">
            {lista.map((n) => (
              <button key={n.id} onClick={() => abrir(n)} className={`w-full text-left px-3.5 py-3 hover:bg-[#FAF8F3] transition ${n.lida ? '' : 'bg-[#FDFBF3]'}`}>
                <div className="flex items-start gap-2">
                  {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-vermelho mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <b className="text-[12.5px] block leading-snug">{n.titulo}</b>
                    {n.corpo && <span className="text-[11.5px] text-cinza block leading-snug mt-0.5">{n.corpo}</span>}
                    <span className="text-[10.5px] text-cinza font-mono">{fmtDataHora(n.criadoEm)}</span>
                  </div>
                </div>
              </button>
            ))}
            {lista.length === 0 && <p className="px-3.5 py-6 text-[12.5px] text-cinza text-center">Sem notificações. O sistema avisa-o(a) quando houver novidades.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

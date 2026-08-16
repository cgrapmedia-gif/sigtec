'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ESTADO_ACTIVO, fmtData } from '@/lib/formato';

export default function ActivosPage() {
  const [activos, setActivos] = useState<any[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroCat, setFiltroCat] = useState('');
  const [filtroEst, setFiltroEst] = useState('');
  const [detalhe, setDetalhe] = useState<any>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => { api('/activos').then(setActivos).catch((e) => setErro(e.message)); }, []);
  useEffect(carregar, [carregar]);

  const cats = Array.from(new Set(activos.map((a) => a.categoria))).sort();
  const lista = activos.filter((a) =>
    (!filtroCat || a.categoria === filtroCat) && (!filtroEst || a.estado === filtroEst) &&
    (a.numInventario + a.marca + a.modelo + a.localizacao).toLowerCase().includes(pesquisa.toLowerCase()),
  );

  const idade = (a: any) => (Date.now() - new Date(a.dataAquisicao).getTime()) / 31557600000;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Inventário de Activos</h1>
      {erro && <p className="text-vermelho text-sm">{erro}</p>}

      <div className="flex gap-2.5 flex-wrap">
        <input className="campo-input flex-1 min-w-[180px]" type="search" placeholder="Pesquisar por código, marca, modelo ou localização…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        <select className="campo-input w-auto" value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}>
          <option value="">Todas as categorias</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="campo-input w-auto" value={filtroEst} onChange={(e) => setFiltroEst(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.keys(ESTADO_ACTIVO).map((e) => <option key={e} value={e}>{ESTADO_ACTIVO[e].rotulo}</option>)}
        </select>
      </div>

      <div className="cartao overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead><tr><th className="th">Inventário</th><th className="th">Equipamento</th><th className="th">Localização</th><th className="th">Idade / Ciclo</th><th className="th">Estado</th><th className="th">Falhas 6m</th></tr></thead>
          <tbody>
            {lista.map((a) => (
              <tr key={a.id} className="cursor-pointer hover:bg-[#FAF8F3]" onClick={() => api(`/activos/${a.id}`).then(setDetalhe).catch((e) => setErro(e.message))}>
                <td className="td font-mono text-xs font-semibold">{a.numInventario}</td>
                <td className="td"><span className="font-medium">{a.marca} {a.modelo}</span><span className="block text-[11px] text-cinza">{a.categoria}</span></td>
                <td className="td">{a.localizacao}</td>
                <td className={`td font-mono text-xs ${idade(a) > a.cicloVida ? 'text-vermelho' : ''}`}>{idade(a).toFixed(1)} / {a.cicloVida} anos</td>
                <td className="td"><span className={`pill ${ESTADO_ACTIVO[a.estado].classe}`}>{ESTADO_ACTIVO[a.estado].rotulo}</span></td>
                <td className={`td font-mono font-semibold ${a.falhas6m >= 5 ? 'text-vermelho' : a.falhas6m >= 3 ? 'text-ambar' : 'text-verde'}`}>{a.falhas6m}</td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={6} className="td text-center text-cinza py-6">Nenhum activo corresponde à pesquisa.</td></tr>}
          </tbody>
        </table>
      </div>

      {detalhe && (
        <div className="fixed inset-0 bg-preto/55 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && setDetalhe(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="flex items-center px-5 py-4 border-b border-linha">
              <h3 className="font-bold flex-1">Ficha de equipamento</h3>
              <button className="text-cinza text-xl px-2" onClick={() => setDetalhe(null)}>✕</button>
            </div>
            <div className="p-5">
              <p className="font-mono text-xs text-vermelho font-semibold">{detalhe.numInventario}</p>
              <h4 className="text-lg font-semibold mb-3">{detalhe.marca} {detalhe.modelo}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px] mb-4">
                <F r="Categoria" v={detalhe.categoria} />
                <F r="N.º de série" v={detalhe.numSerie ?? '—'} mono />
                <F r="Estado" v={ESTADO_ACTIVO[detalhe.estado].rotulo} />
                <F r="Aquisição" v={fmtData(detalhe.dataAquisicao)} />
                <F r="Garantia" v={detalhe.fimGarantia ? fmtData(detalhe.fimGarantia) : '—'} />
                <F r="Localização" v={detalhe.localizacao} />
                <F r="Departamento" v={detalhe.departamento?.nome ?? '—'} />
                <F r="Responsável" v={detalhe.responsavel?.nome ?? 'Equipa TI'} />
              </div>
              {detalhe.motivosObsolescencia.length >= 2 && (
                <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-dourado rounded-lg p-3 mb-4">
                  ♻ <b className="text-dourado">Candidato a abate:</b> {detalhe.motivosObsolescencia.join(' · ')}
                </p>
              )}
              <p className="text-[13px] font-bold uppercase tracking-wide text-cinza mb-2">Histórico técnico</p>
              <div className="relative pl-5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-linha max-h-64 overflow-y-auto">
                {detalhe.eventos.map((e: any) => (
                  <div key={e.id} className={`relative pb-3.5 before:absolute before:-left-[15px] before:top-1 before:w-2.5 before:h-2.5 before:rounded-full before:ring-1 before:ring-linha ${e.tipo === 'avaria' ? 'before:bg-vermelho' : 'before:bg-dourado'}`}>
                    <p className="font-mono text-[11px] text-cinza">{fmtData(e.data)}</p>
                    <p className="text-[13px] font-medium">{e.descricao}</p>
                    <p className="text-xs text-cinza">{e.autor}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-linha flex justify-end">
              <button className="btn-contorno" onClick={() => setDetalhe(null)}>Fechar janela</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ r, v, mono }: { r: string; v: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wide text-cinza font-semibold">{r}</p>
      <p className={`font-medium ${mono ? 'font-mono text-xs' : ''}`}>{v}</p>
    </div>
  );
}

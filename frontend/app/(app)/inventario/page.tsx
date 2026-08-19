'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE, api, getToken } from '@/lib/api';
import { ESTADO_ACTIVO, fmtData } from '@/lib/formato';

const TIPOS: Record<string, string> = {
  EQUIPAMENTO: 'Equipamento', SOFTWARE: 'Software', SERVICO: 'Serviço',
  CONTRATO: 'Contrato', INFRAESTRUTURA: 'Infraestrutura', CONSUMIVEL: 'Consumível',
};

/**
 * Inventário geral — a lista real de tudo o que existe, organizada por
 * localização física. É o documento que se apresenta numa auditoria.
 */
export default function InventarioPage() {
  const [itens, setItens] = useState<any[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [sector, setSector] = useState('');
  const [piso, setPiso] = useState('');
  const [tipo, setTipo] = useState('');
  const [abatidos, setAbatidos] = useState(false);
  const [agrupar, setAgrupar] = useState<'sector' | 'piso' | 'responsavel' | 'nenhum'>('sector');
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);

  const carregar = useCallback(() => {
    setACarregar(true);
    const q = new URLSearchParams();
    if (abatidos) q.set('abatidos', '1');
    api(`/relatorios/inventario?${q}`)
      .then(setItens)
      .catch((e) => setErro(e.message))
      .finally(() => setACarregar(false));
  }, [abatidos]);
  useEffect(carregar, [carregar]);

  const opcoes = useMemo(() => ({
    sectores: Array.from(new Set(itens.map((i) => i.sector).filter(Boolean))).sort(),
    pisos: Array.from(new Set(itens.map((i) => i.piso).filter(Boolean))).sort(),
  }), [itens]);

  const lista = itens.filter((i) =>
    (!sector || i.sector === sector) && (!piso || i.piso === piso) && (!tipo || i.tipo === tipo) &&
    (i.numInventario + i.designacao + i.categoria + i.sala + i.posto + i.responsavel + (i.numSerie ?? ''))
      .toLowerCase().includes(pesquisa.toLowerCase()),
  );

  const grupos = useMemo(() => {
    if (agrupar === 'nenhum') return [{ chave: '', itens: lista }];
    const mapa: Record<string, any[]> = {};
    for (const i of lista) {
      const chave = (agrupar === 'sector' ? i.sector : agrupar === 'piso' ? i.piso : i.responsavel) || 'Sem indicação';
      (mapa[chave] ??= []).push(i);
    }
    return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)).map(([chave, itens]) => ({ chave, itens }));
  }, [lista, agrupar]);

  async function abrirPdf() {
    try {
      const q = new URLSearchParams();
      if (sector) q.set('sector', sector);
      if (piso) q.set('piso', piso);
      if (tipo) q.set('tipo', tipo);
      if (abatidos) q.set('abatidos', '1');
      const res = await fetch(`${API_BASE}/relatorios/inventario.pdf?${q}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Não foi possível gerar o inventário.');
      const url = URL.createObjectURL(await res.blob());
      if (!window.open(url, '_blank')) {
        const a = document.createElement('a');
        a.href = url; a.download = 'Inventario-SIGTEC.pdf'; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="flex-1 text-[13px] text-cinza">
          Lista real de todos os bens registados, com a localização física de cada um.
          O PDF sai na folha padrão do Consulado.
        </p>
        <button className="btn-primario flex-1 lg:flex-none" onClick={abrirPdf}>📄 Inventário em PDF</button>
      </div>
      {erro && <p className="text-vermelho text-sm">{erro}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Contador rotulo="Total de bens" valor={lista.length} />
        <Contador rotulo="Operacionais" valor={lista.filter((i) => i.estado === 'OPERACIONAL').length} cor="text-verde" />
        <Contador rotulo="Com problema" valor={lista.filter((i) => ['AVARIADO', 'EM_MANUTENCAO'].includes(i.estado)).length} cor="text-ambar" />
        <Contador rotulo="Sectores" valor={opcoes.sectores.length} cor="text-azul" />
      </div>

      <div className="flex gap-2.5 flex-wrap">
        <input className="campo-input flex-1 min-w-[180px]" type="search"
          placeholder="Pesquisar por código, designação, sala, posto ou responsável…"
          value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        <select className="campo-input w-auto" value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">Todos os sectores</option>
          {opcoes.sectores.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="campo-input w-auto" value={piso} onChange={(e) => setPiso(e.target.value)}>
          <option value="">Todos os pisos</option>
          {opcoes.pisos.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="campo-input w-auto" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPOS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
      </div>

      <div className="flex gap-2.5 flex-wrap items-center text-[12.5px]">
        <span className="text-cinza">Agrupar por:</span>
        {([['sector', 'Sector'], ['piso', 'Piso'], ['responsavel', 'Responsável'], ['nenhum', 'Não agrupar']] as const).map(([v, r]) => (
          <button key={v} onClick={() => setAgrupar(v)}
            className={`px-3 py-2 rounded-lg font-semibold transition ${agrupar === v ? 'bg-preto text-white' : 'bg-white border border-linha'}`}>
            {r}
          </button>
        ))}
        <label className="flex items-center gap-2 ml-auto">
          <input type="checkbox" checked={abatidos} onChange={(e) => setAbatidos(e.target.checked)} />
          Incluir abatidos
        </label>
      </div>

      {aCarregar && <p className="text-cinza text-sm">A carregar inventário…</p>}

      {grupos.map((g) => (
        <section key={g.chave || 'todos'}>
          {g.chave && (
            <h2 className="text-[14px] font-bold mb-2 flex items-center gap-2">
              {g.chave}
              <span className="pill bg-linha text-cinza">{g.itens.length}</span>
            </h2>
          )}
          <div className="cartao envolvente-tabela overflow-x-auto">
            <table className="w-full tabela-adaptavel lg:min-w-[760px]">
              <thead>
                <tr>
                  <th className="th">Inventário</th><th className="th">Designação</th>
                  <th className="th">Piso / Sala</th><th className="th">Posto</th>
                  <th className="th">Responsável</th><th className="th">Estado</th>
                </tr>
              </thead>
              <tbody>
                {g.itens.map((i) => (
                  <tr key={i.id}>
                    <td data-principal className="td font-mono text-xs font-semibold">{i.numInventario}</td>
                    <td data-rotulo="Designação" className="td">
                      <span className="font-medium">{i.icone ? `${i.icone} ` : ''}{i.designacao}</span>
                      <span className="block text-[11px] text-cinza">{i.categoria}</span>
                    </td>
                    <td data-rotulo="Piso / Sala" className="td text-[12.5px]">
                      {[i.piso, i.sala].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td data-rotulo="Posto" className="td text-[12.5px]">{i.posto || '—'}</td>
                    <td data-rotulo="Responsável" className="td text-[12.5px]">{i.responsavel || '—'}</td>
                    <td data-rotulo="Estado" className="td">
                      <span className={`pill ${ESTADO_ACTIVO[i.estado].classe}`}>{ESTADO_ACTIVO[i.estado].rotulo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {!aCarregar && lista.length === 0 && (
        <p className="cartao vazio">
          Nenhum bem corresponde aos filtros. Registe equipamentos em «Itens de Configuração».
        </p>
      )}
    </div>
  );
}

function Contador({ rotulo, valor, cor }: any) {
  return (
    <div className="cartao">
      <p className="text-[10.5px] uppercase tracking-wider text-cinza font-semibold">{rotulo}</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${cor ?? ''}`}>{valor}</p>
    </div>
  );
}

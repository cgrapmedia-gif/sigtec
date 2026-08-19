'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_BASE, api, getToken } from '@/lib/api';

const CORES = ['#B5121B', '#B8860B', '#2C5F8A', '#2E7D4F', '#8A8378', '#C77800'];
const ROTULO_PRIORIDADE: Record<string, string> = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' };

export default function RelatoriosPage() {
  const [d, setD] = useState<any>(null);
  const [erro, setErro] = useState('');

  useEffect(() => { api('/relatorios').then(setD).catch((e) => setErro(e.message)); }, []);

  /** Abre um PDF autenticado gerado no servidor, já na folha padrão do Consulado */
  async function abrirPdf(caminho: string, nome: string) {
    try {
      const res = await fetch(`${API_BASE}${caminho}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Não foi possível gerar o documento.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (!window.open(url, '_blank')) {
        const a = document.createElement('a');
        a.href = url; a.download = nome; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) { setErro(e.message); }
  }

  async function exportarCsv() {
    try {
      const res = await fetch(`${API_BASE}/relatorios/inventario.csv`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `inventario-sigtec-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { setErro('Não foi possível exportar o inventário.'); }
  }

  if (erro) return <p className="text-vermelho text-sm">{erro}</p>;
  if (!d) return <p className="text-cinza text-sm">A calcular indicadores…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap print:hidden">
        <h1 className="hidden lg:block text-xl font-bold flex-1">Relatórios &amp; Indicadores</h1>
        <p className="w-full text-[12.5px] text-cinza order-last">
          Os documentos em PDF saem na folha padrão do Consulado, com emblema, morada e logótipos oficiais.
        </p>
        <button className="btn-primario" onClick={() => abrirPdf('/relatorios/relatorio.pdf', 'Relatorio-SIGTEC.pdf')}>
          📄 Relatório em PDF
        </button>
        <button className="btn-contorno" onClick={() => abrirPdf('/relatorios/inventario.pdf', 'Inventario-SIGTEC.pdf')}>
          📋 Inventário em PDF
        </button>
        <button className="btn-contorno" onClick={exportarCsv}>⬇ CSV</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3.5">
        <Kpi rotulo="Tempo médio de resolução" valor={`${d.desempenho.tempoMedioHoras}h`} nota="Pedidos concluídos" />
        <Kpi rotulo="SLA cumprido" valor={`${d.desempenho.slaCumpridoPct}%`} nota="Objectivo: 90%" cor={d.desempenho.slaCumpridoPct >= 90 ? 'text-verde' : 'text-ambar'} />
        <Kpi rotulo="Satisfação média" valor={d.desempenho.satisfacaoMedia ? `${d.desempenho.satisfacaoMedia}/5` : '—'} nota={`${d.desempenho.totalAvaliacoes} avaliação(ões)`} cor="text-azul" />
        <Kpi rotulo="Investimento proposto" valor={`${d.custoEstimadoRenovacao.toLocaleString('pt-PT')}€`} nota="Substituição de obsoletos" cor="text-vermelho" />
      </div>

      <div className="cartao bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border-douradoClaro">
        <h2 className="text-[15px] font-bold mb-2 flex items-center gap-2">
          Resumo executivo
          <span className="text-[9.5px] bg-preto text-douradoClaro px-2 py-0.5 rounded-full tracking-wider">MOTOR DE REGRAS</span>
        </h2>
        <p className="text-[13.5px] leading-relaxed">{d.resumo}</p>
        <p className="text-[11px] text-cinza mt-2">Gerado a partir dos dados do período, por regras explicáveis e auditáveis.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-3">Evolução mensal</h2>
          <div className="h-[220px] lg:h-[240px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD2" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="pedidos" name="Abertos" stroke="#B5121B" strokeWidth={2} />
                <Line type="monotone" dataKey="resolvidos" name="Resolvidos" stroke="#2E7D4F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-3">Equipamentos com maior taxa de falha</h2>
          <div className="h-[220px] lg:h-[240px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.topFalhas} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD2" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="numInventario" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="falhas6m" name="Falhas (6 meses)" radius={[0, 5, 5, 0]}>
                  {d.topFalhas.map((f: any, i: number) => (
                    <Cell key={i} fill={f.falhas6m >= 5 ? '#B5121B' : f.falhas6m >= 3 ? '#C77800' : '#B8860B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-3">Pedidos por categoria</h2>
          <div className="h-[220px] lg:h-[240px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.porCategoria} dataKey="total" nameKey="categoria" outerRadius="72%" label={{ fontSize: 11 }}>
                  {d.porCategoria.map((_: any, i: number) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-3">Distribuição por prioridade</h2>
          <div className="h-[220px] lg:h-[240px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.porPrioridade.map((p: any) => ({ ...p, rotulo: ROTULO_PRIORIDADE[p.prioridade] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD2" />
                <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="Pedidos" radius={[5, 5, 0, 0]}>
                  {d.porPrioridade.map((_: any, i: number) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="cartao">
        <h2 className="text-[15px] font-bold mb-3">Risco de falha do parque</h2>
        <p className="text-xs text-cinza mb-3">Pontuação por regras: idade face ao ciclo de vida, garantia expirada e historial de falhas.</p>
        <div className="envolvente-tabela overflow-x-auto">
          <table className="w-full tabela-adaptavel lg:min-w-[560px]">
            <thead><tr><th className="th">Inventário</th><th className="th">Equipamento</th><th className="th">Categoria</th><th className="th">Risco</th><th className="th">Pontuação</th></tr></thead>
            <tbody>
              {d.parqueRisco.slice(0, 8).map((a: any) => (
                <tr key={a.numInventario}>
                  <td data-principal className="td font-mono text-xs font-semibold">{a.numInventario}</td>
                  <td data-rotulo="Equipamento" className="td">{a.marca} {a.modelo}</td>
                  <td data-rotulo="Categoria" className="td text-[12.5px]">{a.categoria}</td>
                  <td data-rotulo="Risco" className="td">
                    <span className={`pill ${a.nivel === 'ALTO' ? 'bg-vermelho text-white' : a.nivel === 'MEDIO' ? 'bg-ambar/10 text-ambar' : 'bg-verde/10 text-verde'}`}>
                      {a.nivel === 'ALTO' ? 'Alto' : a.nivel === 'MEDIO' ? 'Médio' : 'Baixo'}
                    </span>
                  </td>
                  <td data-rotulo="Pontuação" className="td font-mono">{a.pontos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cartao">
        <h2 className="text-[15px] font-bold mb-3">Plano de renovação do parque — proposta à Direcção</h2>
        {d.planoRenovacao.length === 0 ? (
          <p className="text-sm text-cinza">Nenhum equipamento cumpre os critérios de substituição neste momento.</p>
        ) : (
          <>
            <div className="envolvente-tabela overflow-x-auto">
              <table className="w-full tabela-adaptavel lg:min-w-[560px]">
                <thead><tr><th className="th">Inventário</th><th className="th">Equipamento</th><th className="th">Motivos</th><th className="th">Estimativa</th></tr></thead>
                <tbody>
                  {d.planoRenovacao.map((p: any) => (
                    <tr key={p.numInventario}>
                      <td data-principal className="td font-mono text-xs font-semibold">{p.numInventario}</td>
                      <td data-rotulo="Equipamento" className="td">{p.equipamento}</td>
                      <td data-rotulo="Motivos" className="td text-[12px] flex-wrap">{p.motivos.map((m: string) => <span key={m} className="pill bg-linha text-cinza mr-1 mb-1">{m}</span>)}</td>
                      <td data-rotulo="Estimativa" className="td font-mono">{p.estimativa ? `${p.estimativa.toLocaleString('pt-PT')}€` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-right font-mono font-bold mt-3">Total estimado: {d.custoEstimadoRenovacao.toLocaleString('pt-PT')}€</p>
          </>
        )}
      </section>
    </div>
  );
}

function Kpi({ rotulo, valor, nota, cor }: { rotulo: string; valor: string; nota: string; cor?: string }) {
  return (
    <div className="cartao">
      <p className="text-[10.5px] uppercase tracking-wider text-cinza font-semibold">{rotulo}</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${cor ?? ''}`}>{valor}</p>
      <p className="text-[11.5px] text-cinza mt-0.5">{nota}</p>
    </div>
  );
}

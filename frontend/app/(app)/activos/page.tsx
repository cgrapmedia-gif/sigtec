'use client';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api, getUser } from '@/lib/api';
import { ESTADO_ACTIVO, fmtData } from '@/lib/formato';

const CATEGORIAS = ['Computador', 'Impressora', 'Servidor', 'Leitor biométrico', 'UPS', 'Switch', 'Router', 'Scanner', 'Telefone IP', 'Monitor'];
const idadeAnos = (d: string) => (Date.now() - new Date(d).getTime()) / 31557600000;
const paraInput = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function ActivosPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const podeGerir = ['ADMIN', 'TECNICO'].includes(user?.perfil);
  const [activos, setActivos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroCat, setFiltroCat] = useState('');
  const [filtroEst, setFiltroEst] = useState('');
  const [detalhe, setDetalhe] = useState<any>(null);
  const [editar, setEditar] = useState<any>(null);
  const [etiquetas, setEtiquetas] = useState<any[] | null>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => {
    api('/activos').then(setActivos).catch((e) => setErro(e.message));
    api('/users/departamentos').then(setDepartamentos).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  const abrirFicha = (id: string) => api(`/activos/${id}`).then(setDetalhe).catch((e) => setErro(e.message));

  const cats = Array.from(new Set(activos.map((a) => a.categoria))).sort();
  const lista = activos.filter((a) =>
    (!filtroCat || a.categoria === filtroCat) && (!filtroEst || a.estado === filtroEst) &&
    (a.numInventario + a.marca + a.modelo + a.localizacao + (a.numSerie ?? '')).toLowerCase().includes(pesquisa.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex-1">Inventário de Activos</h1>
        <button className="btn-contorno" onClick={() => setEtiquetas(lista)}>🏷 Etiquetas QR ({lista.length})</button>
        {podeGerir && <button className="btn-primario" onClick={() => setEditar({})}>＋ Registar activo</button>}
      </div>
      {erro && <p className="text-vermelho text-sm">{erro}</p>}

      <div className="flex gap-2.5 flex-wrap">
        <input className="campo-input flex-1 min-w-[180px]" type="search" placeholder="Pesquisar por código, marca, modelo, série ou localização…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        <select className="campo-input w-auto" value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}>
          <option value="">Todas as categorias</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="campo-input w-auto" value={filtroEst} onChange={(e) => setFiltroEst(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.keys(ESTADO_ACTIVO).map((e) => <option key={e} value={e}>{ESTADO_ACTIVO[e].rotulo}</option>)}
        </select>
      </div>

      <div className="cartao overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              <th className="th">Inventário</th><th className="th">Equipamento</th><th className="th">Localização</th>
              <th className="th">Idade / Ciclo</th><th className="th">Estado</th><th className="th">Falhas 6m</th>
              {podeGerir && <th className="th"></th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((a) => (
              <tr key={a.id} className="hover:bg-[#FAF8F3]">
                <td className="td font-mono text-xs font-semibold cursor-pointer" onClick={() => abrirFicha(a.id)}>{a.numInventario}</td>
                <td className="td cursor-pointer" onClick={() => abrirFicha(a.id)}>
                  <span className="font-medium">{a.marca} {a.modelo}</span>
                  <span className="block text-[11px] text-cinza">{a.categoria}</span>
                </td>
                <td className="td">{a.localizacao}</td>
                <td className={`td font-mono text-xs ${idadeAnos(a.dataAquisicao) > a.cicloVida ? 'text-vermelho' : ''}`}>
                  {idadeAnos(a.dataAquisicao).toFixed(1)} / {a.cicloVida} anos
                </td>
                <td className="td"><span className={`pill ${ESTADO_ACTIVO[a.estado].classe}`}>{ESTADO_ACTIVO[a.estado].rotulo}</span></td>
                <td className={`td font-mono font-semibold ${a.falhas6m >= 5 ? 'text-vermelho' : a.falhas6m >= 3 ? 'text-ambar' : 'text-verde'}`}>{a.falhas6m}</td>
                {podeGerir && (
                  <td className="td text-right whitespace-nowrap">
                    <button className="btn-contorno !px-2.5 !py-1 !text-[11px]" onClick={() => setEditar(a)}>Editar</button>
                  </td>
                )}
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={7} className="td text-center text-cinza py-6">Nenhum activo corresponde à pesquisa.</td></tr>}
          </tbody>
        </table>
      </div>

      {detalhe && <FichaActivo activo={detalhe} fechar={() => setDetalhe(null)} />}
      {editar && (
        <FormActivo
          activo={editar}
          departamentos={departamentos}
          fechar={() => setEditar(null)}
          feito={() => { setEditar(null); carregar(); }}
        />
      )}
      {etiquetas && <Etiquetas activos={etiquetas} fechar={() => setEtiquetas(null)} />}
    </div>
  );
}

/* ---------- Ficha completa ---------- */
function FichaActivo({ activo, fechar }: any) {
  return (
    <div className="fixed inset-0 bg-preto/55 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
        <div className="flex items-center px-5 py-4 border-b border-linha">
          <h3 className="font-bold flex-1">Ficha de equipamento</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="p-5">
          <p className="font-mono text-xs text-vermelho font-semibold">{activo.numInventario}</p>
          <h4 className="text-lg font-semibold mb-3">{activo.marca} {activo.modelo}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px] mb-4">
            <F r="Categoria" v={activo.categoria} />
            <F r="N.º de série" v={activo.numSerie ?? '—'} mono />
            <F r="Estado" v={ESTADO_ACTIVO[activo.estado].rotulo} />
            <F r="Aquisição" v={fmtData(activo.dataAquisicao)} />
            <F r="Garantia" v={activo.fimGarantia ? fmtData(activo.fimGarantia) : '—'} />
            <F r="Localização" v={activo.localizacao} />
            <F r="Departamento" v={activo.departamento?.nome ?? '—'} />
            <F r="Responsável" v={activo.responsavel?.nome ?? 'Equipa TI'} />
            <F r="Falhas (6 meses)" v={String(activo.falhas6m)} />
          </div>
          {activo.motivosObsolescencia?.length >= 2 && (
            <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-dourado rounded-lg p-3 mb-4">
              ♻ <b className="text-dourado">Candidato a abate:</b> {activo.motivosObsolescencia.join(' · ')}
            </p>
          )}
          <p className="text-[13px] font-bold uppercase tracking-wide text-cinza mb-2">Histórico técnico</p>
          <div className="relative pl-5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-linha max-h-64 overflow-y-auto">
            {activo.eventos.map((e: any) => (
              <div key={e.id} className={`relative pb-3.5 before:absolute before:-left-[15px] before:top-1 before:w-2.5 before:h-2.5 before:rounded-full before:ring-1 before:ring-linha ${e.tipo === 'avaria' ? 'before:bg-vermelho' : e.tipo === 'movimentacao' ? 'before:bg-azul' : 'before:bg-dourado'}`}>
                <p className="font-mono text-[11px] text-cinza">{fmtData(e.data)}</p>
                <p className="text-[13px] font-medium">{e.descricao}</p>
                <p className="text-xs text-cinza">{e.autor}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-linha flex justify-end">
          <button className="btn-contorno" onClick={fechar}>Fechar janela</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Registo / edição ---------- */
function FormActivo({ activo, departamentos, fechar, feito }: any) {
  const novo = !activo.id;
  const [f, setF] = useState<any>({
    numInventario: activo.numInventario ?? '',
    categoria: activo.categoria ?? CATEGORIAS[0],
    marca: activo.marca ?? '',
    modelo: activo.modelo ?? '',
    numSerie: activo.numSerie ?? '',
    dataAquisicao: paraInput(activo.dataAquisicao) || new Date().toISOString().slice(0, 10),
    fimGarantia: paraInput(activo.fimGarantia),
    localizacao: activo.localizacao ?? '',
    departamentoId: activo.departamentoId ?? '',
    estado: activo.estado ?? 'OPERACIONAL',
    temDisco: activo.temDisco ?? false,
    falhas6m: activo.falhas6m ?? 0,
    custoReparacao: activo.custoReparacao ?? '',
    valorSubstituicao: activo.valorSubstituicao ?? '',
  });
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);
  const set = (campo: string, valor: any) => setF((s: any) => ({ ...s, [campo]: valor }));

  async function guardar() {
    setErro('');
    if (!String(f.marca).trim() || !String(f.modelo).trim()) { setErro('Marca e modelo são obrigatórios.'); return; }
    setAGuardar(true);
    try {
      const corpo = { ...f, numInventario: String(f.numInventario).trim() || undefined };
      if (novo) await api('/activos', { method: 'POST', body: JSON.stringify(corpo) });
      else await api(`/activos/${activo.id}`, { method: 'PATCH', body: JSON.stringify(corpo) });
      feito();
    } catch (e: any) { setErro(e.message); } finally { setAGuardar(false); }
  }

  return (
    <div className="fixed inset-0 bg-preto/55 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
        <div className="flex items-center px-5 py-4 border-b border-linha">
          <h3 className="font-bold flex-1">{novo ? 'Registar novo activo' : `Editar ${activo.numInventario}`}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="p-5 space-y-3.5">
          {novo && (
            <div>
              <label className="campo-rotulo">N.º de inventário (opcional)</label>
              <input className="campo-input font-mono" value={f.numInventario} onChange={(e) => set('numInventario', e.target.value)} placeholder="Deixe vazio para numeração automática" />
              <p className="text-[11px] text-dourado mt-1">✓ O sistema atribui o próximo número livre da série CGA-INF-XXXX</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="campo-rotulo">Categoria</label>
              <select className="campo-input" value={f.categoria} onChange={(e) => set('categoria', e.target.value)}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-rotulo">Estado</label>
              <select className="campo-input" value={f.estado} onChange={(e) => set('estado', e.target.value)}>
                {Object.keys(ESTADO_ACTIVO).filter((e) => e !== 'ABATIDO').map((e) => (
                  <option key={e} value={e}>{ESTADO_ACTIVO[e].rotulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="campo-rotulo">Marca</label>
              <input className="campo-input" value={f.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Ex.: HP" />
            </div>
            <div>
              <label className="campo-rotulo">Modelo</label>
              <input className="campo-input" value={f.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="Ex.: ProDesk 400 G7" />
            </div>
            <div>
              <label className="campo-rotulo">N.º de série</label>
              <input className="campo-input font-mono" value={f.numSerie} onChange={(e) => set('numSerie', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Localização</label>
              <input className="campo-input" value={f.localizacao} onChange={(e) => set('localizacao', e.target.value)} placeholder="Ex.: Balcão 1 — Atendimento" />
            </div>
            <div>
              <label className="campo-rotulo">Data de aquisição</label>
              <input className="campo-input" type="date" value={f.dataAquisicao} onChange={(e) => set('dataAquisicao', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Fim de garantia</label>
              <input className="campo-input" type="date" value={f.fimGarantia} onChange={(e) => set('fimGarantia', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Departamento</label>
              <select className="campo-input" value={f.departamentoId} onChange={(e) => set('departamentoId', e.target.value)}>
                <option value="">— Não atribuído —</option>
                {departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-rotulo">Falhas nos últimos 6 meses</label>
              <input className="campo-input" type="number" min={0} value={f.falhas6m} onChange={(e) => set('falhas6m', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Custo de reparação (€)</label>
              <input className="campo-input" type="number" min={0} step="0.01" value={f.custoReparacao} onChange={(e) => set('custoReparacao', e.target.value)} placeholder="Se aplicável" />
            </div>
            <div>
              <label className="campo-rotulo">Valor de substituição (€)</label>
              <input className="campo-input" type="number" min={0} step="0.01" value={f.valorSubstituicao} onChange={(e) => set('valorSubstituicao', e.target.value)} placeholder="Se aplicável" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={!!f.temDisco} onChange={(e) => set('temDisco', e.target.checked)} />
            Contém suporte de armazenamento de dados (exige sanitização em caso de abate)
          </label>
          <p className="text-[11.5px] text-cinza">
            Os campos de custo e valor alimentam a análise automática de obsolescência: a reparação acima de 50% do
            valor de substituição é um dos critérios de candidatura a abate.
          </p>
          {erro && <p className="text-vermelho text-sm">{erro}</p>}
        </div>
        <div className="px-5 py-4 border-t border-linha flex justify-end gap-2.5">
          <button className="btn-contorno" onClick={fechar}>Cancelar</button>
          <button className="btn-primario" onClick={guardar} disabled={aGuardar}>{aGuardar ? 'A guardar…' : novo ? 'Registar activo' : 'Guardar alterações'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Etiquetas QR para impressão ---------- */
function Etiquetas({ activos, fechar }: any) {
  const [codigos, setCodigos] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const mapa: Record<string, string> = {};
      for (const a of activos) {
        mapa[a.id] = await QRCode.toDataURL(
          `SIGTEC|${a.numInventario}|${a.marca} ${a.modelo}|${a.numSerie ?? ''}`,
          { margin: 1, width: 220, color: { dark: '#16130F', light: '#FFFFFF' } },
        );
      }
      if (!cancelado) setCodigos(mapa);
    })();
    return () => { cancelado = true; };
  }, [activos]);

  const prontos = Object.keys(codigos).length === activos.length;

  return (
    <div className="fixed inset-0 bg-preto/55 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto print:p-0 print:bg-white" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl print:shadow-none print:max-w-none print:rounded-none">
        <div className="flex items-center px-5 py-4 border-b border-linha print:hidden">
          <h3 className="font-bold flex-1">Etiquetas de inventário ({activos.length})</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="p-5">
          <p className="text-[12.5px] text-cinza mb-4 print:hidden">
            Cada etiqueta identifica o equipamento com o número de inventário e um código QR legível por telemóvel.
            Imprima em papel autocolante e cole no equipamento.
          </p>
          {!prontos && <p className="text-sm text-cinza">A gerar códigos QR…</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {activos.map((a: any) => (
              <div key={a.id} className="border border-preto rounded-lg p-2.5 flex gap-2.5 items-center">
                {codigos[a.id] && <img src={codigos[a.id]} alt={a.numInventario} className="w-16 h-16 shrink-0" />}
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold leading-tight">{a.numInventario}</p>
                  <p className="text-[10px] leading-tight truncate">{a.marca} {a.modelo}</p>
                  <p className="text-[8.5px] text-cinza leading-tight">Consulado Geral de Angola no Porto</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-linha flex justify-end gap-2.5 print:hidden">
          <button className="btn-contorno" onClick={fechar}>Fechar</button>
          <button className="btn-secundario" onClick={() => window.print()} disabled={!prontos}>🖨 Imprimir etiquetas</button>
        </div>
      </div>
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

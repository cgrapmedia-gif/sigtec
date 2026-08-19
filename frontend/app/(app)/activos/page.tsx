'use client';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api, getUser } from '@/lib/api';
import { pode } from '@/lib/permissoes';
import SeletorComCriar from '@/components/SeletorComCriar';
import RegistoEmLote from '@/components/RegistoEmLote';
import { ESTADO_ACTIVO, fmtData } from '@/lib/formato';

const TIPOS: Record<string, string> = {
  EQUIPAMENTO: 'Equipamento', SOFTWARE: 'Software', SERVICO: 'Serviço',
  CONTRATO: 'Contrato', INFRAESTRUTURA: 'Infraestrutura', CONSUMIVEL: 'Consumível',
};
const RELACOES: Record<string, string> = {
  DEPENDE_DE: 'depende de', ALIMENTA: 'alimenta', INSTALADO_EM: 'instalado em',
  LIGADO_A: 'ligado a', COBERTO_POR: 'coberto por', SUBSTITUI: 'substitui',
};
const idadeAnos = (d: string) => (Date.now() - new Date(d).getTime()) / 31557600000;
const paraInput = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function ActivosPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const podeGerir = ['ADMIN', 'TECNICO'].includes(user?.perfil);
  const [activos, setActivos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [utilizadores, setUtilizadores] = useState<any[]>([]);
  const [localizacoes, setLocalizacoes] = useState<any>({ pisos: [], salas: [], sectores: [], postos: [] });
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [impacto, setImpacto] = useState<any>(null);
  const [lote, setLote] = useState(false);
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
    api('/categorias').then(setCategorias).catch(() => {});
    api('/fornecedores').then(setFornecedores).catch(() => {});
    api('/contratos').then(setContratos).catch(() => {});
    api('/users/simples').then(setUtilizadores).catch(() => {});
    api('/activos/localizacoes').then(setLocalizacoes).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  const abrirFicha = (id: string) => api(`/activos/${id}`).then(setDetalhe).catch((e) => setErro(e.message));

  const cats = Array.from(new Set(activos.map((a) => a.categoria))).sort();
  const lista = activos.filter((a) =>
    (!filtroTipo || a.tipo === filtroTipo) &&
    (!filtroSector || a.sector === filtroSector) &&
    (!filtroCat || a.categoria === filtroCat) && (!filtroEst || a.estado === filtroEst) &&
    (a.numInventario + a.marca + a.modelo + (a.designacao ?? '') + a.localizacao + (a.numSerie ?? '')).toLowerCase().includes(pesquisa.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="hidden lg:block text-xl font-bold flex-1">Itens de Configuração</h1>
        <button className="btn-contorno" onClick={() => setEtiquetas(lista)}>🏷 Etiquetas QR ({lista.length})</button>
        {podeGerir && (
          <>
            <button className="btn-contorno flex-1 lg:flex-none" onClick={() => setLote(true)}>⧉ Registar vários</button>
            <button className="btn-primario flex-1 lg:flex-none" onClick={() => setEditar({ assistido: true })}>＋ Registar item</button>
          </>
        )}
      </div>
      {erro && <p className="text-vermelho text-sm">{erro}</p>}

      {/* Separadores por categoria — a mesma lógica dos pedidos, em todo o sistema */}
      <div className="separadores">
        <BotaoFiltro activa={filtroCat === ''} onClick={() => setFiltroCat('')} rotulo="Todas" total={activos.length} />
        {cats.map((c) => (
          <BotaoFiltro key={c} activa={filtroCat === c} onClick={() => setFiltroCat(c)} rotulo={c}
            icone={activos.find((a) => a.categoria === c)?.categoriaRef?.icone}
            total={activos.filter((a) => a.categoria === c).length} />
        ))}
      </div>

      <div className="flex gap-2.5 flex-wrap">
        <input className="campo-input flex-1 min-w-[180px]" type="search" placeholder="Pesquisar por código, marca, modelo, série ou localização…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        <select className="campo-input w-auto" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPOS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
        <select className="campo-input w-auto" value={filtroSector} onChange={(e) => setFiltroSector(e.target.value)}>
          <option value="">Todos os sectores</option>
          {localizacoes.sectores.map((x: string) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="campo-input w-auto" value={filtroEst} onChange={(e) => setFiltroEst(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.keys(ESTADO_ACTIVO).map((e) => <option key={e} value={e}>{ESTADO_ACTIVO[e].rotulo}</option>)}
        </select>
      </div>

      <div className="cartao envolvente-tabela overflow-x-auto">
        <table className="w-full tabela-adaptavel lg:min-w-[720px]">
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
                <td data-principal className="td font-mono text-xs font-semibold cursor-pointer" onClick={() => abrirFicha(a.id)}>{a.numInventario}</td>
                <td data-rotulo="Item" className="td cursor-pointer" onClick={() => abrirFicha(a.id)}>
                  <span className="font-medium">{a.designacao || `${a.marca} ${a.modelo}`}</span>
                  <span className="block text-[11px] text-cinza">
                    {a.categoriaRef?.icone ? `${a.categoriaRef.icone} ` : ''}{a.categoria}
                    {a.tipo !== 'EQUIPAMENTO' && <span className="pill bg-linha text-cinza ml-1.5">{TIPOS[a.tipo]}</span>}
                  </span>
                </td>
                <td data-rotulo="Onde está" className="td">
                  <span className="block">{[a.piso, a.sala].filter(Boolean).join(' · ') || a.localizacao}</span>
                  {(a.sector || a.responsavel) && (
                    <span className="block text-[11px] text-cinza">
                      {[a.sector, a.responsavel?.nome].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </td>
                <td data-rotulo="Idade / Ciclo" className={`td font-mono text-xs ${idadeAnos(a.dataAquisicao) > a.cicloVida ? 'text-vermelho' : ''}`}>
                  {idadeAnos(a.dataAquisicao).toFixed(1)} / {a.cicloVida} anos
                </td>
                <td data-rotulo="Estado" className="td"><span className={`pill ${ESTADO_ACTIVO[a.estado].classe}`}>{ESTADO_ACTIVO[a.estado].rotulo}</span></td>
                <td data-rotulo="Falhas 6m" className={`td font-mono font-semibold ${(a.falhasCalculadas ?? 0) >= 5 ? 'text-vermelho' : (a.falhasCalculadas ?? 0) >= 3 ? 'text-ambar' : 'text-verde'}`}>
                  {a.falhasCalculadas ?? 0}
                  <span className="block text-[9.5px] font-sans font-normal text-cinza">calculadas</span>
                </td>
                {podeGerir && (
                  <td data-accoes className="td text-right whitespace-nowrap">
                    <button className="btn-contorno !min-h-0 btn-mini mr-1"
                      onClick={() => api(`/activos/${a.id}/impacto`).then(setImpacto).catch((e) => setErro(e.message))}>Impacto</button>
                    <button className="btn-contorno !min-h-0 btn-mini" onClick={() => setEditar(a)}>Editar</button>
                  </td>
                )}
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={7} className="td vazio">Nenhum activo corresponde à pesquisa.</td></tr>}
          </tbody>
        </table>
      </div>

      {detalhe && <FichaActivo activo={detalhe} fechar={() => setDetalhe(null)} recarregar={carregar} todosItens={activos} />}
      {impacto && <ModalImpacto dados={impacto} fechar={() => setImpacto(null)} />}
      {editar && (
        <FormActivo
          activo={editar}
          departamentos={departamentos}
          categorias={categorias}
          fornecedores={fornecedores}
          contratos={contratos}
          todosItens={activos}
          utilizadores={utilizadores}
          recarregarListas={carregar}
          localizacoes={localizacoes}
          fechar={() => setEditar(null)}
          feito={() => { setEditar(null); carregar(); }}
        />
      )}
      {etiquetas && <Etiquetas activos={etiquetas} fechar={() => setEtiquetas(null)} />}
      {lote && (
        <RegistoEmLote categorias={categorias} departamentos={departamentos} fornecedores={fornecedores}
          contratos={contratos} recarregar={carregar} fechar={() => setLote(false)}
          feito={() => { setLote(false); carregar(); }} />
      )}
    </div>
  );
}

/* ---------- Ficha completa ---------- */
function FichaActivo({ activo, fechar, recarregar, todosItens }: any) {
  const [aRegistar, setARegistar] = useState(false);
  const [novoEvento, setNovoEvento] = useState({ descricao: '', tipo: 'intervencao' });
  const [aRelacionar, setARelacionar] = useState(false);
  const [novaRelacao, setNovaRelacao] = useState({ destinoId: '', tipo: 'DEPENDE_DE', critica: false });
  const [msgFicha, setMsgFicha] = useState('');

  async function guardarEvento() {
    if (novoEvento.descricao.trim().length < 5) { setMsgFicha('Descreva a intervenção.'); return; }
    try {
      await api(`/activos/${activo.id}/eventos`, { method: 'POST', body: JSON.stringify(novoEvento) });
      setARegistar(false); setNovoEvento({ descricao: '', tipo: 'intervencao' });
      fechar(); recarregar?.();
    } catch (e: any) { setMsgFicha(e.message); }
  }

  async function guardarRelacao() {
    if (!novaRelacao.destinoId) { setMsgFicha('Escolha o item.'); return; }
    try {
      await api('/activos/relacoes', { method: 'POST', body: JSON.stringify({ origemId: activo.id, ...novaRelacao }) });
      setARelacionar(false); setNovaRelacao({ destinoId: '', tipo: 'DEPENDE_DE', critica: false });
      fechar(); recarregar?.();
    } catch (e: any) { setMsgFicha(e.message); }
  }

  async function removerRelacao(id: string) {
    try { await api(`/activos/relacoes/${id}`, { method: 'DELETE' }); fechar(); recarregar?.(); }
    catch (e: any) { setMsgFicha(e.message); }
  }
  const campos: any[] = Array.isArray(activo.categoriaRef?.esquemaCampos) ? activo.categoriaRef.esquemaCampos : [];
  const valores: any = activo.camposPersonalizados ?? {};
  const dependeDe = activo.relacoesOrigem ?? [];
  const sustenta = activo.relacoesDestino ?? [];
  const podeGerirFicha = pode('itens.relacoes.gerir');
  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa lg:max-w-2xl">
        <div className="modal-cabecalho">
          <h3 className="font-bold flex-1">Ficha de equipamento</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo">
          <p className="font-mono text-xs text-vermelho font-semibold">{activo.numInventario}</p>
          <h4 className="text-lg font-semibold mb-3">{activo.designacao || `${activo.marca} ${activo.modelo}`}</h4>

          {(activo.fornecedor || activo.contrato) && (
            <div className="bg-preto text-[#EDE9E0] rounded-xl p-3.5 mb-4">
              <p className="text-[10.5px] uppercase tracking-wider text-[#A79F92] font-semibold mb-1.5">Quem contactar</p>
              {activo.fornecedor && (
                <p className="text-[13px]">
                  <b>{activo.fornecedor.nome}</b>
                  {activo.fornecedor.apoioTecnico && <> · Apoio: <b className="text-douradoClaro">{activo.fornecedor.apoioTecnico}</b></>}
                  {activo.fornecedor.telefone && <> · {activo.fornecedor.telefone}</>}
                </p>
              )}
              {activo.contrato && (
                <p className="text-[12.5px] text-[#CFC9BD] mt-1">
                  Contrato <span className="font-mono">{activo.contrato.numero}</span> — {activo.contrato.designacao}
                  {activo.contrato.slaHoras && <> · SLA {activo.contrato.slaHoras}h</>}
                  {activo.contrato.dataFim && <> · válido até {fmtData(activo.contrato.dataFim)}</>}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-[13px] mb-4">
            <F r="Categoria" v={activo.categoria} />
            <F r="N.º de série" v={activo.numSerie ?? '—'} mono />
            <F r="Estado" v={ESTADO_ACTIVO[activo.estado].rotulo} />
            <F r="Aquisição" v={fmtData(activo.dataAquisicao)} />
            <F r="Garantia" v={activo.fimGarantia ? fmtData(activo.fimGarantia) : '—'} />
            <F r="Localização" v={activo.localizacao} />
            <F r="Departamento" v={activo.departamento?.nome ?? '—'} />
            <F r="Responsável" v={activo.responsavel?.nome ?? 'Equipa TI'} />
            <F r="Falhas (6 meses)" v={`${activo.falhasCalculadas ?? 0} (calculadas dos pedidos)`} />
            <F r="Criticidade" v={`${activo.criticidade}/5`} />
          </div>

          {campos.length > 0 && (
            <div className="mb-4">
              <p className="text-[13px] font-bold uppercase tracking-wide text-cinza mb-2">Campos da categoria</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-[13px]">
                {campos.map((c: any) => <F key={c.chave} r={c.rotulo} v={String(valores[c.chave] ?? '—')} />)}
              </div>
            </div>
          )}

          {(dependeDe.length > 0 || sustenta.length > 0 || podeGerirFicha) && (
            <div className="mb-4">
              <p className="text-[13px] font-bold uppercase tracking-wide text-cinza mb-2">Dependências</p>
              {dependeDe.length > 0 && (
                <p className="text-[13px] mb-1.5">
                  <b>Este item {RELACOES[dependeDe[0].tipo]}:</b>{' '}
                  {dependeDe.map((r: any) => (
                    <span key={r.id} className="pill bg-linha text-cinza mr-1">
                      {r.destino.numInventario} — {r.destino.designacao || `${r.destino.marca} ${r.destino.modelo}`}
                      {podeGerirFicha && <button className="ml-1.5 text-vermelho" onClick={() => removerRelacao(r.id)}>✕</button>}
                    </span>
                  ))}
                </p>
              )}
              {podeGerirFicha && (
                aRelacionar ? (
                  <div className="border border-linha rounded-xl p-3 mt-2 space-y-2.5">
                    <div>
                      <label className="campo-rotulo">Este item…</label>
                      <select className="campo-input" value={novaRelacao.tipo}
                        onChange={(e) => setNovaRelacao((s: any) => ({ ...s, tipo: e.target.value }))}>
                        {Object.entries(RELACOES).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="campo-rotulo">…este outro item</label>
                      <select className="campo-input" value={novaRelacao.destinoId}
                        onChange={(e) => setNovaRelacao((s: any) => ({ ...s, destinoId: e.target.value }))}>
                        <option value="">— Seleccionar —</option>
                        {(todosItens ?? []).filter((x: any) => x.id !== activo.id).map((x: any) => (
                          <option key={x.id} value={x.id}>{x.numInventario} — {x.designacao || `${x.marca} ${x.modelo}`}</option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-[12.5px]">
                      <input type="checkbox" checked={novaRelacao.critica}
                        onChange={(e) => setNovaRelacao((s: any) => ({ ...s, critica: e.target.checked }))} />
                      Dependência crítica (a falha interrompe o serviço)
                    </label>
                    <div className="flex gap-2">
                      <button className="btn-contorno !min-h-0 !py-1.5 !text-xs flex-1" onClick={() => setARelacionar(false)}>Cancelar</button>
                      <button className="btn-primario !min-h-0 !py-1.5 !text-xs flex-1" onClick={guardarRelacao}>Guardar dependência</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-contorno btn-mini mt-2" onClick={() => setARelacionar(true)}>
                    ＋ Acrescentar dependência
                  </button>
                )
              )}
              {sustenta.length > 0 && (
                <p className="text-[13px]">
                  <b className="text-vermelho">Se este item falhar, é afectado:</b>{' '}
                  {sustenta.map((r: any) => (
                    <span key={r.id} className={`pill mr-1 ${r.critica ? 'bg-vermelho/10 text-vermelho' : 'bg-linha text-cinza'}`}>
                      {r.origem.numInventario} — {r.origem.designacao || `${r.origem.marca} ${r.origem.modelo}`}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
          {activo.motivosObsolescencia?.length >= 2 && (
            <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-dourado rounded-lg p-3 mb-4">
              ♻ <b className="text-dourado">Candidato a abate:</b> {activo.motivosObsolescencia.join(' · ')}
            </p>
          )}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-[13px] font-bold uppercase tracking-wide text-cinza flex-1">Histórico técnico</p>
            {podeGerirFicha && !aRegistar && (
              <button className="btn-contorno btn-mini" onClick={() => setARegistar(true)}>＋ Registar intervenção</button>
            )}
          </div>
          {aRegistar && (
            <div className="border border-linha rounded-xl p-3 mb-3 space-y-2.5">
              <div>
                <label className="campo-rotulo">Descrição da intervenção ou ocorrência</label>
                <textarea className="campo-input min-h-[70px]" value={novoEvento.descricao}
                  onChange={(e) => setNovoEvento((s: any) => ({ ...s, descricao: e.target.value }))}
                  placeholder="Ex.: Substituído o disco por SSD de 480 GB e reinstalado o sistema." />
              </div>
              <div>
                <label className="campo-rotulo">Tipo</label>
                <select className="campo-input" value={novoEvento.tipo}
                  onChange={(e) => setNovoEvento((s: any) => ({ ...s, tipo: e.target.value }))}>
                  <option value="intervencao">Intervenção técnica</option>
                  <option value="avaria">Avaria</option>
                  <option value="movimentacao">Movimentação</option>
                  <option value="instalacao">Instalação</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="btn-contorno !min-h-0 !py-1.5 !text-xs flex-1" onClick={() => setARegistar(false)}>Cancelar</button>
                <button className="btn-primario !min-h-0 !py-1.5 !text-xs flex-1" onClick={guardarEvento}>Guardar no histórico</button>
              </div>
            </div>
          )}
          {msgFicha && <p className="text-vermelho text-sm mb-2">{msgFicha}</p>}
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
        <div className="modal-rodape">
          <button className="btn-contorno" onClick={fechar}>Fechar janela</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Registo / edição ---------- */
function FormActivo({ activo, departamentos, categorias, fornecedores, contratos, todosItens, utilizadores, recarregarListas, localizacoes, fechar, feito }: any) {
  const novo = !activo.id;
  const [f, setF] = useState<any>({
    numInventario: activo.numInventario ?? '',
    tipo: activo.tipo ?? 'EQUIPAMENTO',
    designacao: activo.designacao ?? '',
    categoriaId: activo.categoriaId ?? '',
    criticidade: activo.criticidade ?? 3,
    fornecedorId: activo.fornecedorId ?? '',
    contratoId: activo.contratoId ?? '',
    marca: activo.marca ?? '',
    modelo: activo.modelo ?? '',
    numSerie: activo.numSerie ?? '',
    dataAquisicao: paraInput(activo.dataAquisicao) || new Date().toISOString().slice(0, 10),
    fimGarantia: paraInput(activo.fimGarantia),
    localizacao: activo.localizacao ?? '',
    piso: activo.piso ?? '',
    sala: activo.sala ?? '',
    sector: activo.sector ?? '',
    posto: activo.posto ?? '',
    departamentoId: activo.departamentoId ?? '',
    responsavelId: activo.responsavelId ?? '',
    estado: activo.estado ?? 'OPERACIONAL',
    temDisco: activo.temDisco ?? false,
    falhas6m: activo.falhas6m ?? 0,
    custoReparacao: activo.custoReparacao ?? '',
    valorSubstituicao: activo.valorSubstituicao ?? '',
  });
  const [camposProprios, setCamposProprios] = useState<any>(activo.camposPersonalizados ?? {});
  const catSeleccionada = categorias.find((c: any) => c.id === f.categoriaId);
  const esquema: any[] = Array.isArray(catSeleccionada?.esquemaCampos) ? catSeleccionada.esquemaCampos : [];
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);
  // Modo assistido: só o essencial, com explicações. Modo completo: todos os campos.
  const [modo, setModo] = useState<'assistido' | 'completo'>(novo && activo.assistido ? 'assistido' : 'completo');
  const set = (campo: string, valor: any) => setF((s: any) => ({ ...s, [campo]: valor }));

  async function guardar() {
    setErro('');
    if (f.tipo === 'EQUIPAMENTO' && (!String(f.marca).trim() || !String(f.modelo).trim())) { setErro('Marca e modelo são obrigatórios para equipamentos.'); return; }
    if (f.tipo !== 'EQUIPAMENTO' && !String(f.designacao).trim()) { setErro('A designação é obrigatória para este tipo de item.'); return; }
    setAGuardar(true);
    try {
      const corpo = { ...f, camposPersonalizados: camposProprios, numInventario: String(f.numInventario).trim() || undefined };
      if (novo) await api('/activos', { method: 'POST', body: JSON.stringify(corpo) });
      else await api(`/activos/${activo.id}`, { method: 'PATCH', body: JSON.stringify(corpo) });
      feito();
    } catch (e: any) { setErro(e.message); } finally { setAGuardar(false); }
  }

  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa lg:max-w-2xl">
        <div className="modal-cabecalho">
          <div className="flex-1">
            <h3 className="font-bold">{novo ? 'Registar item de configuração' : `Editar ${activo.numInventario}`}</h3>
            {novo && (
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
            )}
          </div>
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
          <div className="grid lg:grid-cols-2 gap-3.5">
            <div>
              <label className="campo-rotulo">Tipo de item</label>
              <select className="campo-input" value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
                {Object.entries(TIPOS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
            </div>
            <SeletorComCriar rotulo="Categoria" valor={f.categoriaId} aoMudar={(v) => set('categoriaId', v)}
              opcoes={categorias.filter((c: any) => c.tipo === f.tipo).map((c: any) => ({ id: c.id, nome: `${c.icone ?? ''} ${c.nome}`.trim() }))}
              endpoint="/categorias" aoCriar={recarregarListas}
              ajuda="Define o ciclo de vida e os critérios de obsolescência do item"
              campos={[
                { chave: 'nome', rotulo: 'Nome da categoria', obrigatorio: true },
                { chave: 'tipo', rotulo: 'Tipo', tipo: 'seleccao', opcoes: Object.keys(TIPOS), valorInicial: f.tipo },
                { chave: 'cicloVidaMeses', rotulo: 'Ciclo de vida (meses)', tipo: 'numero', valorInicial: '60' },
                { chave: 'icone', rotulo: 'Ícone', valorInicial: '🔧' },
              ]} />
            <div className="lg:col-span-2">
              <label className="campo-rotulo">Designação {f.tipo === 'EQUIPAMENTO' && '(opcional)'}</label>
              <input className="campo-input" value={f.designacao} onChange={(e) => set('designacao', e.target.value)}
                placeholder={f.tipo === 'SERVICO' ? 'Ex.: Ligação de Internet dedicada — sede' : 'Descrição do item'} />
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
            <div className="lg:col-span-2">
              <fieldset className="border border-linha rounded-xl p-3.5">
                <legend className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza px-1.5">
                  Onde está o equipamento
                </legend>
                <div className="grid lg:grid-cols-2 gap-3.5">
                  <div>
                    <label className="campo-rotulo">Piso / Andar</label>
                    <input className="campo-input" value={f.piso} onChange={(e) => set('piso', e.target.value)}
                      list="lista-pisos" placeholder="Ex.: Piso 1" />
                    <datalist id="lista-pisos">{(localizacoes?.pisos ?? []).map((x: string) => <option key={x} value={x} />)}</datalist>
                  </div>
                  <div>
                    <label className="campo-rotulo">Sala</label>
                    <input className="campo-input" value={f.sala} onChange={(e) => set('sala', e.target.value)}
                      list="lista-salas" placeholder="Ex.: Sala 12" />
                    <datalist id="lista-salas">{(localizacoes?.salas ?? []).map((x: string) => <option key={x} value={x} />)}</datalist>
                  </div>
                  <div>
                    <label className="campo-rotulo">Sector</label>
                    <input className="campo-input" value={f.sector} onChange={(e) => set('sector', e.target.value)}
                      list="lista-sectores" placeholder="Ex.: Atendimento (frontoffice)" />
                    <datalist id="lista-sectores">{(localizacoes?.sectores ?? []).map((x: string) => <option key={x} value={x} />)}</datalist>
                  </div>
                  <div>
                    <label className="campo-rotulo">Posto de trabalho</label>
                    <input className="campo-input" value={f.posto} onChange={(e) => set('posto', e.target.value)}
                      list="lista-postos" placeholder="Ex.: Balcão 1" />
                    <datalist id="lista-postos">{(localizacoes?.postos ?? []).map((x: string) => <option key={x} value={x} />)}</datalist>
                  </div>
                </div>
                <p className="text-[11px] text-cinza mt-2">
                  O sector distingue, por exemplo, o computador do <b>atendimento</b> do computador de
                  <b> backoffice</b> do mesmo funcionário — é o que lhe permite identificar o equipamento certo
                  ao abrir um pedido.
                </p>
              </fieldset>
            </div>
            <div>
              <label className="campo-rotulo">Data de aquisição</label>
              <input className="campo-input" type="date" value={f.dataAquisicao} onChange={(e) => set('dataAquisicao', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Fim de garantia</label>
              <input className="campo-input" type="date" value={f.fimGarantia} onChange={(e) => set('fimGarantia', e.target.value)} />
            </div>
            <SeletorComCriar rotulo="Departamento" valor={f.departamentoId} aoMudar={(v) => set('departamentoId', v)}
              opcoes={departamentos.map((d: any) => ({ id: d.id, nome: d.nome }))}
              endpoint="/departamentos" aoCriar={recarregarListas} textoVazio="— Não atribuído —"
              campos={[{ chave: 'nome', rotulo: 'Nome do departamento', obrigatorio: true }]} />
            <div>
              <label className="campo-rotulo">Responsável</label>
              <select className="campo-input" value={f.responsavelId} onChange={(e) => set('responsavelId', e.target.value)}>
                <option value="">— Equipa TI —</option>
                {utilizadores.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.nome}{u.localizacao ? ` · ${u.localizacao}` : ''}</option>
                ))}
              </select>
              <p className="text-[11px] text-dourado mt-1">✓ Once-Only: o item passa a aparecer nos pedidos deste utilizador</p>
            </div>
            {modo === 'completo' && (
              <SeletorComCriar rotulo="Fornecedor" valor={f.fornecedorId} aoMudar={(v) => set('fornecedorId', v)}
                opcoes={fornecedores.map((x: any) => ({ id: x.id, nome: x.nome }))}
                endpoint="/fornecedores" aoCriar={recarregarListas} textoVazio="— Nenhum —"
                ajuda="Aparece na ficha como «quem contactar» em caso de avaria"
                campos={[
                  { chave: 'nome', rotulo: 'Nome do fornecedor', obrigatorio: true },
                  { chave: 'telefone', rotulo: 'Telefone' },
                  { chave: 'apoioTecnico', rotulo: 'Linha de apoio técnico' },
                ]} />
            )}
            {modo === 'completo' && (
              <div>
                <label className="campo-rotulo">Contrato associado</label>
                <select className="campo-input" value={f.contratoId} onChange={(e) => set('contratoId', e.target.value)}>
                  <option value="">— Nenhum —</option>
                  {contratos.map((x: any) => <option key={x.id} value={x.id}>{x.numero} — {x.designacao}</option>)}
                </select>
              </div>
            )}
            {modo === 'completo' && <div>
              <label className="campo-rotulo">Criticidade (1 a 5)</label>
              <select className="campo-input" value={f.criticidade} onChange={(e) => set('criticidade', e.target.value)}>
                <option value="1">1 — Sem impacto no serviço</option>
                <option value="2">2 — Impacto reduzido</option>
                <option value="3">3 — Impacto moderado</option>
                <option value="4">4 — Afecta o atendimento</option>
                <option value="5">5 — Serviço parado</option>
              </select>
            </div>}
            {modo === 'completo' && <div>
              <label className="campo-rotulo">Custo de reparação (€)</label>
              <input className="campo-input" type="number" min={0} step="0.01" value={f.custoReparacao} onChange={(e) => set('custoReparacao', e.target.value)} placeholder="Se aplicável" />
            </div>}
            <div>
              <label className="campo-rotulo">Valor de substituição (€)</label>
              <input className="campo-input" type="number" min={0} step="0.01" value={f.valorSubstituicao} onChange={(e) => set('valorSubstituicao', e.target.value)} placeholder="Se aplicável" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={!!f.temDisco} onChange={(e) => set('temDisco', e.target.checked)} />
            Contém suporte de armazenamento de dados (exige sanitização em caso de abate)
          </label>
          {esquema.length > 0 && (
            <fieldset className="border border-linha rounded-xl p-3.5">
              <legend className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza px-1.5">
                Campos de «{catSeleccionada.nome}»
              </legend>
              <div className="grid lg:grid-cols-2 gap-3.5">
                {esquema.map((c: any) => (
                  <div key={c.chave}>
                    <label className="campo-rotulo">{c.rotulo}</label>
                    <input className="campo-input"
                      type={c.tipo === 'numero' ? 'number' : c.tipo === 'data' ? 'date' : 'text'}
                      value={camposProprios[c.chave] ?? ''}
                      onChange={(e) => setCamposProprios((s: any) => ({ ...s, [c.chave]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </fieldset>
          )}
          <p className="text-[11.5px] text-cinza">
            As falhas dos últimos 6 meses são <b>calculadas automaticamente</b> a partir dos pedidos registados neste
            item — a decisão de abate assenta em factos, não em valores declarados. Os campos de custo e valor
            alimentam o critério de rácio de reparação definido na categoria.
          </p>
          {erro && <p className="text-vermelho text-sm">{erro}</p>}
        </div>
        <div className="modal-rodape">
          <button className="btn-contorno" onClick={fechar}>Cancelar</button>
          <button className="btn-primario flex-1 lg:flex-none" onClick={guardar} disabled={aGuardar}>{aGuardar ? 'A guardar…' : novo ? 'Registar activo' : 'Guardar alterações'}</button>
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
    <div className="modal-fundo print:p-0 print:bg-white" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa lg:max-w-3xl print:shadow-none print:max-w-none print:rounded-none">
        <div className="modal-cabecalho print:hidden">
          <h3 className="font-bold flex-1">Etiquetas de inventário ({activos.length})</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo">
          <p className="text-[12.5px] text-cinza mb-4 print:hidden">
            Cada etiqueta identifica o equipamento com o número de inventário e um código QR legível por telemóvel.
            Imprima em papel autocolante e cole no equipamento.
          </p>
          {!prontos && <p className="text-sm text-cinza">A gerar códigos QR…</p>}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
        <div className="modal-rodape print:hidden">
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


/** «Se isto falhar, o que para?» — resposta imediata para o técnico */
function ModalImpacto({ dados, fechar }: any) {
  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa lg:max-w-2xl">
        <div className="modal-cabecalho">
          <h3 className="font-bold flex-1">Análise de impacto</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo">
          <p className="text-[13px] mb-1">Se <b className="font-mono">{dados.item.numInventario}</b> — {dados.item.designacao || `${dados.item.marca} ${dados.item.modelo}`} — ficar indisponível:</p>
          {dados.totalAfectados === 0 ? (
            <p className="text-[13px] text-verde font-semibold mt-3">
              ✓ Nenhum outro item depende deste. Intervenção sem impacto conhecido no serviço.
            </p>
          ) : (
            <>
              <p className={`text-[13px] font-semibold mt-2 mb-3 ${dados.criticos ? 'text-vermelho' : 'text-ambar'}`}>
                ⚠ {dados.totalAfectados} item(ns) afectado(s){dados.criticos > 0 && `, dos quais ${dados.criticos} crítico(s)`}.
                {dados.criticos > 0 && ' Planear janela de intervenção fora do horário de atendimento.'}
              </p>
              <table className="w-full tabela-adaptavel">
                <thead><tr><th className="th">Item</th><th className="th">Localização</th><th className="th">Via</th><th className="th">Nível</th></tr></thead>
                <tbody>
                  {dados.afectados.map((a: any) => (
                    <tr key={a.id}>
                      <td data-principal className="td">
                        <span className="font-mono text-xs font-semibold">{a.numInventario}</span>
                        <span className="block text-[12px]">{a.designacao || `${a.marca} ${a.modelo}`}</span>
                      </td>
                      <td data-rotulo="Localização" className="td text-[12px]">{a.localizacao}</td>
                      <td data-rotulo="Via" className="td text-[12px] text-cinza">{RELACOES[a.viaRelacao]}</td>
                      <td data-rotulo="Nível" className="td">
                        {a.critica || a.criticidade >= 4
                          ? <span className="pill bg-vermelho/10 text-vermelho">crítico</span>
                          : <span className="pill bg-linha text-cinza">nível {a.nivel}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        <div className="modal-rodape">
          <button className="btn-contorno" onClick={fechar}>Fechar</button>
        </div>
      </div>
    </div>
  );
}


/** Separador de filtro — usado no inventário e na manutenção, para uniformidade */
function BotaoFiltro({ activa, onClick, rotulo, total, icone }: any) {
  return (
    <button onClick={onClick}
      className={`separador ${activa ? 'activo' : ''}`}>
      <span className="block text-[12.5px] font-semibold whitespace-nowrap">{icone ? `${icone} ` : ''}{rotulo}</span>
      <span className={`block text-[10.5px] ${activa ? 'text-douradoClaro' : 'text-cinza'}`}>{total} item(ns)</span>
    </button>
  );
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import { ESTADO_PEDIDO, PRIORIDADE, fmtData, fmtDataHora } from '@/lib/formato';

const CATEGORIAS = ['Hardware', 'Software', 'Rede', 'Impressão', 'Aplicação', 'Sistema biométrico'];
const ESTADOS = Object.keys(ESTADO_PEDIDO);

export default function PedidosPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const podeGerir = ['ADMIN', 'TECNICO'].includes(user?.perfil);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [novo, setNovo] = useState(false);
  const [detalhe, setDetalhe] = useState<any>(null);
  const [aAvaliar, setAAvaliar] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => {
    api('/pedidos').then(setPedidos).catch((e) => setMsg(e.message));
    // Once-Only: o funcionário recebe os equipamentos que lhe estão atribuídos;
    // os perfis de gestão recebem o inventário completo.
    const origem = user?.perfil === 'FUNCIONARIO' ? '/activos/meus' : '/activos';
    api(origem).then(setActivos).catch(() => {});
  }, [user?.perfil]);
  useEffect(carregar, [carregar]);

  const lista = pedidos.filter((p) =>
    (!filtroEstado || p.estado === filtroEstado) &&
    (p.assunto + p.numero + (p.autor?.nome ?? '')).toLowerCase().includes(pesquisa.toLowerCase()),
  );

  async function abrirDetalhe(id: string) {
    try { setDetalhe(await api(`/pedidos/${id}`)); } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex-1">Pedidos Técnicos</h1>
        <button className="btn-primario" onClick={() => setNovo(true)}>＋ Abrir pedido</button>
      </div>

      {user?.perfil === 'FUNCIONARIO' && (
        <p className="text-[13px] text-cinza">Vê apenas os seus pedidos. Consultas de terceiros aos seus dados ficam no seu Data Tracker (Transparência).</p>
      )}
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <div className="flex gap-2.5 flex-wrap">
        <input className="campo-input flex-1 min-w-[180px]" type="search" placeholder="Pesquisar por assunto, número ou autor…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        <select className="campo-input w-auto" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos os estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_PEDIDO[e].rotulo}</option>)}
        </select>
      </div>

      <div className="cartao overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead><tr><th className="th">N.º</th><th className="th">Assunto</th><th className="th">Prioridade / SLA</th><th className="th">Estado</th><th className="th">Data</th></tr></thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} className="cursor-pointer hover:bg-[#FAF8F3]" onClick={() => abrirDetalhe(p.id)}>
                <td className="td font-mono text-xs text-vermelho font-semibold">#{p.numero}</td>
                <td className="td">
                  <span className="font-medium">{p.assunto}</span>
                  <span className="block text-[11px] text-cinza">{p.categoria} · {p.autor?.nome}</span>
                </td>
                <td className="td">
                  <span className={`pill ${PRIORIDADE[p.prioridade].classe}`}>{PRIORIDADE[p.prioridade].rotulo}</span>
                  <span className="block mt-1"><EstadoSla sla={p.sla} horas={p.slaHoras} /></span>
                </td>
                <td className="td"><span className={`pill ${ESTADO_PEDIDO[p.estado].classe}`}>{ESTADO_PEDIDO[p.estado].rotulo}</span></td>
                <td className="td font-mono text-xs">
                  {fmtData(p.criadoEm)}
                  {['RESOLVIDO', 'FECHADO'].includes(p.estado) && p.autor?.nome === user?.nome && (
                    p.satisfacao
                      ? <span className="block text-[11px] text-verde font-sans font-semibold mt-1">★ {p.satisfacao}/5</span>
                      : <button className="block text-[11px] text-vermelho font-sans font-semibold mt-1 hover:underline"
                          onClick={(e) => { e.stopPropagation(); setAAvaliar(p); }}>Avaliar atendimento</button>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={5} className="td text-center text-cinza py-6">Sem pedidos para mostrar. Abra o primeiro pedido para começar o registo.</td></tr>}
          </tbody>
        </table>
      </div>

      {novo && <NovoPedido activos={activos} user={user} fechar={() => setNovo(false)} feito={() => { setNovo(false); carregar(); }} />}
      {detalhe && <DetalhePedido pedido={detalhe} podeGerir={podeGerir} fechar={() => setDetalhe(null)} feito={() => { setDetalhe(null); carregar(); }} />}
      {aAvaliar && <ModalAvaliacao pedido={aAvaliar} fechar={() => setAAvaliar(null)} feito={() => { setAAvaliar(null); carregar(); }} />}
    </div>
  );
}

function NovoPedido({ activos, user, fechar, feito }: any) {
  const [assunto, setAssunto] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [prioridade, setPrioridade] = useState('MEDIA');
  const [activoId, setActivoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');
  const [sugestao, setSugestao] = useState<any>(null);
  const [prioridadeManual, setPrioridadeManual] = useState(false);

  // Triagem automática: sugere prioridade e categoria a partir do texto escrito
  useEffect(() => {
    if (assunto.trim().length < 8) { setSugestao(null); return; }
    const t = setTimeout(async () => {
      try {
        const s = await api('/pedidos/triagem', { method: 'POST', body: JSON.stringify({ assunto, descricao }) });
        setSugestao(s);
        if (!prioridadeManual) { setPrioridade(s.prioridade); setCategoria(s.categoria); }
      } catch { /* a triagem é auxiliar: se falhar, o utilizador escolhe */ }
    }, 600);
    return () => clearTimeout(t);
  }, [assunto, descricao, prioridadeManual]);

  async function submeter() {
    if (!assunto.trim()) { setErro('Indique o assunto do pedido.'); return; }
    try {
      await api('/pedidos', { method: 'POST', body: JSON.stringify({ assunto, categoria, prioridade, activoId: activoId || undefined, descricao }) });
      feito();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <Modal titulo="Abrir pedido técnico online" fechar={fechar} rodape={
      <><button className="btn-contorno" onClick={fechar}>Cancelar</button><button className="btn-primario" onClick={submeter}>Submeter pedido</button></>
    }>
      <div className="grid sm:grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="campo-rotulo">Requerente</label>
          <input className="campo-input bg-[#FDFBF3] border-douradoClaro" value={`${user?.nome} — ${user?.departamento ?? ''}`} disabled />
          <p className="text-[11px] text-dourado mt-1">✓ Once-Only: preenchido pelo sistema</p>
        </div>
        <div>
          <label className="campo-rotulo">Localização</label>
          <input className="campo-input bg-[#FDFBF3] border-douradoClaro" value={user?.localizacao ?? user?.departamento ?? '—'} disabled />
          <p className="text-[11px] text-dourado mt-1">✓ Once-Only: preenchido pelo sistema</p>
        </div>
      </div>
      <div className="mb-3.5">
        <label className="campo-rotulo">Assunto do pedido</label>
        <input className="campo-input" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex.: Computador da Secretaria está lento" />
        {sugestao && (
          <p className="text-[11.5px] text-dourado mt-1.5 bg-[#FDFBF3] border border-douradoClaro rounded-lg p-2">
            🤖 <b>Triagem automática:</b> {PRIORIDADE[sugestao.prioridade].rotulo} · {sugestao.categoria} — {sugestao.justificacao}.
            Pode alterar se discordar.
          </p>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="campo-rotulo">Categoria</label>
          <select className="campo-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="campo-rotulo">Prioridade</label>
          <select className="campo-input" value={prioridade} onChange={(e) => { setPrioridade(e.target.value); setPrioridadeManual(true); }}>
            <option value="BAIXA">Baixa (SLA 72h)</option><option value="MEDIA">Média (SLA 24h)</option>
            <option value="ALTA">Alta (SLA 8h)</option><option value="CRITICA">Crítica (SLA 4h)</option>
          </select>
        </div>
      </div>
      {activos.length > 0 && (
        <div className="mb-3.5">
          <label className="campo-rotulo">Equipamento associado (opcional)</label>
          <select className="campo-input" value={activoId} onChange={(e) => setActivoId(e.target.value)}>
            <option value="">— Nenhum / não sei —</option>
            {user?.perfil === 'FUNCIONARIO' ? (
              <optgroup label="Os seus equipamentos">
                {activos.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.numInventario} · {a.categoria} {a.marca}</option>
                ))}
              </optgroup>
            ) : (
              activos.filter((a: any) => a.estado !== 'ABATIDO').map((a: any) => (
                <option key={a.id} value={a.id}>{a.numInventario} · {a.categoria} · {a.localizacao}</option>
              ))
            )}
          </select>
          {user?.perfil === 'FUNCIONARIO' && (
            <p className="text-[11px] text-dourado mt-1">✓ Once-Only: o sistema já sabe que equipamentos lhe estão atribuídos</p>
          )}
        </div>
      )}
      <div>
        <label className="campo-rotulo">Descrição do problema</label>
        <textarea className="campo-input min-h-[80px]" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o que acontece e se afecta o atendimento ao público." />
      </div>
      {erro && <p className="text-vermelho text-sm mt-2">{erro}</p>}
    </Modal>
  );
}

function DetalhePedido({ pedido, podeGerir, fechar, feito }: any) {
  const [estado, setEstado] = useState(pedido.estado);
  const [nota, setNota] = useState('');
  const [interno, setInterno] = useState(false);
  const [erro, setErro] = useState('');

  async function guardar() {
    try {
      await api(`/pedidos/${pedido.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, nota: nota || undefined, interno }) });
      feito();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <Modal titulo={`#${pedido.numero}`} fechar={fechar} rodape={
      <><button className="btn-contorno" onClick={fechar}>Fechar janela</button>{podeGerir && <button className="btn-secundario" onClick={guardar}>Guardar actualização</button>}</>
    }>
      <h3 className="text-[17px] font-semibold mb-3">{pedido.assunto}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px] mb-4">
        <Info rotulo="Categoria" valor={pedido.categoria} />
        <Info rotulo="Prioridade / SLA" valor={`${PRIORIDADE[pedido.prioridade].rotulo} · ${pedido.slaHoras}h`} />
        <Info rotulo="Estado" valor={ESTADO_PEDIDO[pedido.estado].rotulo} />
        <Info rotulo="Autor" valor={pedido.autor?.nome} />
        <Info rotulo="Técnico" valor={pedido.tecnico?.nome ?? '—'} />
        {pedido.activo && <Info rotulo="Equipamento" valor={pedido.activo.numInventario} mono />}
      </div>
      {pedido.descricao && <p className="text-[13px] mb-4 bg-papel rounded-lg p-3">{pedido.descricao}</p>}

      {podeGerir && (
        <div className="space-y-3 mb-4 border border-linha rounded-xl p-3.5">
          <div>
            <label className="campo-rotulo">Actualizar estado</label>
            <select className="campo-input" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {Object.keys(ESTADO_PEDIDO).map((e) => <option key={e} value={e}>{ESTADO_PEDIDO[e].rotulo}</option>)}
            </select>
          </div>
          <div>
            <label className="campo-rotulo">Nota da intervenção</label>
            <input className="campo-input" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: Disco substituído e sistema reinstalado" />
            <label className="flex items-center gap-2 mt-2 text-[12.5px] text-cinza">
              <input type="checkbox" checked={interno} onChange={(e) => setInterno(e.target.checked)} />
              Nota interna (visível apenas a técnicos)
            </label>
          </div>
        </div>
      )}

      <p className="text-[13px] font-bold uppercase tracking-wide text-cinza mb-2">Cronologia</p>
      <div className="relative pl-5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-linha">
        {pedido.eventos.map((e: any) => (
          <div key={e.id} className="relative pb-3.5 before:absolute before:-left-[15px] before:top-1 before:w-2.5 before:h-2.5 before:rounded-full before:bg-dourado before:ring-1 before:ring-linha">
            <p className="font-mono text-[11px] text-cinza">{fmtDataHora(e.criadoEm)}{e.interno && ' · nota interna'}</p>
            <p className="text-[13px] font-medium">{e.descricao}</p>
          </div>
        ))}
      </div>
      {erro && <p className="text-vermelho text-sm mt-2">{erro}</p>}
    </Modal>
  );
}

function Info({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wide text-cinza font-semibold">{rotulo}</p>
      <p className={`font-medium ${mono ? 'font-mono text-xs' : ''}`}>{valor}</p>
    </div>
  );
}

function Modal({ titulo, children, rodape, fechar }: any) {
  return (
    <div className="fixed inset-0 bg-preto/55 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
        <div className="flex items-center px-5 py-4 border-b border-linha">
          <h3 className="font-bold flex-1 font-mono text-vermelho">{titulo}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="p-5">{children}</div>
        <div className="px-5 py-4 border-t border-linha flex justify-end gap-2.5 flex-wrap">{rodape}</div>
      </div>
    </div>
  );
}


/** Indicador do estado de SLA de um pedido */
function EstadoSla({ sla, horas }: { sla: any; horas: number }) {
  if (!sla) return <span className="font-mono text-[11px] text-cinza">{horas}h</span>;
  if (sla.concluido) {
    return sla.violado
      ? <span className="pill bg-vermelho/10 text-vermelho">SLA excedido</span>
      : <span className="pill bg-verde/10 text-verde">SLA cumprido</span>;
  }
  if (sla.violado) return <span className="pill bg-vermelho text-white">SLA excedido</span>;
  if (sla.emRisco) return <span className="pill bg-ambar/10 text-ambar">Faltam {sla.horasRestantes}h</span>;
  return <span className="font-mono text-[11px] text-cinza">Faltam {sla.horasRestantes}h de {horas}h</span>;
}

/** Avaliação de satisfação pelo requerente */
function ModalAvaliacao({ pedido, fechar, feito }: any) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function enviar() {
    if (nota < 1) { setErro('Seleccione uma classificação de 1 a 5.'); return; }
    setAGuardar(true);
    try {
      await api(`/pedidos/${pedido.id}/avaliacao`, { method: 'POST', body: JSON.stringify({ nota, comentario }) });
      feito();
    } catch (e: any) { setErro(e.message); } finally { setAGuardar(false); }
  }

  return (
    <Modal titulo={`Avaliar o atendimento — #${pedido.numero}`} fechar={fechar} rodape={
      <>
        <button className="btn-contorno" onClick={fechar}>Agora não</button>
        <button className="btn-primario" onClick={enviar} disabled={aGuardar}>{aGuardar ? 'A enviar…' : 'Enviar avaliação'}</button>
      </>
    }>
      <p className="text-[13px] mb-4">Como classifica a resolução de <b>{pedido.assunto}</b>?</p>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setNota(n)}
            className={`w-12 h-12 rounded-xl border text-xl transition ${nota >= n ? 'bg-dourado text-white border-dourado' : 'border-linha hover:border-dourado'}`}>
            ★
          </button>
        ))}
        <span className="self-center text-[13px] text-cinza ml-2">
          {nota === 0 ? '' : ['Muito insatisfeito', 'Insatisfeito', 'Razoável', 'Satisfeito', 'Muito satisfeito'][nota - 1]}
        </span>
      </div>
      <label className="campo-rotulo">Comentário (opcional)</label>
      <textarea className="campo-input min-h-[70px]" value={comentario} onChange={(e) => setComentario(e.target.value)}
        placeholder="O que correu bem ou o que poderia melhorar?" />
      <p className="text-[11.5px] text-cinza mt-2">A avaliação alimenta o painel público de indicadores do serviço.</p>
      {erro && <p className="text-vermelho text-sm mt-2">{erro}</p>}
    </Modal>
  );
}

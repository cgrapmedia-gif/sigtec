'use client';
import { useCallback, useEffect, useState } from 'react';
import { API_BASE, api, getToken, getUser } from '@/lib/api';
import { fmtData } from '@/lib/formato';

const ESTADO_PROPOSTA: Record<string, { rotulo: string; classe: string }> = {
  COM_PARECER: { rotulo: 'Com parecer técnico', classe: 'bg-azul/10 text-azul' },
  AGUARDA_APROVACAO: { rotulo: 'Aguarda aprovação', classe: 'bg-ambar/10 text-ambar' },
  APROVADA: { rotulo: 'Aprovada — abatido', classe: 'bg-verde/10 text-verde' },
  REJEITADA: { rotulo: 'Rejeitada', classe: 'bg-vermelho/10 text-vermelho' },
};

export default function AbatePage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [autos, setAutos] = useState<any[]>([]);
  const [proposta, setProposta] = useState<any>(null); // activo seleccionado para iniciar processo
  const [aRejeitar, setARejeitar] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => {
    Promise.all([api('/activos/candidatos-abate'), api('/abate/propostas'), api('/abate/autos')])
      .then(([c, p, a]) => { setCandidatos(c); setPropostas(p); setAutos(a); })
      .catch((e) => setMsg(e.message));
  }, []);
  useEffect(carregar, [carregar]);

  async function submeter(id: string) {
    try { await api(`/abate/propostas/${id}/submeter`, { method: 'PATCH' }); carregar(); } catch (e: any) { setMsg(e.message); }
  }
  async function aprovar(id: string) {
    try { await api(`/abate/propostas/${id}/aprovar`, { method: 'PATCH' }); carregar(); } catch (e: any) { setMsg(e.message); }
  }

  /** Abre o PDF gerado server-side (endpoint autenticado) */
  async function verPdf(autoId: string, numero: string) {
    try {
      const res = await fetch(`${API_BASE}/abate/autos/${autoId}/pdf`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Não foi possível gerar o PDF.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const janela = window.open(url, '_blank');
      if (!janela) {
        const a = document.createElement('a');
        a.href = url; a.download = `Auto-de-Abate-${numero}.pdf`; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Obsolescência &amp; Abate</h1>
      <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-dourado rounded-lg p-3.5">
        ♻ <b className="text-dourado">Análise automática:</b> um activo torna-se candidato quando cumpre <b>2 ou mais critérios</b> —
        idade acima do ciclo de vida · garantia expirada · ≥ 5 falhas em 6 meses · reparação acima de 50% do valor de substituição.
        Todo o fluxo (parecer → proposta → aprovação da Direcção → Auto de Abate em PDF) fica registado.
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <section className="cartao">
        <h2 className="text-[15px] font-bold mb-3">Candidatos a abate</h2>
        {candidatos.length === 0 ? (
          <p className="text-sm text-cinza">Sem novos candidatos — todos os obsoletos identificados já têm processo em curso.</p>
        ) : (
          <table className="w-full">
            <tbody>
              {candidatos.map((a) => (
                <tr key={a.id}>
                  <td className="td font-mono text-xs font-semibold">{a.numInventario}</td>
                  <td className="td"><span className="font-medium">{a.marca} {a.modelo}</span><span className="block text-[11px] text-cinza">{a.categoria} · {a.localizacao}</span></td>
                  <td className="td">{a.motivos.map((m: string) => <span key={m} className="pill bg-linha text-cinza mr-1 mb-1">{m}</span>)}</td>
                  <td className="td text-right">
                    {['ADMIN', 'TECNICO'].includes(user?.perfil)
                      ? <button className="btn-secundario !px-3 !py-1.5 !text-xs" onClick={() => setProposta(a)}>Iniciar processo</button>
                      : <span className="text-[11px] text-cinza">Aguarda proposta</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="cartao">
        <h2 className="text-[15px] font-bold mb-3">Processos em curso</h2>
        {propostas.filter((p) => ['COM_PARECER', 'AGUARDA_APROVACAO', 'REJEITADA'].includes(p.estado)).length === 0 && (
          <p className="text-sm text-cinza">Sem processos em curso.</p>
        )}
        {propostas.filter((p) => ['COM_PARECER', 'AGUARDA_APROVACAO', 'REJEITADA'].includes(p.estado)).map((p) => (
          <div key={p.id} className="border border-linha rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <b className="font-mono text-vermelho">{p.numero}</b>
              <span className={`pill ${ESTADO_PROPOSTA[p.estado].classe}`}>{ESTADO_PROPOSTA[p.estado].rotulo}</span>
              <span className="text-xs text-cinza">{fmtData(p.criadoEm)}</span>
            </div>
            <p className="text-[13px] mb-1"><b>Equipamentos:</b> {p.activos.map((a: any) => `${a.numInventario} (${a.marca} ${a.modelo})`).join(', ')}</p>
            <p className="text-[13px] mb-1"><b>Motivo:</b> {p.motivo}</p>
            <p className="text-[13px] mb-1"><b>Parecer:</b> {p.parecer} <span className="text-cinza">— {p.parecerPor?.nome}</span></p>
            <p className="text-[13px] mb-2.5"><b>Destino:</b> {p.destino} · <b>Sanitização:</b> {p.sanitizacao}</p>
            {p.estado === 'REJEITADA' && p.motivoRejeicao && (
              <p className="text-[13px] mb-2.5 bg-vermelho/5 border-l-4 border-vermelho rounded-lg p-3">
                <b className="text-vermelho">Fundamentação da rejeição:</b> {p.motivoRejeicao}
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              {p.estado === 'COM_PARECER' && user?.perfil === 'ADMIN' &&
                <button className="btn-secundario !px-3 !py-1.5 !text-xs" onClick={() => submeter(p.id)}>Submeter à Direcção</button>}
              {p.estado === 'AGUARDA_APROVACAO' && user?.perfil === 'DIRECCAO' && (
                <>
                  <button className="btn-dourado !px-3 !py-1.5 !text-xs" onClick={() => aprovar(p.id)}>✓ Aprovar e emitir Auto de Abate</button>
                  <button className="btn-contorno !px-3 !py-1.5 !text-xs" onClick={() => setARejeitar(p)}>✕ Rejeitar com fundamentação</button>
                </>
              )}
              {p.estado === 'AGUARDA_APROVACAO' && user?.perfil !== 'DIRECCAO' &&
                <span className="text-xs text-ambar font-semibold">⏳ Aguarda aprovação da Direcção</span>}
            </div>
          </div>
        ))}
      </section>

      <section className="cartao">
        <h2 className="text-[15px] font-bold mb-3">Autos de abate emitidos</h2>
        {autos.length === 0 ? <p className="text-sm text-cinza">Ainda não foram emitidos autos. Serão listados aqui após a primeira aprovação da Direcção.</p> : (
          <table className="w-full">
            <thead><tr><th className="th">N.º do Auto</th><th className="th">Data</th><th className="th">Equipamentos</th><th className="th">Aprovado por</th><th className="th"></th></tr></thead>
            <tbody>
              {autos.map((a) => (
                <tr key={a.id}>
                  <td className="td font-mono font-bold">{a.numero}</td>
                  <td className="td font-mono text-xs">{fmtData(a.data)}</td>
                  <td className="td text-[12.5px]">{a.proposta.activos.map((x: any) => x.numInventario).join(', ')}</td>
                  <td className="td text-[12.5px]">{a.aprovadoPor.nome}</td>
                  <td className="td text-right">
                    <button className="btn-contorno !px-3 !py-1.5 !text-xs" onClick={() => verPdf(a.id, a.numero)}>📄 Abrir PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-cinza mt-3">Os equipamentos abatidos permanecem no histórico do inventário para auditoria patrimonial — nunca são eliminados.</p>
      </section>

      {proposta && <NovaProposta activo={proposta} fechar={() => setProposta(null)} feito={() => { setProposta(null); carregar(); }} />}
      {aRejeitar && <ModalRejeicao proposta={aRejeitar} fechar={() => setARejeitar(null)} feito={() => { setARejeitar(null); carregar(); }} />}
    </div>
  );
}

function NovaProposta({ activo, fechar, feito }: any) {
  const [parecer, setParecer] = useState(
    activo.custoReparacao && activo.valorSubstituicao
      ? `Reparação estimada em ${Number(activo.custoReparacao)}€ (${Math.round((Number(activo.custoReparacao) / Number(activo.valorSubstituicao)) * 100)}% do valor de substituição). Recomenda-se abate.`
      : '',
  );
  const [destino, setDestino] = useState('Reciclagem certificada (REEE)');
  const [sanitizacao, setSanitizacao] = useState(
    activo.temDisco ? 'Obrigatória — wipe certificado (DoD 5220.22-M) antes do abate' : 'Não aplicável — sem suporte de armazenamento',
  );
  const [erro, setErro] = useState('');

  async function criar() {
    if (parecer.trim().length < 10) { setErro('O parecer técnico é obrigatório (mín. 10 caracteres).'); return; }
    try {
      await api('/abate/propostas', { method: 'POST', body: JSON.stringify({ activoIds: [activo.id], parecer, destino, sanitizacao }) });
      feito();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <div className="fixed inset-0 bg-preto/55 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
        <div className="flex items-center px-5 py-4 border-b border-linha">
          <h3 className="font-bold flex-1">Iniciar processo de abate — {activo.numInventario}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="p-5">
          <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro rounded-lg p-3 mb-4">
            <b>Motivo pré-preenchido pela análise automática:</b> {activo.motivos.join(' · ')}
          </p>
          <div className="mb-3.5">
            <label className="campo-rotulo">Parecer técnico</label>
            <textarea className="campo-input min-h-[80px]" value={parecer} onChange={(e) => setParecer(e.target.value)}
              placeholder="Viabilidade de reparação, custo estimado, recomendação." />
          </div>
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="campo-rotulo">Destino proposto</label>
              <select className="campo-input" value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option>Reciclagem certificada (REEE)</option><option>Doação a instituição</option>
                <option>Armazenamento</option><option>Destruição segura</option>
              </select>
            </div>
            <div>
              <label className="campo-rotulo">Sanitização de dados</label>
              <select className="campo-input" value={sanitizacao} onChange={(e) => setSanitizacao(e.target.value)}>
                {activo.temDisco ? (
                  <>
                    <option>Obrigatória — wipe certificado (DoD 5220.22-M) antes do abate</option>
                    <option>Obrigatória — destruição física do disco</option>
                  </>
                ) : <option>Não aplicável — sem suporte de armazenamento</option>}
              </select>
            </div>
          </div>
          {erro && <p className="text-vermelho text-sm mt-2">{erro}</p>}
        </div>
        <div className="px-5 py-4 border-t border-linha flex justify-end gap-2.5">
          <button className="btn-contorno" onClick={fechar}>Cancelar</button>
          <button className="btn-primario" onClick={criar}>Registar parecer e criar proposta</button>
        </div>
      </div>
    </div>
  );
}


function ModalRejeicao({ proposta, fechar, feito }: any) {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function rejeitar() {
    if (motivo.trim().length < 10) { setErro('Indique a fundamentação (mín. 10 caracteres).'); return; }
    setAGuardar(true);
    try {
      await api(`/abate/propostas/${proposta.id}/rejeitar`, { method: 'PATCH', body: JSON.stringify({ motivo }) });
      feito();
    } catch (e: any) { setErro(e.message); } finally { setAGuardar(false); }
  }

  return (
    <div className="fixed inset-0 bg-preto/55 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl">
        <div className="flex items-center px-5 py-4 border-b border-linha">
          <h3 className="font-bold flex-1">Rejeitar a proposta {proposta.numero}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-cinza mb-3">
            A fundamentação fica registada no processo e é comunicada ao Administrador e à equipa técnica.
            Os equipamentos mantêm-se em inventário e podem ser objecto de nova proposta.
          </p>
          <label className="campo-rotulo">Fundamentação da rejeição</label>
          <textarea className="campo-input min-h-[90px]" value={motivo} onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Reavaliar a hipótese de reparação com fornecedor alternativo antes do abate." />
          {erro && <p className="text-vermelho text-sm mt-2">{erro}</p>}
        </div>
        <div className="px-5 py-4 border-t border-linha flex justify-end gap-2.5">
          <button className="btn-contorno" onClick={fechar}>Cancelar</button>
          <button className="btn-primario" onClick={rejeitar} disabled={aGuardar}>{aGuardar ? 'A registar…' : 'Rejeitar proposta'}</button>
        </div>
      </div>
    </div>
  );
}

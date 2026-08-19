'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { pode } from '@/lib/permissoes';
import { fmtData } from '@/lib/formato';

const ESTADO_CONTRATO: Record<string, { rotulo: string; classe: string }> = {
  VIGENTE: { rotulo: 'Vigente', classe: 'bg-verde/10 text-verde' },
  A_EXPIRAR: { rotulo: 'A expirar', classe: 'bg-ambar/10 text-ambar' },
  RENOVA_AUTOMATICAMENTE: { rotulo: 'Renova automaticamente', classe: 'bg-vermelho/10 text-vermelho' },
  EXPIRADO: { rotulo: 'Expirado', classe: 'bg-vermelho text-white' },
  SEM_TERMO: { rotulo: 'Sem termo', classe: 'bg-linha text-cinza' },
};

export default function FornecedoresPage() {
  const podeGerir = pode('fornecedores.gerir');
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [editarForn, setEditarForn] = useState<any>(null);
  const [editarCt, setEditarCt] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => {
    api('/fornecedores').then(setFornecedores).catch((e) => setMsg(e.message));
    api('/contratos').then(setContratos).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  const alertas = contratos.filter((c) => ['A_EXPIRAR', 'EXPIRADO', 'RENOVA_AUTOMATICAMENTE'].includes(c.alerta.estado));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="hidden lg:block text-xl font-bold flex-1">Fornecedores &amp; Contratos</h1>
        {podeGerir && <>
          <button className="btn-contorno" onClick={() => setEditarForn({})}>＋ Fornecedor</button>
          <button className="btn-primario flex-1 lg:flex-none" onClick={() => setEditarCt({})}>＋ Contrato</button>
        </>}
      </div>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      {alertas.length > 0 && (
        <div className="cartao bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border-douradoClaro">
          <h2 className="text-[15px] font-bold mb-2">⚠ Contratos que exigem decisão</h2>
          <div className="space-y-2">
            {alertas.map((c) => (
              <p key={c.id} className="text-[13px]">
                <b className="font-mono">{c.numero}</b> — {c.designacao} ({c.fornecedor.nome}):{' '}
                {c.alerta.estado === 'EXPIRADO'
                  ? <span className="text-vermelho font-semibold">expirou há {Math.abs(c.alerta.dias)} dias</span>
                  : c.renovacaoAutomatica
                    ? <span className="text-vermelho font-semibold">renova-se automaticamente dentro de {c.alerta.dias} dias — denunciar agora se não se pretender renovar</span>
                    : <span className="text-ambar font-semibold">termina dentro de {c.alerta.dias} dias</span>}
              </p>
            ))}
          </div>
        </div>
      )}

      <section className="cartao envolvente-tabela overflow-x-auto">
        <h2 className="text-[15px] font-bold mb-3">Contratos e subscrições</h2>
        <table className="w-full tabela-adaptavel lg:min-w-[760px]">
          <thead>
            <tr>
              <th className="th">N.º</th><th className="th">Designação</th><th className="th">Fornecedor</th>
              <th className="th">Vigência</th><th className="th">Valor / SLA</th><th className="th">Estado</th>
              {podeGerir && <th className="th"></th>}
            </tr>
          </thead>
          <tbody>
            {contratos.map((c) => (
              <tr key={c.id}>
                <td data-principal className="td font-mono text-xs font-semibold">{c.numero}</td>
                <td data-rotulo="Designação" className="td">
                  <span className="font-medium">{c.designacao}</span>
                  <span className="block text-[11px] text-cinza">{c.tipo}{c.numeroCliente ? ` · Cliente ${c.numeroCliente}` : ''}</span>
                </td>
                <td data-rotulo="Fornecedor" className="td text-[12.5px]">{c.fornecedor.nome}</td>
                <td data-rotulo="Vigência" className="td text-[12px]">{fmtData(c.dataInicio)}{c.dataFim ? ` → ${fmtData(c.dataFim)}` : ' → sem termo'}</td>
                <td data-rotulo="Valor / SLA" className="td text-[12px] font-mono">
                  {c.valorMensal ? `${Number(c.valorMensal).toLocaleString('pt-PT')}€/mês` : '—'}
                  {c.slaHoras ? <span className="block text-cinza">SLA {c.slaHoras}h</span> : null}
                </td>
                <td data-rotulo="Estado" className="td"><span className={`pill ${ESTADO_CONTRATO[c.alerta.estado].classe}`}>{ESTADO_CONTRATO[c.alerta.estado].rotulo}</span></td>
                {podeGerir && <td data-accoes className="td text-right"><button className="btn-contorno !min-h-0 btn-mini" onClick={() => setEditarCt(c)}>Editar</button></td>}
              </tr>
            ))}
            {contratos.length === 0 && <tr><td colSpan={7} className="td vazio">Nenhum contrato registado. Registe as ligações de internet, telefone, licenças e contratos de assistência.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="cartao envolvente-tabela overflow-x-auto">
        <h2 className="text-[15px] font-bold mb-3">Fornecedores</h2>
        <table className="w-full tabela-adaptavel lg:min-w-[680px]">
          <thead>
            <tr><th className="th">Fornecedor</th><th className="th">Contacto</th><th className="th">Apoio técnico</th><th className="th">Contratos</th><th className="th">Itens</th>{podeGerir && <th className="th"></th>}</tr>
          </thead>
          <tbody>
            {fornecedores.map((f) => (
              <tr key={f.id} className={f.activo ? '' : 'opacity-50'}>
                <td data-principal className="td"><span className="font-medium">{f.nome}</span>{f.nif && <span className="block text-[11px] text-cinza">NIF {f.nif}</span>}</td>
                <td data-rotulo="Contacto" className="td text-[12.5px]">{f.contactoNome ?? '—'}{f.telefone && <span className="block text-cinza">{f.telefone}</span>}</td>
                <td data-rotulo="Apoio técnico" className="td text-[12.5px] font-medium text-vermelho">{f.apoioTecnico ?? '—'}</td>
                <td data-rotulo="Contratos" className="td font-mono">{f.contratos.length}</td>
                <td data-rotulo="Itens" className="td font-mono">{f._count.itens}</td>
                {podeGerir && <td data-accoes className="td text-right"><button className="btn-contorno !min-h-0 btn-mini" onClick={() => setEditarForn(f)}>Editar</button></td>}
              </tr>
            ))}
            {fornecedores.length === 0 && <tr><td colSpan={6} className="td vazio">Nenhum fornecedor registado.</td></tr>}
          </tbody>
        </table>
      </section>

      {editarForn && <FormFornecedor fornecedor={editarForn} fechar={() => setEditarForn(null)} feito={() => { setEditarForn(null); carregar(); }} />}
      {editarCt && <FormContrato contrato={editarCt} fornecedores={fornecedores} fechar={() => setEditarCt(null)} feito={() => { setEditarCt(null); carregar(); }} />}
    </div>
  );
}

function FormFornecedor({ fornecedor, fechar, feito }: any) {
  const novo = !fornecedor.id;
  const [f, setF] = useState<any>({
    nome: fornecedor.nome ?? '', nif: fornecedor.nif ?? '', contactoNome: fornecedor.contactoNome ?? '',
    telefone: fornecedor.telefone ?? '', email: fornecedor.email ?? '', apoioTecnico: fornecedor.apoioTecnico ?? '',
    observacoes: fornecedor.observacoes ?? '', activo: fornecedor.activo ?? true,
  });
  const [erro, setErro] = useState('');
  const set = (c: string, v: any) => setF((s: any) => ({ ...s, [c]: v }));

  async function guardar() {
    if (!f.nome.trim()) { setErro('Indique o nome do fornecedor.'); return; }
    try {
      if (novo) await api('/fornecedores', { method: 'POST', body: JSON.stringify(f) });
      else await api(`/fornecedores/${fornecedor.id}`, { method: 'PATCH', body: JSON.stringify(f) });
      feito();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <Modal titulo={novo ? 'Novo fornecedor' : `Editar ${fornecedor.nome}`} fechar={fechar} rodape={
      <><button className="btn-contorno" onClick={fechar}>Cancelar</button><button className="btn-primario flex-1 lg:flex-none" onClick={guardar}>Guardar</button></>
    }>
      <div className="space-y-3.5">
        <div className="grid sm:grid-cols-[2fr_1fr] gap-3.5">
          <div><label className="campo-rotulo">Nome</label><input className="campo-input" value={f.nome} onChange={(e) => set('nome', e.target.value)} /></div>
          <div><label className="campo-rotulo">NIF</label><input className="campo-input" value={f.nif} onChange={(e) => set('nif', e.target.value)} /></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-3.5">
          <div><label className="campo-rotulo">Pessoa de contacto</label><input className="campo-input" value={f.contactoNome} onChange={(e) => set('contactoNome', e.target.value)} /></div>
          <div><label className="campo-rotulo">Telefone</label><input className="campo-input" value={f.telefone} onChange={(e) => set('telefone', e.target.value)} /></div>
          <div><label className="campo-rotulo">Email</label><input className="campo-input" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div>
            <label className="campo-rotulo">Linha de apoio técnico</label>
            <input className="campo-input" value={f.apoioTecnico} onChange={(e) => set('apoioTecnico', e.target.value)} placeholder="Ex.: 16990 (empresas)" />
            <p className="text-[11px] text-dourado mt-1">✓ Aparece na ficha do equipamento, para contacto imediato</p>
          </div>
        </div>
        <div><label className="campo-rotulo">Observações</label><textarea className="campo-input min-h-[60px]" value={f.observacoes} onChange={(e) => set('observacoes', e.target.value)} /></div>
        {erro && <p className="text-vermelho text-sm">{erro}</p>}
      </div>
    </Modal>
  );
}

function FormContrato({ contrato, fornecedores, fechar, feito }: any) {
  const novo = !contrato.id;
  const paraInput = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const [f, setF] = useState<any>({
    designacao: contrato.designacao ?? '', tipo: contrato.tipo ?? 'Serviço',
    fornecedorId: contrato.fornecedorId ?? '', dataInicio: paraInput(contrato.dataInicio) || new Date().toISOString().slice(0, 10),
    dataFim: paraInput(contrato.dataFim), renovacaoAutomatica: contrato.renovacaoAutomatica ?? false,
    avisoDias: contrato.avisoDias ?? 60, valorMensal: contrato.valorMensal ?? '', slaHoras: contrato.slaHoras ?? '',
    numeroCliente: contrato.numeroCliente ?? '', observacoes: contrato.observacoes ?? '', activo: contrato.activo ?? true,
  });
  const [erro, setErro] = useState('');
  const set = (c: string, v: any) => setF((s: any) => ({ ...s, [c]: v }));

  async function guardar() {
    if (!f.designacao.trim() || !f.fornecedorId) { setErro('Designação e fornecedor são obrigatórios.'); return; }
    try {
      if (novo) await api('/contratos', { method: 'POST', body: JSON.stringify(f) });
      else await api(`/contratos/${contrato.id}`, { method: 'PATCH', body: JSON.stringify(f) });
      feito();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <Modal titulo={novo ? 'Novo contrato' : `Editar ${contrato.numero}`} fechar={fechar} rodape={
      <><button className="btn-contorno" onClick={fechar}>Cancelar</button><button className="btn-primario flex-1 lg:flex-none" onClick={guardar}>Guardar</button></>
    }>
      <div className="space-y-3.5">
        <div><label className="campo-rotulo">Designação</label><input className="campo-input" value={f.designacao} onChange={(e) => set('designacao', e.target.value)} placeholder="Ex.: Ligação de Internet dedicada 500 Mbps" /></div>
        <div className="grid lg:grid-cols-2 gap-3.5">
          <div>
            <label className="campo-rotulo">Fornecedor</label>
            <select className="campo-input" value={f.fornecedorId} onChange={(e) => set('fornecedorId', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {fornecedores.map((x: any) => <option key={x.id} value={x.id}>{x.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="campo-rotulo">Tipo</label>
            <select className="campo-input" value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
              {['Telecomunicações', 'Manutenção', 'Licenciamento', 'Nuvem', 'Serviço', 'Outro'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="campo-rotulo">Início</label><input className="campo-input" type="date" value={f.dataInicio} onChange={(e) => set('dataInicio', e.target.value)} /></div>
          <div><label className="campo-rotulo">Termo</label><input className="campo-input" type="date" value={f.dataFim} onChange={(e) => set('dataFim', e.target.value)} /></div>
          <div><label className="campo-rotulo">Valor mensal (€)</label><input className="campo-input" type="number" step="0.01" value={f.valorMensal} onChange={(e) => set('valorMensal', e.target.value)} /></div>
          <div><label className="campo-rotulo">SLA de resposta (horas)</label><input className="campo-input" type="number" value={f.slaHoras} onChange={(e) => set('slaHoras', e.target.value)} /></div>
          <div><label className="campo-rotulo">N.º de cliente</label><input className="campo-input" value={f.numeroCliente} onChange={(e) => set('numeroCliente', e.target.value)} /></div>
          <div><label className="campo-rotulo">Avisar com antecedência (dias)</label><input className="campo-input" type="number" value={f.avisoDias} onChange={(e) => set('avisoDias', e.target.value)} /></div>
        </div>
        <label className="flex items-start gap-2 text-[13px] bg-papel rounded-lg p-3">
          <input type="checkbox" className="mt-0.5" checked={f.renovacaoAutomatica} onChange={(e) => set('renovacaoAutomatica', e.target.checked)} />
          <span>
            <b>Renovação automática</b> — o sistema alerta com destaque antes do prazo de denúncia.
            Um contrato que se renova sem ninguém dar por isso é dinheiro público mal gerido.
          </span>
        </label>
        <div><label className="campo-rotulo">Observações</label><textarea className="campo-input min-h-[60px]" value={f.observacoes} onChange={(e) => set('observacoes', e.target.value)} placeholder="Cláusulas relevantes, condições de denúncia…" /></div>
        {erro && <p className="text-vermelho text-sm">{erro}</p>}
      </div>
    </Modal>
  );
}

function Modal({ titulo, children, rodape, fechar }: any) {
  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa lg:max-w-2xl">
        <div className="modal-cabecalho">
          <h3 className="font-bold flex-1">{titulo}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo">{children}</div>
        <div className="modal-rodape">{rodape}</div>
      </div>
    </div>
  );
}

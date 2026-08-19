'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import { fmtData } from '@/lib/formato';

const PERFIS = [
  { valor: 'FUNCIONARIO', rotulo: 'Funcionário(a)', classe: 'bg-azul/10 text-azul' },
  { valor: 'TECNICO', rotulo: 'Técnico', classe: 'bg-verde/10 text-verde' },
  { valor: 'ADMIN', rotulo: 'Administrador', classe: 'bg-vermelho/10 text-vermelho' },
  { valor: 'DIRECCAO', rotulo: 'Direcção', classe: 'bg-dourado/10 text-dourado' },
];
const rotuloPerfil = (p: string) => PERFIS.find((x) => x.valor === p) ?? { rotulo: p, classe: 'bg-linha text-cinza' };

export default function UtilizadoresPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const podeGerir = user?.perfil === 'ADMIN';
  const [users, setUsers] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [novo, setNovo] = useState(false);
  const [credencial, setCredencial] = useState<{ nome: string; email: string; password: string } | null>(null);
  const [editarUser, setEditarUser] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => {
    api('/users').then(setUsers).catch((e) => setMsg(e.message));
    api('/departamentos').then(setDepartamentos).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  async function alternarActivo(u: any) {
    const accao = u.activo ? 'desactivar' : 'reactivar';
    if (u.activo && !confirm(`Desactivar a conta de ${u.nome}? A conta deixa de poder entrar, mas todo o histórico é preservado.`)) return;
    try { await api(`/users/${u.id}/${accao}`, { method: 'PATCH' }); carregar(); } catch (e: any) { setMsg(e.message); }
  }

  async function reporPassword(u: any) {
    if (!confirm(`Repor a palavra-passe de ${u.nome}? Será gerada uma palavra-passe temporária.`)) return;
    try {
      const r = await api(`/users/${u.id}/repor-password`, { method: 'PATCH' });
      setCredencial({ nome: u.nome, email: u.email, password: r.passwordTemporaria });
      carregar();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex-1">Utilizadores</h1>
        {podeGerir && <button className="btn-primario" onClick={() => setNovo(true)}>＋ Criar conta por convite</button>}
      </div>

      <p className="text-[13px] text-cinza">
        As contas são criadas exclusivamente por convite do Administrador. Nenhuma conta é eliminada — a desactivação
        preserva todo o histórico para efeitos de auditoria.
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <div className="cartao envolvente-tabela overflow-x-auto">
        <table className="w-full tabela-adaptavel md:min-w-[680px]">
          <thead>
            <tr>
              <th className="th">Nome</th><th className="th">Email institucional</th><th className="th">Perfil</th>
              <th className="th">Departamento</th><th className="th">Estado</th>{podeGerir && <th className="th"></th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.activo ? '' : 'opacity-55'}>
                <td data-principal className="td">
                  <span className="font-medium">{u.nome}</span>
                  <span className="block text-[11px] text-cinza">Desde {fmtData(u.criadoEm)}</span>
                </td>
                <td data-rotulo="Utilizador" className="td text-[12.5px] font-mono break-all">{u.utilizador ?? u.email.split('@')[0]}</td>
                <td data-rotulo="Perfil" className="td"><span className={`pill ${rotuloPerfil(u.perfil).classe}`}>{rotuloPerfil(u.perfil).rotulo}</span></td>
                <td data-rotulo="Departamento" className="td text-[12.5px]">{u.departamento?.nome ?? '—'}</td>
                <td data-rotulo="Estado" className="td">
                  {u.activo
                    ? <span className="pill bg-verde/10 text-verde">Activa</span>
                    : <span className="pill bg-linha text-cinza">Desactivada</span>}
                  {u.precisaTrocarPassword && u.activo && <span className="pill bg-ambar/10 text-ambar ml-1">Password temporária</span>}
                </td>
                {podeGerir && (
                  <td data-accoes className="td text-right whitespace-nowrap">
                    {u.id !== user?.id && (
                      <button className="btn-contorno !min-h-0 !px-2.5 !py-1 !text-[11px] mr-1" onClick={() => setEditarUser(u)}>Editar</button>
                    )}
                    {u.activo && u.id !== user?.id && (
                      <button className="btn-contorno !min-h-0 !px-2.5 !py-1 !text-[11px] mr-1" onClick={() => reporPassword(u)}>Repor password</button>
                    )}
                    {u.id !== user?.id && (
                      <button className="btn-contorno !min-h-0 !px-2.5 !py-1 !text-[11px]" onClick={() => alternarActivo(u)}>
                        {u.activo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} className="td text-center text-cinza py-6">Sem utilizadores registados.</td></tr>}
          </tbody>
        </table>
      </div>

      {novo && (
        <NovaConta
          departamentos={departamentos}
          fechar={() => setNovo(false)}
          feito={(c: any) => { setNovo(false); setCredencial(c); carregar(); }}
        />
      )}

      {credencial && <ModalCredencial credencial={credencial} fechar={() => setCredencial(null)} />}

      {editarUser && (
        <EditarConta
          conta={editarUser}
          departamentos={departamentos}
          fechar={() => setEditarUser(null)}
          feito={() => { setEditarUser(null); carregar(); }}
        />
      )}
    </div>
  );
}

function NovaConta({ departamentos, fechar, feito }: any) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [emailManual, setEmailManual] = useState(false);

  // Utilizador institucional gerado do nome: «Luísa Baptista» → luisa.baptista
  useEffect(() => {
    if (emailManual || nome.trim().length < 3) return;
    const t = setTimeout(async () => {
      try {
        const r = await api(`/users/sugerir-utilizador?nome=${encodeURIComponent(nome)}`);
        if (r.email) setEmail(r.email);
      } catch { /* sugestão é auxiliar */ }
    }, 400);
    return () => clearTimeout(t);
  }, [nome, emailManual]);
  const [perfil, setPerfil] = useState('FUNCIONARIO');
  const [departamentoId, setDepartamentoId] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function criar() {
    setErro('');
    if (nome.trim().length < 3) { setErro('Indique o nome completo.'); return; }
    if (!email.includes('@')) { setErro('Indique um email institucional válido.'); return; }
    setAGuardar(true);
    try {
      const r = await api('/users', {
        method: 'POST',
        body: JSON.stringify({ nome, email, perfil, departamentoId: departamentoId || undefined, localizacao: localizacao || undefined }),
      });
      feito({ nome: r.user.nome, email: r.user.email, utilizador: r.user.utilizador, password: r.passwordTemporaria });
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <Modal titulo="Criar conta por convite" fechar={fechar} rodape={
      <>
        <button className="btn-contorno" onClick={fechar}>Cancelar</button>
        <button className="btn-primario" onClick={criar} disabled={aGuardar}>{aGuardar ? 'A criar…' : 'Criar conta'}</button>
      </>
    }>
      <div className="space-y-3.5">
        <div>
          <label className="campo-rotulo">Nome completo</label>
          <input className="campo-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Fernandes" />
        </div>
        <div>
          <label className="campo-rotulo">Utilizador (gerado do nome)</label>
          <input className="campo-input font-mono" type="text" value={email.split('@')[0]}
            onChange={(e) => { setEmail(`${e.target.value}@consuladoporto.gov.ao`); setEmailManual(true); }}
            placeholder="primeiro.ultimo" />
          {!emailManual && email && (
            <p className="text-[11px] text-dourado mt-1">✓ Gerado do nome. É com este utilizador que a pessoa inicia sessão.</p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label className="campo-rotulo">Perfil de acesso</label>
            <select className="campo-input" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
              {PERFIS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
            </select>
          </div>
          <div>
            <label className="campo-rotulo">Departamento</label>
            <select className="campo-input" value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
              <option value="">— Não atribuído —</option>
              {departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="campo-rotulo">Posto de trabalho (Once-Only)</label>
          <input className="campo-input" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} placeholder="Ex.: Balcão 1 — Atendimento" />
          <p className="text-[11px] text-dourado mt-1">Preenche automaticamente os pedidos deste utilizador.</p>
        </div>
        <p className="text-[12px] text-cinza bg-papel rounded-lg p-3">
          O sistema gera uma palavra-passe temporária que lhe será mostrada uma única vez. O utilizador terá de a
          substituir obrigatoriamente no primeiro acesso.
        </p>
        {erro && <p className="text-vermelho text-sm">{erro}</p>}
      </div>
    </Modal>
  );
}

function EditarConta({ conta, departamentos, fechar, feito }: any) {
  const [nome, setNome] = useState(conta.nome);
  const [perfil, setPerfil] = useState(conta.perfil);
  const [departamentoId, setDepartamentoId] = useState(conta.departamento?.id ?? '');
  const [localizacao, setLocalizacao] = useState(conta.localizacao ?? '');
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function guardar() {
    setErro('');
    if (nome.trim().length < 3) { setErro('Indique o nome completo.'); return; }
    setAGuardar(true);
    try {
      await api(`/users/${conta.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ nome, perfil, departamentoId: departamentoId || null, localizacao: localizacao || null }),
      });
      feito();
    } catch (e: any) { setErro(e.message); } finally { setAGuardar(false); }
  }

  return (
    <Modal titulo={`Editar ${conta.nome}`} fechar={fechar} rodape={
      <>
        <button className="btn-contorno" onClick={fechar}>Cancelar</button>
        <button className="btn-primario" onClick={guardar} disabled={aGuardar}>{aGuardar ? 'A guardar…' : 'Guardar alterações'}</button>
      </>
    }>
      <div className="space-y-3.5">
        <div>
          <label className="campo-rotulo">Nome completo</label>
          <input className="campo-input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="campo-rotulo">Utilizador institucional</label>
          <input className="campo-input bg-papel font-mono" value={conta.utilizador ?? conta.email.split('@')[0]} disabled />
          <p className="text-[11px] text-cinza mt-1">O utilizador não é alterável: é a chave de todo o histórico e auditoria.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label className="campo-rotulo">Perfil de acesso</label>
            <select className="campo-input" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
              {PERFIS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
            </select>
          </div>
          <div>
            <label className="campo-rotulo">Departamento</label>
            <select className="campo-input" value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
              <option value="">— Não atribuído —</option>
              {departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="campo-rotulo">Posto de trabalho</label>
          <input className="campo-input" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} placeholder="Ex.: Balcão 1 — Atendimento" />
        </div>
        {perfil !== conta.perfil && (
          <p className="text-[12.5px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro rounded-lg p-3">
            ⚠ Vai alterar o perfil de <b>{conta.perfil}</b> para <b>{perfil}</b>. O utilizador será notificado e as
            permissões mudam de imediato.
          </p>
        )}
        {erro && <p className="text-vermelho text-sm">{erro}</p>}
      </div>
    </Modal>
  );
}

function ModalCredencial({ credencial, fechar }: any) {
  const [copiado, setCopiado] = useState(false);
  const utilizador = credencial.utilizador ?? credencial.email.split('@')[0];
  const texto = `SIGTEC — Consulado Geral de Angola no Porto\nUtilizador: ${utilizador}\nPalavra-passe temporária: ${credencial.password}\n\nDeve alterar a palavra-passe no primeiro acesso.`;

  return (
    <Modal titulo="Credenciais de acesso" fechar={fechar} rodape={<button className="btn-secundario" onClick={fechar}>Concluído</button>}>
      <p className="text-[13px] mb-4">
        Entregue estas credenciais a <b>{credencial.nome}</b> por um canal seguro. Por razões de segurança,
        <b> a palavra-passe não voltará a ser mostrada</b>.
      </p>
      <div className="bg-preto text-[#EDE9E0] rounded-xl p-4 font-mono text-[13px] space-y-1.5">
        <div><span className="text-[#A79F92]">Utilizador:</span> {credencial.utilizador ?? credencial.email.split('@')[0]}</div>
        <div><span className="text-[#A79F92]">Palavra-passe:</span> <b className="text-douradoClaro">{credencial.password}</b></div>
      </div>
      <button
        className="btn-contorno mt-3"
        onClick={() => { navigator.clipboard?.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500); }}
      >
        {copiado ? '✓ Copiado' : '📋 Copiar credenciais'}
      </button>
    </Modal>
  );
}

function Modal({ titulo, children, rodape, fechar }: any) {
  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa sm:max-w-xl">
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

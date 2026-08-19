'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { pode } from '@/lib/permissoes';

export default function DepartamentosPage() {
  const podeGerir = pode('departamentos.gerir');
  const [deps, setDeps] = useState<any[]>([]);
  const [novo, setNovo] = useState('');
  const [editar, setEditar] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => { api('/departamentos').then(setDeps).catch((e) => setErro(e.message)); }, []);
  useEffect(carregar, [carregar]);

  async function criar() {
    setErro(''); setMsg('');
    if (novo.trim().length < 2) { setErro('Indique o nome do departamento.'); return; }
    try {
      await api('/departamentos', { method: 'POST', body: JSON.stringify({ nome: novo }) });
      setNovo(''); setMsg('Departamento criado.'); carregar();
    } catch (e: any) { setErro(e.message); }
  }

  async function guardarEdicao() {
    try {
      await api(`/departamentos/${editar.id}`, { method: 'PATCH', body: JSON.stringify({ nome: editar.nome }) });
      setEditar(null); carregar();
    } catch (e: any) { setErro(e.message); }
  }

  async function eliminar(d: any) {
    if (!confirm(`Eliminar o departamento «${d.nome}»?`)) return;
    setErro('');
    try { await api(`/departamentos/${d.id}`, { method: 'DELETE' }); carregar(); }
    catch (e: any) { setErro(e.message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Departamentos</h1>
      <p className="text-[13px] text-cinza">
        Os departamentos organizam utilizadores e itens de configuração, e alimentam os relatórios por serviço.
      </p>
      {erro && <p className="text-vermelho text-sm">{erro}</p>}
      {msg && <p className="text-verde text-sm font-semibold">✓ {msg}</p>}

      {podeGerir && (
        <div className="cartao">
          <label className="campo-rotulo">Novo departamento</label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input className="campo-input sm:flex-1" value={novo} onChange={(e) => setNovo(e.target.value)}
              placeholder="Ex.: Serviço de Vistos" onKeyDown={(e) => e.key === 'Enter' && criar()} />
            <button className="btn-primario sm:w-auto" onClick={criar}>＋ Criar</button>
          </div>
        </div>
      )}

      <div className="cartao envolvente-tabela overflow-x-auto">
        <table className="w-full tabela-adaptavel sm:min-w-[520px]">
          <thead>
            <tr><th className="th">Departamento</th><th className="th">Utilizadores</th><th className="th">Itens</th>{podeGerir && <th className="th"></th>}</tr>
          </thead>
          <tbody>
            {deps.map((d) => (
              <tr key={d.id}>
                <td className="td" data-principal>{d.nome}</td>
                <td className="td font-mono" data-rotulo="Utilizadores">{d.totalUsers}</td>
                <td className="td font-mono" data-rotulo="Itens">{d.totalItens}</td>
                {podeGerir && (
                  <td className="td text-right whitespace-nowrap" data-accoes>
                    <button className="btn-contorno !min-h-0 !px-2.5 !py-1 !text-[11px] mr-1" onClick={() => setEditar({ ...d })}>Renomear</button>
                    <button className="btn-contorno !min-h-0 !px-2.5 !py-1 !text-[11px]" onClick={() => eliminar(d)}>Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
            {deps.length === 0 && <tr><td colSpan={4} className="td text-center text-cinza py-6">Nenhum departamento registado.</td></tr>}
          </tbody>
        </table>
      </div>

      {editar && (
        <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && setEditar(null)}>
          <div className="modal-caixa sm:max-w-md">
            <div className="modal-cabecalho">
              <h3 className="font-bold flex-1">Renomear departamento</h3>
              <button className="text-cinza text-xl px-2" onClick={() => setEditar(null)}>✕</button>
            </div>
            <div className="modal-corpo">
              <label className="campo-rotulo">Nome</label>
              <input className="campo-input" value={editar.nome} onChange={(e) => setEditar({ ...editar, nome: e.target.value })} />
            </div>
            <div className="modal-rodape">
              <button className="btn-contorno" onClick={() => setEditar(null)}>Cancelar</button>
              <button className="btn-primario" onClick={guardarEdicao}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

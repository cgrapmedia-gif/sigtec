'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser, setSessao, getToken } from '@/lib/api';

export default function ContaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [actual, setActual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  async function guardar() {
    setErro('');
    if (nova.length < 8) { setErro('A nova palavra-passe deve ter pelo menos 8 caracteres.'); return; }
    if (nova !== confirmacao) { setErro('A confirmação não coincide com a nova palavra-passe.'); return; }
    setAGuardar(true);
    try {
      await api('/users/password', { method: 'PATCH', body: JSON.stringify({ actual, nova }) });
      // Actualiza a sessão local para levantar a obrigação de troca
      const actualizado = { ...getUser(), precisaTrocarPassword: false };
      setSessao(getToken()!, actualizado);
      setUser(actualizado);
      setSucesso(true);
      setActual(''); setNova(''); setConfirmacao('');
      setTimeout(() => router.push('/painel'), 1500);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setAGuardar(false);
    }
  }

  if (!user) return <p className="text-cinza text-sm">A carregar…</p>;

  return (
    <div className="space-y-5 max-w-xl">

      {user.precisaTrocarPassword && (
        <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-vermelho rounded-lg p-3.5">
          🔑 <b className="text-vermelho">Definição obrigatória:</b> está a usar uma palavra-passe temporária.
          Defina uma palavra-passe pessoal para continuar a utilizar o sistema.
        </p>
      )}

      <section className="cartao space-y-3">
        <h2 className="text-[15px] font-bold">Dados da conta</h2>
        <div className="grid lg:grid-cols-2 gap-3 text-[13px]">
          <div><p className="text-[10.5px] uppercase tracking-wide text-cinza font-semibold">Nome</p><p className="font-medium">{user.nome}</p></div>
          <div><p className="text-[10.5px] uppercase tracking-wide text-cinza font-semibold">Utilizador</p><p className="font-medium font-mono">{user.utilizador ?? user.email?.split('@')[0]}</p></div>
          <div><p className="text-[10.5px] uppercase tracking-wide text-cinza font-semibold">Perfil</p><p className="font-medium">{user.perfil}</p></div>
          <div><p className="text-[10.5px] uppercase tracking-wide text-cinza font-semibold">Departamento</p><p className="font-medium">{user.departamento ?? '—'}</p></div>
        </div>
        <p className="text-[11.5px] text-cinza">Para alterar nome, perfil ou departamento, contacte o Administrador do Sistema.</p>
      </section>

      <section className="cartao space-y-3.5">
        <h2 className="text-[15px] font-bold">Alterar palavra-passe</h2>
        <div>
          <label className="campo-rotulo">Palavra-passe actual</label>
          <input className="campo-input" type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
        </div>
        <div>
          <label className="campo-rotulo">Nova palavra-passe (mín. 8 caracteres)</label>
          <input className="campo-input" type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="campo-rotulo">Confirmar nova palavra-passe</label>
          <input className="campo-input" type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="new-password" />
        </div>
        {erro && <p className="text-vermelho text-sm">{erro}</p>}
        {sucesso && <p className="text-verde text-sm font-semibold">✓ Palavra-passe alterada. A redireccionar…</p>}
        <button className="btn-primario flex-1 lg:flex-none" onClick={guardar} disabled={aGuardar}>
          {aGuardar ? 'A guardar…' : 'Guardar nova palavra-passe'}
        </button>
      </section>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import { ROTULO_PERFIL } from '@/lib/permissoes';

const PERFIS = ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'];

export default function PermissoesPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [d, setD] = useState<any>(null);
  const [perfilVisto, setPerfilVisto] = useState<string>('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/auth/matriz-permissoes').then(setD).catch((e) => setErro(e.message));
    setPerfilVisto(getUser()?.perfil ?? 'FUNCIONARIO');
  }, []);

  if (erro) return <p className="text-vermelho text-sm">{erro}</p>;
  if (!d) return <p className="text-cinza text-sm">A carregar quadro de permissões…</p>;

  const grupos: Record<string, string[]> = {};
  for (const chave of Object.keys(d.matriz)) {
    const g = chave.split('.')[0];
    (grupos[g] ??= []).push(chave);
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-cinza">
        Quem pode fazer o quê. O servidor aplica esta matriz em cada pedido e a interface segue-a — nenhuma
        permissão é presumida.
      </p>

      <div className="cartao bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border-douradoClaro">
        <p className="text-[13px]">
          🔒 <b className="text-dourado">Confidencialidade dos pedidos:</b> um funcionário vê exclusivamente
          os pedidos que abriu. Não consegue listar nem aceder aos de colegas, mesmo conhecendo o endereço
          directo — o servidor recusa o acesso.
        </p>
      </div>

      {/* Telemóvel e tablet: um perfil de cada vez */}
      <div className="lg:hidden space-y-4">
        <div className="separadores">
          {PERFIS.map((p) => (
            <button key={p} onClick={() => setPerfilVisto(p)}
              className={`separador ${perfilVisto === p ? 'activo' : ''}`}>
              <span className="block text-[12.5px] font-semibold whitespace-nowrap">{ROTULO_PERFIL[p]}</span>
              <span className={`block text-[10.5px] ${perfilVisto === p ? 'text-douradoClaro' : 'text-cinza'}`}>
                {p === user?.perfil ? 'o seu perfil' : `${Object.values(d.matriz).filter((x: any) => x.includes(p)).length} acções`}
              </span>
            </button>
          ))}
        </div>

        {Object.entries(grupos).map(([grupo, chaves]) => {
          const permitidas = chaves.filter((c) => d.matriz[c].includes(perfilVisto));
          const negadas = chaves.filter((c) => !d.matriz[c].includes(perfilVisto));
          return (
            <section key={grupo} className="cartao">
              <h2 className="text-[14px] font-bold mb-2">{d.grupos[grupo] ?? grupo}</h2>
              <ul className="space-y-1.5">
                {permitidas.map((c) => (
                  <li key={c} className="flex gap-2 text-[13px]">
                    <span className="text-verde font-bold shrink-0">✓</span>
                    <span>{d.descricoes[c] ?? c}</span>
                  </li>
                ))}
                {negadas.map((c) => (
                  <li key={c} className="flex gap-2 text-[13px] text-cinza">
                    <span className="shrink-0">✕</span>
                    <span className="line-through decoration-linha">{d.descricoes[c] ?? c}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Ecrã grande: matriz completa */}
      <div className="hidden lg:block cartao overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Acção</th>
              {PERFIS.map((p) => (
                <th key={p} className={`th text-center ${p === user?.perfil ? 'text-vermelho' : ''}`}>
                  {ROTULO_PERFIL[p]}{p === user?.perfil && ' (você)'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grupos).map(([grupo, chaves]) => (
              <Grupo key={grupo} grupo={grupo} chaves={chaves} d={d} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Grupo({ grupo, chaves, d }: any) {
  return (
    <>
      <tr>
        <td colSpan={5} className="td bg-papel font-bold text-[12px] uppercase tracking-wide">
          {d.grupos[grupo] ?? grupo}
        </td>
      </tr>
      {chaves.map((chave: string) => (
        <tr key={chave}>
          <td className="td text-[12.5px]">{d.descricoes[chave] ?? chave}</td>
          {PERFIS.map((p) => (
            <td key={p} className="td text-center">
              {d.matriz[chave].includes(p)
                ? <span className="text-verde font-bold">✓</span>
                : <span className="text-linha">—</span>}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

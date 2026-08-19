'use client';
import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import { ROTULO_PERFIL } from '@/lib/permissoes';

export default function PermissoesPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [d, setD] = useState<any>(null);
  const [erro, setErro] = useState('');

  useEffect(() => { api('/auth/matriz-permissoes').then(setD).catch((e) => setErro(e.message)); }, []);

  if (erro) return <p className="text-vermelho text-sm">{erro}</p>;
  if (!d) return <p className="text-cinza text-sm">A carregar quadro de permissões…</p>;

  // Agrupa as permissões pelo prefixo da chave (pedidos.*, itens.*, …)
  const grupos: Record<string, string[]> = {};
  for (const chave of Object.keys(d.matriz)) {
    const g = chave.split('.')[0];
    (grupos[g] ??= []).push(chave);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Quadro de Permissões</h1>
      <p className="text-[13px] text-cinza">
        Quem pode fazer o quê, por perfil. Esta matriz é a fonte única de verdade: o servidor aplica-a em
        cada pedido e a interface usa-a para mostrar ou esconder acções. Nenhuma permissão é presumida.
      </p>

      <div className="cartao bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border-douradoClaro">
        <p className="text-[13px]">
          🔒 <b className="text-dourado">Confidencialidade dos pedidos:</b> um funcionário vê exclusivamente os
          pedidos que abriu. Não consegue listar nem aceder aos pedidos de colegas, mesmo conhecendo o endereço
          directo — o servidor recusa o acesso. Só Técnicos, Administradores e Direcção têm visão global.
        </p>
      </div>

      <div className="cartao envolvente-tabela overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              <th className="th">Acção</th>
              {d.perfis.map((p: string) => (
                <th key={p} className={`th text-center ${p === user?.perfil ? 'text-vermelho' : ''}`}>
                  {ROTULO_PERFIL[p]}{p === user?.perfil && ' (você)'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grupos).map(([grupo, chaves]) => (
              <>
                <tr key={grupo}>
                  <td colSpan={5} className="td bg-papel font-bold text-[12px] uppercase tracking-wide">
                    {d.grupos[grupo] ?? grupo}
                  </td>
                </tr>
                {chaves.map((chave) => (
                  <tr key={chave}>
                    <td className="td text-[12.5px]">{d.descricoes[chave] ?? chave}</td>
                    {d.perfis.map((p: string) => (
                      <td key={p} className="td text-center">
                        {d.matriz[chave].includes(p)
                          ? <span className="text-verde font-bold">✓</span>
                          : <span className="text-linha">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

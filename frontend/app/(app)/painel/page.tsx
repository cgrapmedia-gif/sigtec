'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getUser } from '@/lib/api';
import { ESTADO_PEDIDO, PRIORIDADE, fmtData } from '@/lib/formato';

export default function PainelPage() {
  const [resumo, setResumo] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [erro, setErro] = useState('');
  const user = typeof window !== 'undefined' ? getUser() : null;

  useEffect(() => {
    Promise.all([api('/dashboard'), api('/pedidos')])
      .then(([r, p]) => { setResumo(r); setPedidos(p.slice(0, 6)); })
      .catch((e) => setErro(e.message));
  }, []);

  if (erro) return <p className="text-vermelho text-sm">{erro}</p>;
  if (!resumo) return <p className="text-cinza text-sm">A carregar indicadores…</p>;

  const kpis = [
    { rotulo: 'Total de activos', valor: resumo.totalActivos, nota: `${resumo.abatidos} auto(s) de abate emitidos`, cor: '' },
    { rotulo: 'Operacionais', valor: resumo.operacionais, nota: 'Parque em serviço', cor: 'text-verde' },
    { rotulo: 'Pedidos abertos', valor: resumo.pedidosAbertos, nota: `${resumo.criticos} crítico(s)`, cor: resumo.criticos ? 'text-vermelho' : '' },
    { rotulo: 'Candidatos a abate', valor: resumo.candidatosAbate, nota: 'Análise automática', cor: 'text-ambar' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Painel Geral</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((k) => (
          <div key={k.rotulo} className="cartao">
            <p className="text-[10.5px] uppercase tracking-wider text-cinza font-semibold">{k.rotulo}</p>
            <p className={`text-3xl font-bold font-mono mt-1 ${k.cor}`}>{k.valor}</p>
            <p className="text-[11.5px] text-cinza mt-0.5">{k.nota}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-3">Últimos pedidos</h2>
          <table className="w-full">
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td className="td font-mono text-xs text-vermelho font-semibold">
                    <Link href={`/pedidos?abrir=${p.id}`} className="hover:underline">#{p.numero}</Link>
                  </td>
                  <td className="td font-medium">{p.assunto}</td>
                  <td className="td"><span className={`pill ${ESTADO_PEDIDO[p.estado].classe}`}>{ESTADO_PEDIDO[p.estado].rotulo}</span></td>
                  <td className="td"><span className={`pill ${PRIORIDADE[p.prioridade].classe}`}>{PRIORIDADE[p.prioridade].rotulo}</span></td>
                  <td className="td font-mono text-xs">{fmtData(p.criadoEm)}</td>
                </tr>
              ))}
              {pedidos.length === 0 && <tr><td className="td text-cinza">Sem pedidos registados. Abra o primeiro em «Pedidos Técnicos».</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-1 flex items-center gap-2">
            Serviços proactivos
            <span className="text-[9.5px] bg-preto text-douradoClaro px-2 py-0.5 rounded-full tracking-wider">e-ESTÓNIA</span>
          </h2>
          <p className="text-xs text-cinza mb-3">O sistema age antes do pedido.</p>
          <div className="divide-y divide-linha">
            {resumo.proactivos.map((p: any, i: number) => (
              <div key={i} className="py-2.5">
                <b className="text-[13px] block">{p.titulo}</b>
                <span className="text-xs text-cinza">{p.detalhe}</span>
                <p className="text-[11px] text-verde font-semibold mt-0.5">✓ {p.accao}</p>
              </div>
            ))}
            {resumo.proactivos.length === 0 && <p className="py-3 text-sm text-cinza">Sem acções pendentes — o parque está dentro dos parâmetros.</p>}
          </div>
        </section>
      </div>

      {user?.perfil === 'FUNCIONARIO' && (
        <div className="cartao bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border-douradoClaro">
          <p className="text-sm">👋 Olá, {user.nome.split(' ')[0]}. Precisa de ajuda técnica? <Link href="/pedidos" className="font-semibold text-vermelho hover:underline">Abra um pedido online</Link> — o sistema já conhece o seu posto e os seus equipamentos (princípio Once-Only).</p>
        </div>
      )}
    </div>
  );
}

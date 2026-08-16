'use client';
import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import { fmtDataHora } from '@/lib/formato';

export default function TransparenciaPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [acessos, setAcessos] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => { api('/auditoria').then(setAcessos).catch((e) => setMsg(e.message)); }, []);

  const funcionario = user?.perfil === 'FUNCIONARIO';

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Transparência</h1>
      <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-dourado rounded-lg p-3.5">
        ◉ <b className="text-dourado">Transparência por omissão (modelo estónio):</b> tal como o cidadão da Estónia vê quem
        consultou os seus dados no Estado, aqui cada funcionário vê quem acedeu e quem alterou os seus pedidos e registos.
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-1 flex items-center gap-2">
            {funcionario ? 'O meu Data Tracker' : 'Registo de auditoria global'}
            <span className="text-[9.5px] bg-preto text-douradoClaro px-2 py-0.5 rounded-full tracking-wider">DATA TRACKER</span>
          </h2>
          <p className="text-xs text-cinza mb-3">{funcionario ? 'Quem acedeu aos meus dados.' : 'Todas as acções registadas no sistema.'}</p>
          <table className="w-full">
            <thead><tr><th className="th">Quando</th><th className="th">Quem</th><th className="th">Acção</th></tr></thead>
            <tbody>
              {acessos.map((a) => (
                <tr key={a.id}>
                  <td className="td font-mono text-[11.5px] whitespace-nowrap">{fmtDataHora(a.quando)}</td>
                  <td className="td text-[12.5px] font-medium">{a.quemNome}<span className="block text-[10.5px] text-cinza">{a.quemPerfil}</span></td>
                  <td className="td text-[12.5px]">{a.accao}</td>
                </tr>
              ))}
              {acessos.length === 0 && <tr><td colSpan={3} className="td text-cinza py-5 text-center">Sem registos por enquanto. Cada acesso e alteração ficará listado aqui.</td></tr>}
            </tbody>
          </table>
          <p className="text-[11.5px] text-cinza mt-2.5">Registo imutável — nenhuma entrada pode ser editada ou apagada, nem pelo Administrador.</p>
        </section>

        <section className="space-y-5">
          <div className="cartao">
            <h2 className="text-[15px] font-bold mb-3">Painel público do serviço de informática</h2>
            <div className="grid grid-cols-2 gap-3">
              <Kpi rotulo="Pedidos resolvidos 2026" valor="118" cor="text-verde" />
              <Kpi rotulo="Tempo médio" valor="7,4h" />
              <Kpi rotulo="SLA cumprido" valor="92%" cor="text-verde" />
              <Kpi rotulo="Satisfação" valor="4,6/5" cor="text-azul" />
            </div>
          </div>
          <div className="cartao">
            <h2 className="text-[15px] font-bold mb-3">Digitalização do Consulado</h2>
            <table className="w-full text-[13px]">
              <tbody>
                <tr><td className="td font-medium">Pedidos digitais vs. informais</td><td className="td text-right font-mono font-bold text-verde">87%</td></tr>
                <tr><td className="td font-medium">Folhas de papel evitadas (2026)</td><td className="td text-right font-mono font-bold">1 240</td></tr>
                <tr><td className="td font-medium">Tempo administrativo poupado</td><td className="td text-right font-mono font-bold">63h/mês</td></tr>
                <tr><td className="td font-medium">Documentos nascidos digitais</td><td className="td text-right font-mono font-bold text-verde">100%</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="border border-linha rounded-xl p-3.5">
      <p className="text-[10.5px] uppercase tracking-wider text-cinza font-semibold">{rotulo}</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${cor ?? ''}`}>{valor}</p>
    </div>
  );
}

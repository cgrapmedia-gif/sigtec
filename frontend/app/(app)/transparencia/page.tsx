'use client';
import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import { fmtDataHora } from '@/lib/formato';

export default function TransparenciaPage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [acessos, setAcessos] = useState<any[]>([]);
  const [kpi, setKpi] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/auditoria').then(setAcessos).catch((e) => setMsg(e.message));
    api('/relatorios/publico').then(setKpi).catch(() => {});
  }, []);

  const funcionario = user?.perfil === 'FUNCIONARIO';

  return (
    <div className="space-y-5">
      <p className="text-[13px] bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border border-douradoClaro border-l-4 border-l-dourado rounded-lg p-3.5">
        ◉ <b className="text-dourado">Transparência por omissão (modelo estónio):</b> tal como o cidadão da Estónia vê quem
        consultou os seus dados no Estado, aqui cada funcionário vê quem acedeu e quem alterou os seus pedidos e registos.
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <section className="cartao envolvente-tabela">
          <h2 className="text-[15px] font-bold mb-1 flex items-center gap-2">
            {funcionario ? 'O meu Data Tracker' : 'Registo de auditoria global'}
            <span className="text-[9.5px] bg-preto text-douradoClaro px-2 py-0.5 rounded-full tracking-wider">DATA TRACKER</span>
          </h2>
          <p className="text-xs text-cinza mb-3">{funcionario ? 'Quem acedeu aos meus dados.' : 'Todas as acções registadas no sistema.'}</p>
          <table className="w-full tabela-adaptavel">
            <thead><tr><th className="th">Quando</th><th className="th">Quem</th><th className="th">Acção</th></tr></thead>
            <tbody>
              {acessos.map((a) => (
                <tr key={a.id}>
                  <td data-rotulo="Quando" className="td font-mono text-[11.5px] whitespace-nowrap">{fmtDataHora(a.quando)}</td>
                  <td data-rotulo="Quem" className="td text-[12.5px] font-medium">{a.quemNome}<span className="block text-[10.5px] text-cinza">{a.quemPerfil}</span></td>
                  <td data-rotulo="Acção" className="td text-[12.5px] block">{a.accao}</td>
                </tr>
              ))}
              {acessos.length === 0 && <tr><td colSpan={3} className="td vazio">Sem registos por enquanto. Cada acesso e alteração ficará listado aqui.</td></tr>}
            </tbody>
          </table>
          <p className="text-[11.5px] text-cinza mt-2.5">Registo imutável — nenhuma entrada pode ser editada ou apagada, nem pelo Administrador.</p>
        </section>

        <section className="space-y-5">
          <div className="cartao">
            <h2 className="text-[15px] font-bold mb-3">Painel público do serviço de informática</h2>
            <div className="grid grid-cols-2 gap-3">
              <Kpi rotulo="Pedidos resolvidos este ano" valor={kpi ? String(kpi.resolvidosAno) : '…'} cor="text-verde" />
              <Kpi rotulo="Pedidos registados" valor={kpi ? String(kpi.pedidosDigitaisAno) : '…'} />
              <Kpi rotulo="Autos de abate digitais" valor={kpi ? String(kpi.autosDigitais) : '…'} cor="text-verde" />
              <Kpi rotulo="Satisfação" valor={kpi?.satisfacaoMedia ? `${kpi.satisfacaoMedia}/5` : '—'} cor="text-azul" />
            </div>
            <p className="text-[11px] text-cinza mt-3">Valores calculados em tempo real a partir dos registos do sistema.</p>
          </div>
          <div className="cartao">
            <h2 className="text-[15px] font-bold mb-3">Digitalização do Consulado</h2>
            <table className="w-full text-[13px] tabela-adaptavel">
              <tbody>
                <tr><td data-rotulo="Indicador" className="td font-medium">Processos nascidos digitais</td><td data-rotulo="Valor" className="td text-right font-mono font-bold text-verde">{kpi ? `${kpi.percentagemDigital}%` : '…'}</td></tr>
                <tr><td data-rotulo="Indicador" className="td font-medium">Folhas de papel evitadas</td><td data-rotulo="Valor" className="td text-right font-mono font-bold">{kpi ? kpi.folhasEvitadas.toLocaleString('pt-PT') : '…'}</td></tr>
                <tr><td data-rotulo="Indicador" className="td font-medium">Tempo administrativo poupado</td><td data-rotulo="Valor" className="td text-right font-mono font-bold">{kpi ? `${kpi.horasPoupadas}h` : '…'}</td></tr>
                <tr><td data-rotulo="Indicador" className="td font-medium">Registos de auditoria</td><td data-rotulo="Valor" className="td text-right font-mono font-bold">{kpi ? kpi.registosAuditoria.toLocaleString('pt-PT') : '…'}</td></tr>
              </tbody>
            </table>
            <p className="text-[11px] text-cinza mt-2">
              Estimativa conservadora: 2 folhas evitadas por processo digital, 4 por auto de abate; 12 minutos poupados por processo.
            </p>
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

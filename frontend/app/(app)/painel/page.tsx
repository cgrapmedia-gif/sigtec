'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PRIORIDADE, fmtData } from '@/lib/formato';
import AssistentePedido from '@/components/AssistentePedido';

export default function PainelPage() {
  const [d, setD] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [assistente, setAssistente] = useState(false);

  const carregar = useCallback(() => { api('/dashboard').then(setD).catch((e) => setErro(e.message)); }, []);
  useEffect(carregar, [carregar]);

  if (erro) return <p className="text-vermelho text-sm">{erro}</p>;
  if (!d) return <p className="text-cinza text-sm">A carregar o seu painel…</p>;

  return (
    <>
      {d.tipo === 'FUNCIONARIO' && <PainelFuncionario d={d} abrirAssistente={() => setAssistente(true)} />}
      {d.tipo === 'TECNICO' && <PainelTecnico d={d} />}
      {d.tipo === 'DIRECCAO' && <PainelDireccao d={d} />}
      {assistente && <AssistentePedido fechar={() => setAssistente(false)} feito={() => { setAssistente(false); carregar(); }} />}
    </>
  );
}

/* ==================== FUNCIONÁRIO ==================== */
function PainelFuncionario({ d, abrirAssistente }: any) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{d.saudacao}</h1>
        <p className="text-[13.5px] text-cinza mt-0.5">
          {d.emCurso.length === 0
            ? 'Não tem pedidos em curso. Se algo não estiver a funcionar, é só carregar no botão abaixo.'
            : `Tem ${d.emCurso.length} pedido(s) a ser tratado(s).`}
        </p>
      </div>

      <button onClick={abrirAssistente}
        className="w-full bg-vermelho text-white rounded-2xl p-5 sm:p-6 text-left hover:brightness-110 transition shadow-cartao">
        <span className="text-3xl block mb-1">🛠</span>
        <span className="text-xl font-bold block">Preciso de ajuda</span>
        <span className="text-[13px] opacity-90">
          Diga o que está a acontecer em palavras simples — o sistema trata do resto
        </span>
      </button>

      {d.porAvaliar.length > 0 && (
        <div className="cartao bg-gradient-to-br from-[#FDF9EE] to-[#F7EFD8] border-douradoClaro">
          <p className="text-[13.5px] font-semibold mb-2">⭐ Tem {d.porAvaliar.length} pedido(s) resolvido(s) por avaliar</p>
          <p className="text-[12.5px] text-cinza mb-2.5">A sua opinião ajuda a melhorar o serviço e leva menos de dez segundos.</p>
          <Link href="/pedidos" className="btn-dourado btn-mini inline-flex">Avaliar agora</Link>
        </div>
      )}

      {d.emCurso.length > 0 && (
        <section>
          <h2 className="text-[15px] font-bold mb-2.5">Os meus pedidos em curso</h2>
          <div className="space-y-2.5">
            {d.emCurso.map((p: any) => (
              <Link key={p.id} href="/pedidos" className="cartao flex gap-3 items-start hover:border-dourado transition">
                <span className="text-2xl shrink-0">{p.icone}</span>
                <span className="flex-1 min-w-0">
                  <b className="block text-[14px] leading-snug">{p.assunto}</b>
                  <span className="block text-[12.5px] text-verde font-semibold mt-1">● {p.estadoSimples}</span>
                  <span className="block text-[11.5px] text-cinza mt-0.5">
                    <span className="font-mono">#{p.numero}</span> · aberto a {fmtData(p.criadoEm)}
                    {p.tecnico && ` · com ${p.tecnico}`}
                  </span>
                </span>
                {p.prioridade === 'CRITICA' && <span className="pill bg-vermelho text-white">Urgente</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
        {d.meusItens.length > 0 && (
          <section className="cartao">
            <h2 className="text-[15px] font-bold mb-2.5">Os meus equipamentos</h2>
            <div className="space-y-1.5">
              {d.meusItens.map((a: any) => (
                <p key={a.id} className="text-[13px] flex gap-2">
                  <span className="font-mono text-[11.5px] text-cinza">{a.numInventario}</span>
                  <span className="flex-1">{a.designacao || `${a.marca} ${a.modelo}`}</span>
                </p>
              ))}
            </div>
          </section>
        )}

        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-2.5">Pode resolver sozinho</h2>
          <p className="text-[12.5px] text-cinza mb-2.5">Artigos mais consultados pelos colegas:</p>
          <div className="space-y-1.5">
            {d.artigos.map((a: any) => (
              <Link key={a.id} href="/conhecimento" className="block text-[13px] hover:text-vermelho transition">
                📖 {a.titulo}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {d.totalResolvidos > 0 && (
        <p className="text-[12.5px] text-cinza text-center">
          Já lhe resolvemos {d.totalResolvidos} pedido(s). Obrigado por registar no sistema em vez de contactar informalmente —
          é assim que o histórico ganha valor.
        </p>
      )}
    </div>
  );
}

/* ==================== TÉCNICO E ADMINISTRADOR ==================== */
function PainelTecnico({ d }: any) {
  const router = useRouter();
  const c = d.contadores;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{d.saudacao}</h1>
        <p className="text-[13.5px] text-cinza mt-0.5">
          {c.violados > 0
            ? `Atenção: ${c.violados} pedido(s) com SLA excedido.`
            : c.emRisco > 0
              ? `${c.emRisco} pedido(s) a aproximar-se do prazo.`
              : c.abertos > 0
                ? `${c.abertos} pedido(s) em aberto, todos dentro do prazo.`
                : 'Nenhum pedido em aberto. Bom momento para manutenção preventiva.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3">
        <Contador rotulo="SLA excedido" valor={c.violados} cor="text-vermelho" destaque={c.violados > 0} />
        <Contador rotulo="Prazo a terminar" valor={c.emRisco} cor="text-ambar" destaque={c.emRisco > 0} />
        <Contador rotulo="Por atribuir" valor={c.naoAtribuidos} cor="text-azul" />
        <Contador rotulo="Atribuídos a mim" valor={c.meus} />
      </div>

      <section>
        <div className="flex items-center gap-2 mb-2.5">
          <h2 className="text-[15px] font-bold flex-1">Fila de trabalho — por ordem de urgência</h2>
          <Link href="/pedidos" className="text-[12.5px] text-vermelho font-semibold hover:underline">Ver todos</Link>
        </div>
        <div className="space-y-2.5">
          {d.fila.map((p: any) => (
            <button key={p.id} onClick={() => router.push('/pedidos')}
              className={`cartao w-full text-left flex gap-3 items-start hover:border-dourado transition ${p.sla.violado ? 'border-l-4 border-l-vermelho' : p.sla.emRisco ? 'border-l-4 border-l-ambar' : ''}`}>
              <span className="text-2xl shrink-0">{p.icone}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <b className="text-[14px]">{p.assunto}</b>
                  <span className={`pill ${PRIORIDADE[p.prioridade].classe}`}>{PRIORIDADE[p.prioridade].rotulo}</span>
                  {p.meu && <span className="pill bg-verde/10 text-verde">Meu</span>}
                  {!p.tecnico && <span className="pill bg-azul/10 text-azul">Por atribuir</span>}
                </span>
                <span className="block text-[12px] text-cinza mt-1">
                  <span className="font-mono">#{p.numero}</span> · {p.autor}
                  {p.activo && <> · <span className="font-mono">{p.activo}</span></>}
                </span>
                {p.pista && (
                  <span className="block text-[12px] text-dourado mt-1.5 bg-[#FDFBF3] border border-douradoClaro rounded-lg px-2.5 py-1.5">
                    💡 {p.pista}
                  </span>
                )}
              </span>
              <span className="text-right shrink-0">
                {p.sla.violado
                  ? <span className="pill bg-vermelho text-white">Excedido</span>
                  : <span className={`font-mono text-[12px] font-semibold ${p.sla.emRisco ? 'text-ambar' : 'text-cinza'}`}>{p.sla.horasRestantes}h</span>}
              </span>
            </button>
          ))}
          {d.fila.length === 0 && (
            <p className="cartao text-sm text-cinza text-center">
              Fila vazia. Aproveite para adiantar a manutenção preventiva ou escrever um artigo na base de conhecimento.
            </p>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="cartao">
          <div className="flex items-center gap-2 mb-2.5">
            <h2 className="text-[15px] font-bold flex-1">Manutenção nos próximos 15 dias</h2>
            <Link href="/manutencao" className="text-[12px] text-vermelho font-semibold hover:underline">Ver</Link>
          </div>
          <div className="space-y-2">
            {d.manutencao.map((m: any) => (
              <p key={m.id} className="text-[13px] flex gap-2.5 items-center">
                <span className={`font-mono text-[12px] font-bold w-10 text-center rounded px-1 py-0.5 ${m.dias <= 7 ? 'bg-vermelho/10 text-vermelho' : 'bg-ambar/10 text-ambar'}`}>{m.dias}d</span>
                <span className="flex-1">{m.tarefa}</span>
              </p>
            ))}
            {d.manutencao.length === 0 && <p className="text-[13px] text-cinza">Nada agendado para os próximos 15 dias.</p>}
          </div>
        </section>

        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-1 flex items-center gap-2">
            O sistema já tratou
            <span className="text-[9.5px] bg-preto text-douradoClaro px-2 py-0.5 rounded-full tracking-wider">PROACTIVO</span>
          </h2>
          <p className="text-xs text-cinza mb-2.5">Situações detectadas antes de alguém reclamar.</p>
          <div className="divide-y divide-linha">
            {d.proactivos.map((p: any, i: number) => (
              <div key={i} className="py-2">
                <b className="text-[13px] block leading-snug">{p.titulo}</b>
                <span className="text-[12px] text-cinza">{p.detalhe}</span>
                <p className="text-[11.5px] text-verde font-semibold mt-0.5">→ {p.accao}</p>
              </div>
            ))}
            {d.proactivos.length === 0 && <p className="text-[13px] text-cinza py-2">Sem alertas. Parque dentro dos parâmetros.</p>}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Atalho href="/activos" ico="⛁" texto="Inventário" />
        <Atalho href="/abate" ico="♻" texto={`Abate${c.propostasAbate ? ` (${c.propostasAbate})` : ''}`} />
        <Atalho href="/conhecimento" ico="📖" texto="Conhecimento" />
        <Atalho href="/relatorios" ico="▤" texto="Relatórios" />
      </div>
    </div>
  );
}

/* ==================== DIRECÇÃO ==================== */
function PainelDireccao({ d }: any) {
  const i = d.indicadores;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Painel da Direcção</h1>

      {d.decisoesPendentes.length > 0 && (
        <section className="cartao border-l-4 border-l-dourado">
          <h2 className="text-[15px] font-bold mb-1">✍ Aguardam a sua decisão</h2>
          <p className="text-[12.5px] text-cinza mb-3">Propostas de abate submetidas pelo Administrador.</p>
          <div className="space-y-2.5">
            {d.decisoesPendentes.map((p: any) => (
              <div key={p.id} className="border border-linha rounded-xl p-3.5">
                <p className="text-[13.5px]"><b className="font-mono text-vermelho">{p.numero}</b> — parecer de {p.parecerPor}</p>
                <p className="text-[12.5px] text-cinza mt-1">{p.equipamentos.join(', ')}</p>
                {p.valorSubstituicao > 0 && (
                  <p className="text-[12.5px] mt-1">Substituição estimada: <b className="font-mono">{p.valorSubstituicao.toLocaleString('pt-PT')}€</b></p>
                )}
                <Link href="/abate" className="btn-dourado btn-mini inline-flex mt-2.5">Analisar e decidir</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3">
        <Contador rotulo="Pedidos abertos" valor={i.pedidosAbertos} cor={i.criticos ? 'text-vermelho' : ''} />
        <Contador rotulo="SLA cumprido" valor={`${i.slaCumprido}%`} cor={i.slaCumprido >= 90 ? 'text-verde' : 'text-ambar'} />
        <Contador rotulo="Satisfação" valor={i.satisfacao ? `${i.satisfacao}/5` : '—'} cor="text-azul" />
        <Contador rotulo="Parque activo" valor={i.totalActivos} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-2.5">Património tecnológico</h2>
          <p className="text-[13px] mb-1">Autos de abate emitidos: <b className="font-mono">{i.autosEmitidos}</b></p>
          <p className="text-[13px] mb-1">Candidatos a abate: <b className="font-mono">{i.candidatosAbate}</b></p>
          {i.investimentoProposto > 0 && (
            <p className="text-[13px]">Investimento de substituição proposto: <b className="font-mono text-vermelho">{i.investimentoProposto.toLocaleString('pt-PT')}€</b></p>
          )}
          <Link href="/relatorios" className="btn-contorno btn-mini inline-flex mt-3">Ver relatório completo</Link>
        </section>
        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-2.5">Transparência</h2>
          <p className="text-[13px] text-cinza leading-relaxed">
            Todos os acessos a dados pessoais ficam registados num livro imutável. O painel público de indicadores
            está disponível a todos os funcionários.
          </p>
          <Link href="/transparencia" className="btn-contorno btn-mini inline-flex mt-3">Abrir Data Tracker</Link>
        </section>
      </div>
    </div>
  );
}

/* ---------- Componentes comuns ---------- */
function Contador({ rotulo, valor, cor, destaque }: any) {
  return (
    <div className={`cartao ${destaque ? 'border-l-4 border-l-vermelho' : ''}`}>
      <p className="text-[10.5px] uppercase tracking-wider text-cinza font-semibold">{rotulo}</p>
      <p className={`text-3xl font-bold font-mono mt-1 ${cor ?? ''}`}>{valor}</p>
    </div>
  );
}

function Atalho({ href, ico, texto }: any) {
  return (
    <Link href={href} className="cartao text-center hover:border-dourado transition py-4">
      <span className="text-2xl block mb-1">{ico}</span>
      <span className="text-[12.5px] font-semibold">{texto}</span>
    </Link>
  );
}

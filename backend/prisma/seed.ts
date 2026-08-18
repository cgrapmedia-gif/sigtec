/**
 * SIGTEC — Seed inicial
 * Cria departamentos, utilizadores de demonstracao, inventario e dados operacionais.
 * Executar: npx prisma db seed
 */
import { PrismaClient, Perfil, EstadoActivo, EstadoPedido, Prioridade, EstadoProposta } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('sigtec2026', 10);

  // Departamentos
  const deps: Record<string, string> = {};
  for (const nome of ['Atendimento Consular', 'Secretaria', 'Informática', 'Direcção', 'Serviços Gerais']) {
    const d = await prisma.departamento.upsert({ where: { nome }, update: {}, create: { nome } });
    deps[nome] = d.id;
  }

  // Utilizadores
  const mk = (email: string, nome: string, perfil: Perfil, dep: string, loc?: string) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, nome, perfil, passwordHash: hash, departamentoId: deps[dep], localizacao: loc },
    });

  const admin = await mk('c.miranda@consuladoporto.gov.ao', 'Carlos Miranda', Perfil.ADMIN, 'Informática');
  const tecnico = await mk('r.sousa@consuladoporto.gov.ao', 'Rui Sousa', Perfil.TECNICO, 'Informática');
  const func = await mk('l.baptista@consuladoporto.gov.ao', 'Luísa Baptista', Perfil.FUNCIONARIO, 'Secretaria', 'Secretaria');
  const direccao = await mk('direccao@consuladoporto.gov.ao', 'Ana Van-Dúnem', Perfil.DIRECCAO, 'Direcção');
  await mk('m.fernandes@consuladoporto.gov.ao', 'Marta Fernandes', Perfil.FUNCIONARIO, 'Atendimento Consular', 'Balcão 1');
  await mk('j.domingos@consuladoporto.gov.ao', 'João Domingos', Perfil.FUNCIONARIO, 'Atendimento Consular', 'Balcão 3');

  // Activos
  const A = async (a: {
    num: string; cat: string; marca: string; modelo: string; serie?: string;
    aq: string; gar?: string; loc: string; dep: string; respId?: string;
    estado?: EstadoActivo; falhas?: number; disco?: boolean; custoRep?: number; valorSubst?: number;
  }) =>
    prisma.activo.upsert({
      where: { numInventario: a.num },
      update: {},
      create: {
        numInventario: a.num, categoria: a.cat, marca: a.marca, modelo: a.modelo, numSerie: a.serie,
        dataAquisicao: new Date(a.aq), fimGarantia: a.gar ? new Date(a.gar) : null,
        localizacao: a.loc, departamentoId: deps[a.dep], responsavelId: a.respId,
        estado: a.estado ?? EstadoActivo.OPERACIONAL, falhas6m: a.falhas ?? 0,
        temDisco: a.disco ?? false, custoReparacao: a.custoRep, valorSubstituicao: a.valorSubst,
      },
    });

  const a3 = await A({ num: 'CGA-INF-0003', cat: 'Computador', marca: 'Dell', modelo: 'OptiPlex 3080', serie: '7YHKQ93', aq: '2020-11-02', gar: '2023-11-02', loc: 'Balcão 3 — Atendimento', dep: 'Atendimento Consular', estado: EstadoActivo.AVARIADO, falhas: 8, disco: true, custoRep: 340, valorSubst: 620 });
  const a8 = await A({ num: 'CGA-INF-0008', cat: 'Impressora', marca: 'HP', modelo: 'LaserJet Pro M404dn', serie: 'PHBNK07731', aq: '2019-05-30', gar: '2022-05-30', loc: 'Secretaria', dep: 'Secretaria', respId: func.id, estado: EstadoActivo.OBSOLETO, falhas: 6, custoRep: 210, valorSubst: 380 });
  await A({ num: 'CGA-INF-0001', cat: 'Computador', marca: 'HP', modelo: 'ProDesk 400 G7', serie: 'CZC1234XKL', aq: '2022-03-14', gar: '2025-03-14', loc: 'Balcão 1 — Atendimento', dep: 'Atendimento Consular', falhas: 1, disco: true });
  await A({ num: 'CGA-INF-0002', cat: 'Computador', marca: 'HP', modelo: 'ProDesk 400 G7', serie: 'CZC1234XKM', aq: '2022-03-14', gar: '2025-03-14', loc: 'Balcão 2 — Atendimento', dep: 'Atendimento Consular', disco: true });
  const a4 = await A({ num: 'CGA-INF-0004', cat: 'Computador', marca: 'Lenovo', modelo: 'ThinkCentre M70q', serie: 'PF3XW22B', aq: '2023-06-20', gar: '2026-06-20', loc: 'Secretaria', dep: 'Secretaria', respId: func.id, disco: true });
  await A({ num: 'CGA-INF-0005', cat: 'Leitor biométrico', marca: 'Dermalog', modelo: 'ZF1', serie: 'DL-88412', aq: '2021-09-10', gar: '2024-09-10', loc: 'Balcão 1 — Atendimento', dep: 'Atendimento Consular', falhas: 2 });
  const a6 = await A({ num: 'CGA-INF-0006', cat: 'Leitor biométrico', marca: 'Dermalog', modelo: 'ZF1', serie: 'DL-88413', aq: '2021-09-10', gar: '2024-09-10', loc: 'Balcão 2 — Atendimento', dep: 'Atendimento Consular', estado: EstadoActivo.EM_MANUTENCAO, falhas: 5 });
  const a7 = await A({ num: 'CGA-INF-0007', cat: 'Impressora', marca: 'Kyocera', modelo: 'ECOSYS M3145dn', serie: 'VLK9202417', aq: '2022-01-18', gar: '2025-01-18', loc: 'Sala comum — 1.º andar', dep: 'Serviços Gerais', falhas: 3 });
  const a9 = await A({ num: 'CGA-INF-0009', cat: 'Servidor', marca: 'Dell', modelo: 'PowerEdge T350', serie: 'JW2JQ04', aq: '2023-02-08', gar: '2028-02-08', loc: 'Sala técnica', dep: 'Informática', disco: true });
  await A({ num: 'CGA-INF-0010', cat: 'Switch', marca: 'Cisco', modelo: 'SG300-52P', serie: 'DNI163504K2', aq: '2018-07-12', gar: '2021-07-12', loc: 'Sala técnica', dep: 'Informática', falhas: 1 });
  const a11 = await A({ num: 'CGA-INF-0011', cat: 'UPS', marca: 'APC', modelo: 'Smart-UPS 1500VA', serie: 'AS1927110342', aq: '2021-04-22', gar: '2024-04-22', loc: 'Sala técnica', dep: 'Informática', estado: EstadoActivo.EM_MANUTENCAO, falhas: 2 });
  await A({ num: 'CGA-INF-0012', cat: 'Telefone IP', marca: 'Yealink', modelo: 'T33G', serie: 'YL2024887701', aq: '2024-02-15', gar: '2027-02-15', loc: 'Gabinete do Cônsul-Geral', dep: 'Direcção' });
  await A({ num: 'CGA-INF-0013', cat: 'Scanner', marca: 'Fujitsu', modelo: 'fi-7160', serie: 'A3C0019442', aq: '2022-10-05', gar: '2025-10-05', loc: 'Arquivo', dep: 'Secretaria', respId: func.id, falhas: 1 });
  await A({ num: 'CGA-INF-0014', cat: 'Router', marca: 'Cisco Meraki', modelo: 'MX84', serie: 'Q2QN-9J8L-JKMV', aq: '2020-03-01', gar: '2027-03-01', loc: 'Sala técnica', dep: 'Informática' });

  // Historico tecnico
  await prisma.eventoActivo.createMany({
    data: [
      { activoId: a3.id, data: new Date('2026-07-29'), descricao: 'Bloqueios sucessivos — disco com sectores danificados', autor: 'Téc. Carlos Miranda', tipo: 'avaria' },
      { activoId: a3.id, data: new Date('2026-06-11'), descricao: 'Formatação e reinstalação do sistema operativo', autor: 'Téc. Rui Sousa', tipo: 'intervencao' },
      { activoId: a8.id, data: new Date('2026-07-15'), descricao: 'Encravamento recorrente do fusor — reparação 210€ (55% do valor de substituição)', autor: 'Téc. Rui Sousa', tipo: 'avaria' },
    ],
    skipDuplicates: true,
  });

  // Pedidos
  const existente = await prisma.pedido.count();
  if (existente === 0) {
    const P = (n: string, dados: any) => prisma.pedido.create({ data: { numero: n, ...dados } });
    const p1 = await P('INC-2026-00131', { assunto: 'Computador do balcão 3 não arranca', categoria: 'Hardware', prioridade: Prioridade.CRITICA, estado: EstadoPedido.EM_RESOLUCAO, slaHoras: 4, autorId: (await prisma.user.findUniqueOrThrow({ where: { email: 'j.domingos@consuladoporto.gov.ao' } })).id, tecnicoId: admin.id, activoId: a3.id, criadoEm: new Date('2026-08-05T09:12:00') });
    await prisma.eventoPedido.createMany({ data: [
      { pedidoId: p1.id, descricao: 'Pedido aberto pelo funcionário', criadoEm: new Date('2026-08-05T09:12:00') },
      { pedidoId: p1.id, descricao: 'Diagnóstico: disco danificado. Aguardando SSD de substituição', autorId: admin.id, criadoEm: new Date('2026-08-05T11:05:00') },
    ]});
    const p2 = await P('INC-2026-00130', { assunto: 'Leitor biométrico do balcão 2 falha na recolha de impressões', categoria: 'Sistema biométrico', prioridade: Prioridade.ALTA, estado: EstadoPedido.AGUARDA_MATERIAL, slaHoras: 8, autorId: (await prisma.user.findUniqueOrThrow({ where: { email: 'm.fernandes@consuladoporto.gov.ao' } })).id, tecnicoId: tecnico.id, activoId: a6.id, criadoEm: new Date('2026-08-04T10:22:00') });
    await prisma.eventoPedido.create({ data: { pedidoId: p2.id, descricao: 'Equipamento enviado para manutenção externa', autorId: tecnico.id } });
    const p3 = await P('INC-2026-00129', { assunto: 'Impressora da sala comum com manchas na impressão', categoria: 'Impressão', prioridade: Prioridade.MEDIA, estado: EstadoPedido.EM_ANALISE, slaHoras: 24, autorId: func.id, tecnicoId: admin.id, activoId: a7.id, criadoEm: new Date('2026-08-03T15:30:00') });
    await prisma.eventoPedido.create({ data: { pedidoId: p3.id, descricao: 'Técnico agendou verificação do tambor', autorId: admin.id } });
    await P('INC-2026-00128', { assunto: 'Sem acesso à pasta partilhada da Secretaria', categoria: 'Rede', prioridade: Prioridade.ALTA, estado: EstadoPedido.RESOLVIDO, slaHoras: 8, autorId: func.id, tecnicoId: tecnico.id, criadoEm: new Date('2026-08-03T09:05:00'), fechadoEm: new Date('2026-08-03T09:50:00') });
  }

  // Ordens de manutencao preventiva
  if ((await prisma.ordemManutencao.count()) === 0) {
    await prisma.ordemManutencao.createMany({ data: [
      { tarefa: 'Backup completo e teste de restauro', categoria: 'Servidor', dataPrevista: new Date('2026-08-09'), activoId: a9.id },
      { tarefa: 'Substituição de baterias da UPS', categoria: 'UPS', dataPrevista: new Date('2026-08-14'), activoId: a11.id },
      { tarefa: 'Manutenção preventiva e consumíveis', categoria: 'Impressora', dataPrevista: new Date('2026-09-02'), activoId: a7.id },
    ]});
  }

  // Proposta de abate pendente (impressora obsoleta)
  if ((await prisma.propostaAbate.count()) === 0) {
    await prisma.propostaAbate.create({ data: {
      numero: 'PA-2026-002',
      motivo: 'Obsolescência: 7,2 anos de serviço (ciclo: 6), garantia expirada, 6 falhas em 6 meses. Reparação (210€) superior a 50% do valor de substituição (380€).',
      parecer: 'Reparação economicamente inviável. Recomenda-se abate e substituição.',
      parecerPorId: tecnico.id,
      destino: 'Reciclagem certificada (REEE)',
      sanitizacao: 'Não aplicável — sem suporte de armazenamento de dados',
      estado: EstadoProposta.AGUARDA_APROVACAO,
      activos: { connect: { id: a8.id } },
    }});
  }

  // Base de conhecimento inicial
  if ((await prisma.artigoConhecimento.count()) === 0) {
    await prisma.artigoConhecimento.createMany({
      data: [
        {
          titulo: 'Impressora encrava papel com frequência',
          categoria: 'Impressão',
          palavrasChave: 'encravamento, papel, jam, fusor, rolos',
          autorId: tecnico.id,
          corpo: '1. Desligue a impressora e aguarde 5 minutos.\n2. Abra as tampas traseira e frontal e retire o papel encravado puxando sempre no sentido do percurso do papel, nunca ao contrário.\n3. Verifique se o papel está húmido ou empenado — no Porto, a humidade é causa frequente. Guarde as resmas fechadas e fora do chão.\n4. Limpe os rolos de alimentação com um pano ligeiramente humedecido em álcool isopropílico.\n5. Se o encravamento persistir mais de três vezes por semana, abra pedido: pode ser desgaste do fusor, que é critério de análise de obsolescência.',
        },
        {
          titulo: 'Leitor biométrico não recolhe impressões digitais',
          categoria: 'Sistema biométrico',
          palavrasChave: 'dermalog, biométrico, impressão digital, sensor, visto',
          autorId: tecnico.id,
          corpo: '1. Limpe o sensor com pano de microfibra seco — nunca use álcool directamente sobre o vidro.\n2. Peça ao utente para limpar e secar os dedos; dedos muito secos podem ser humedecidos ligeiramente.\n3. Confirme que o cabo USB está ligado directamente ao computador e não a um hub.\n4. Reinicie o serviço do leitor e, se necessário, o computador.\n5. Se o problema persistir num único posto, troque o leitor com outro balcão para isolar se a falha é do equipamento ou do posto — e registe no pedido qual foi o resultado.',
        },
        {
          titulo: 'Sem acesso à pasta partilhada da rede',
          categoria: 'Rede',
          palavrasChave: 'pasta partilhada, rede, permissões, unidade, servidor',
          autorId: admin.id,
          corpo: '1. Verifique se outros colegas do mesmo departamento têm acesso — se ninguém tiver, é falha do servidor.\n2. Confirme se a unidade de rede aparece no Explorador de Ficheiros; se estiver com cruz vermelha, faça duplo clique para reconectar.\n3. Termine sessão e volte a entrar no computador: as permissões são aplicadas no início de sessão.\n4. Se continuar sem acesso, abra pedido indicando o nome exacto da pasta e a mensagem de erro apresentada.',
        },
        {
          titulo: 'Procedimento de abate de equipamento obsoleto',
          categoria: 'Procedimentos',
          palavrasChave: 'abate, obsolescência, auto, REEE, sanitização, direcção',
          autorId: admin.id,
          corpo: 'O abate segue quatro fases obrigatórias no SIGTEC:\n\n1. IDENTIFICAÇÃO — o sistema assinala automaticamente como candidato qualquer equipamento que cumpra 2 ou mais critérios: idade acima do ciclo de vida da categoria, garantia expirada, cinco ou mais falhas em seis meses, ou custo de reparação superior a 50% do valor de substituição.\n\n2. PARECER TÉCNICO — o técnico avalia a viabilidade de reparação, define o destino (reciclagem certificada REEE, doação ou destruição segura) e indica o procedimento de sanitização de dados quando o equipamento tem suporte de armazenamento.\n\n3. SUBMISSÃO — o Administrador submete a proposta à Direcção.\n\n4. DECISÃO — a Direcção aprova, e o sistema emite o Auto de Abate numerado em PDF; ou rejeita com fundamentação, ficando o equipamento em inventário.\n\nNota: equipamentos abatidos nunca são eliminados do sistema — passam ao estado ABATIDO e permanecem para auditoria patrimonial.',
        },
        {
          titulo: 'Computador lento no arranque',
          categoria: 'Hardware',
          palavrasChave: 'lento, arranque, disco, memória, SSD',
          autorId: tecnico.id,
          corpo: '1. Verifique quantos programas arrancam com o sistema (Gestor de Tarefas → separador Arranque) e desactive os desnecessários.\n2. Confirme o espaço livre no disco: abaixo de 15% da capacidade, o desempenho degrada-se muito.\n3. Verifique a saúde do disco. Discos mecânicos com mais de 5 anos são a causa mais frequente e a substituição por SSD resolve na maioria dos casos.\n4. Se o equipamento tiver mais de 5 anos (ciclo de vida dos computadores), registe as falhas no SIGTEC: a acumulação alimenta a análise de obsolescência e justifica a substituição perante a Direcção.',
        },
      ],
    });
  }

  console.log('Seed concluído. Contas (password: sigtec2026):');
  console.log('  Admin:       c.miranda@consuladoporto.gov.ao');
  console.log('  Técnico:     r.sousa@consuladoporto.gov.ao');
  console.log('  Funcionária: l.baptista@consuladoporto.gov.ao');
  console.log('  Direcção:    direccao@consuladoporto.gov.ao');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

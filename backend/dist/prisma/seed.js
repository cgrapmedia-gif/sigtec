"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const hash = await bcrypt.hash('sigtec2026', 10);
    const deps = {};
    for (const nome of ['Atendimento Consular', 'Secretaria', 'Informática', 'Direcção', 'Serviços Gerais']) {
        const d = await prisma.departamento.upsert({ where: { nome }, update: {}, create: { nome } });
        deps[nome] = d.id;
    }
    const mk = (email, nome, perfil, dep, loc) => prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, nome, perfil, passwordHash: hash, departamentoId: deps[dep], localizacao: loc },
    });
    const admin = await mk('c.miranda@consuladoporto.gov.ao', 'Carlos Miranda', client_1.Perfil.ADMIN, 'Informática');
    const tecnico = await mk('r.sousa@consuladoporto.gov.ao', 'Rui Sousa', client_1.Perfil.TECNICO, 'Informática');
    const func = await mk('l.baptista@consuladoporto.gov.ao', 'Luísa Baptista', client_1.Perfil.FUNCIONARIO, 'Secretaria', 'Secretaria');
    const direccao = await mk('direccao@consuladoporto.gov.ao', 'Ana Van-Dúnem', client_1.Perfil.DIRECCAO, 'Direcção');
    await mk('m.fernandes@consuladoporto.gov.ao', 'Marta Fernandes', client_1.Perfil.FUNCIONARIO, 'Atendimento Consular', 'Balcão 1');
    await mk('j.domingos@consuladoporto.gov.ao', 'João Domingos', client_1.Perfil.FUNCIONARIO, 'Atendimento Consular', 'Balcão 3');
    const A = async (a) => prisma.activo.upsert({
        where: { numInventario: a.num },
        update: {},
        create: {
            numInventario: a.num, categoria: a.cat, marca: a.marca, modelo: a.modelo, numSerie: a.serie,
            dataAquisicao: new Date(a.aq), fimGarantia: a.gar ? new Date(a.gar) : null,
            localizacao: a.loc, departamentoId: deps[a.dep], responsavelId: a.respId,
            estado: a.estado ?? client_1.EstadoActivo.OPERACIONAL, falhas6m: a.falhas ?? 0,
            temDisco: a.disco ?? false, custoReparacao: a.custoRep, valorSubstituicao: a.valorSubst,
        },
    });
    const a3 = await A({ num: 'CGA-INF-0003', cat: 'Computador', marca: 'Dell', modelo: 'OptiPlex 3080', serie: '7YHKQ93', aq: '2020-11-02', gar: '2023-11-02', loc: 'Balcão 3 — Atendimento', dep: 'Atendimento Consular', estado: client_1.EstadoActivo.AVARIADO, falhas: 8, disco: true, custoRep: 340, valorSubst: 620 });
    const a8 = await A({ num: 'CGA-INF-0008', cat: 'Impressora', marca: 'HP', modelo: 'LaserJet Pro M404dn', serie: 'PHBNK07731', aq: '2019-05-30', gar: '2022-05-30', loc: 'Secretaria', dep: 'Secretaria', respId: func.id, estado: client_1.EstadoActivo.OBSOLETO, falhas: 6, custoRep: 210, valorSubst: 380 });
    await A({ num: 'CGA-INF-0001', cat: 'Computador', marca: 'HP', modelo: 'ProDesk 400 G7', serie: 'CZC1234XKL', aq: '2022-03-14', gar: '2025-03-14', loc: 'Balcão 1 — Atendimento', dep: 'Atendimento Consular', falhas: 1, disco: true });
    await A({ num: 'CGA-INF-0002', cat: 'Computador', marca: 'HP', modelo: 'ProDesk 400 G7', serie: 'CZC1234XKM', aq: '2022-03-14', gar: '2025-03-14', loc: 'Balcão 2 — Atendimento', dep: 'Atendimento Consular', disco: true });
    const a4 = await A({ num: 'CGA-INF-0004', cat: 'Computador', marca: 'Lenovo', modelo: 'ThinkCentre M70q', serie: 'PF3XW22B', aq: '2023-06-20', gar: '2026-06-20', loc: 'Secretaria', dep: 'Secretaria', respId: func.id, disco: true });
    await A({ num: 'CGA-INF-0005', cat: 'Leitor biométrico', marca: 'Dermalog', modelo: 'ZF1', serie: 'DL-88412', aq: '2021-09-10', gar: '2024-09-10', loc: 'Balcão 1 — Atendimento', dep: 'Atendimento Consular', falhas: 2 });
    const a6 = await A({ num: 'CGA-INF-0006', cat: 'Leitor biométrico', marca: 'Dermalog', modelo: 'ZF1', serie: 'DL-88413', aq: '2021-09-10', gar: '2024-09-10', loc: 'Balcão 2 — Atendimento', dep: 'Atendimento Consular', estado: client_1.EstadoActivo.EM_MANUTENCAO, falhas: 5 });
    const a7 = await A({ num: 'CGA-INF-0007', cat: 'Impressora', marca: 'Kyocera', modelo: 'ECOSYS M3145dn', serie: 'VLK9202417', aq: '2022-01-18', gar: '2025-01-18', loc: 'Sala comum — 1.º andar', dep: 'Serviços Gerais', falhas: 3 });
    const a9 = await A({ num: 'CGA-INF-0009', cat: 'Servidor', marca: 'Dell', modelo: 'PowerEdge T350', serie: 'JW2JQ04', aq: '2023-02-08', gar: '2028-02-08', loc: 'Sala técnica', dep: 'Informática', disco: true });
    await A({ num: 'CGA-INF-0010', cat: 'Switch', marca: 'Cisco', modelo: 'SG300-52P', serie: 'DNI163504K2', aq: '2018-07-12', gar: '2021-07-12', loc: 'Sala técnica', dep: 'Informática', falhas: 1 });
    const a11 = await A({ num: 'CGA-INF-0011', cat: 'UPS', marca: 'APC', modelo: 'Smart-UPS 1500VA', serie: 'AS1927110342', aq: '2021-04-22', gar: '2024-04-22', loc: 'Sala técnica', dep: 'Informática', estado: client_1.EstadoActivo.EM_MANUTENCAO, falhas: 2 });
    await A({ num: 'CGA-INF-0012', cat: 'Telefone IP', marca: 'Yealink', modelo: 'T33G', serie: 'YL2024887701', aq: '2024-02-15', gar: '2027-02-15', loc: 'Gabinete do Cônsul-Geral', dep: 'Direcção' });
    await A({ num: 'CGA-INF-0013', cat: 'Scanner', marca: 'Fujitsu', modelo: 'fi-7160', serie: 'A3C0019442', aq: '2022-10-05', gar: '2025-10-05', loc: 'Arquivo', dep: 'Secretaria', respId: func.id, falhas: 1 });
    await A({ num: 'CGA-INF-0014', cat: 'Router', marca: 'Cisco Meraki', modelo: 'MX84', serie: 'Q2QN-9J8L-JKMV', aq: '2020-03-01', gar: '2027-03-01', loc: 'Sala técnica', dep: 'Informática' });
    await prisma.eventoActivo.createMany({
        data: [
            { activoId: a3.id, data: new Date('2026-07-29'), descricao: 'Bloqueios sucessivos — disco com sectores danificados', autor: 'Téc. Carlos Miranda', tipo: 'avaria' },
            { activoId: a3.id, data: new Date('2026-06-11'), descricao: 'Formatação e reinstalação do sistema operativo', autor: 'Téc. Rui Sousa', tipo: 'intervencao' },
            { activoId: a8.id, data: new Date('2026-07-15'), descricao: 'Encravamento recorrente do fusor — reparação 210€ (55% do valor de substituição)', autor: 'Téc. Rui Sousa', tipo: 'avaria' },
        ],
        skipDuplicates: true,
    });
    const existente = await prisma.pedido.count();
    if (existente === 0) {
        const P = (n, dados) => prisma.pedido.create({ data: { numero: n, ...dados } });
        const p1 = await P('INC-2026-00131', { assunto: 'Computador do balcão 3 não arranca', categoria: 'Hardware', prioridade: client_1.Prioridade.CRITICA, estado: client_1.EstadoPedido.EM_RESOLUCAO, slaHoras: 4, autorId: (await prisma.user.findUniqueOrThrow({ where: { email: 'j.domingos@consuladoporto.gov.ao' } })).id, tecnicoId: admin.id, activoId: a3.id, criadoEm: new Date('2026-08-05T09:12:00') });
        await prisma.eventoPedido.createMany({ data: [
                { pedidoId: p1.id, descricao: 'Pedido aberto pelo funcionário', criadoEm: new Date('2026-08-05T09:12:00') },
                { pedidoId: p1.id, descricao: 'Diagnóstico: disco danificado. Aguardando SSD de substituição', autorId: admin.id, criadoEm: new Date('2026-08-05T11:05:00') },
            ] });
        const p2 = await P('INC-2026-00130', { assunto: 'Leitor biométrico do balcão 2 falha na recolha de impressões', categoria: 'Sistema biométrico', prioridade: client_1.Prioridade.ALTA, estado: client_1.EstadoPedido.AGUARDA_MATERIAL, slaHoras: 8, autorId: (await prisma.user.findUniqueOrThrow({ where: { email: 'm.fernandes@consuladoporto.gov.ao' } })).id, tecnicoId: tecnico.id, activoId: a6.id, criadoEm: new Date('2026-08-04T10:22:00') });
        await prisma.eventoPedido.create({ data: { pedidoId: p2.id, descricao: 'Equipamento enviado para manutenção externa', autorId: tecnico.id } });
        const p3 = await P('INC-2026-00129', { assunto: 'Impressora da sala comum com manchas na impressão', categoria: 'Impressão', prioridade: client_1.Prioridade.MEDIA, estado: client_1.EstadoPedido.EM_ANALISE, slaHoras: 24, autorId: func.id, tecnicoId: admin.id, activoId: a7.id, criadoEm: new Date('2026-08-03T15:30:00') });
        await prisma.eventoPedido.create({ data: { pedidoId: p3.id, descricao: 'Técnico agendou verificação do tambor', autorId: admin.id } });
        await P('INC-2026-00128', { assunto: 'Sem acesso à pasta partilhada da Secretaria', categoria: 'Rede', prioridade: client_1.Prioridade.ALTA, estado: client_1.EstadoPedido.RESOLVIDO, slaHoras: 8, autorId: func.id, tecnicoId: tecnico.id, criadoEm: new Date('2026-08-03T09:05:00'), fechadoEm: new Date('2026-08-03T09:50:00') });
    }
    if ((await prisma.ordemManutencao.count()) === 0) {
        await prisma.ordemManutencao.createMany({ data: [
                { tarefa: 'Backup completo e teste de restauro', categoria: 'Servidor', dataPrevista: new Date('2026-08-09'), activoId: a9.id },
                { tarefa: 'Substituição de baterias da UPS', categoria: 'UPS', dataPrevista: new Date('2026-08-14'), activoId: a11.id },
                { tarefa: 'Manutenção preventiva e consumíveis', categoria: 'Impressora', dataPrevista: new Date('2026-09-02'), activoId: a7.id },
            ] });
    }
    if ((await prisma.propostaAbate.count()) === 0) {
        await prisma.propostaAbate.create({ data: {
                numero: 'PA-2026-002',
                motivo: 'Obsolescência: 7,2 anos de serviço (ciclo: 6), garantia expirada, 6 falhas em 6 meses. Reparação (210€) superior a 50% do valor de substituição (380€).',
                parecer: 'Reparação economicamente inviável. Recomenda-se abate e substituição.',
                parecerPorId: tecnico.id,
                destino: 'Reciclagem certificada (REEE)',
                sanitizacao: 'Não aplicável — sem suporte de armazenamento de dados',
                estado: client_1.EstadoProposta.AGUARDA_APROVACAO,
                activos: { connect: { id: a8.id } },
            } });
    }
    console.log('Seed concluído. Contas (password: sigtec2026):');
    console.log('  Admin:       c.miranda@consuladoporto.gov.ao');
    console.log('  Técnico:     r.sousa@consuladoporto.gov.ao');
    console.log('  Funcionária: l.baptista@consuladoporto.gov.ao');
    console.log('  Direcção:    direccao@consuladoporto.gov.ao');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

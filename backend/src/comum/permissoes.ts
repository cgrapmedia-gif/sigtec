/**
 * Matriz de permissões do SIGTEC.
 * Fonte única de verdade: o backend aplica-a nos guards e o frontend usa-a
 * para mostrar ou esconder acções. Nenhuma permissão é presumida no código de interface.
 */

export type Perfil = 'FUNCIONARIO' | 'TECNICO' | 'ADMIN' | 'DIRECCAO';

export const PERMISSOES = {
  // --- Pedidos ---
  'pedidos.criar': ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],
  'pedidos.ver.proprios': ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],
  'pedidos.ver.todos': ['TECNICO', 'ADMIN', 'DIRECCAO'],
  'pedidos.gerir': ['TECNICO', 'ADMIN'],
  'pedidos.notas.internas': ['TECNICO', 'ADMIN'],
  'pedidos.avaliar': ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],

  // --- Itens de configuração ---
  'itens.ver.proprios': ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],
  'itens.ver.todos': ['TECNICO', 'ADMIN', 'DIRECCAO'],
  'itens.criar': ['TECNICO', 'ADMIN'],
  'itens.editar': ['TECNICO', 'ADMIN'],
  'itens.relacoes.gerir': ['TECNICO', 'ADMIN'],

  // --- Configuração do sistema ---
  'categorias.ver': ['TECNICO', 'ADMIN', 'DIRECCAO'],
  'categorias.gerir': ['ADMIN'],
  'fornecedores.ver': ['TECNICO', 'ADMIN', 'DIRECCAO'],
  'fornecedores.gerir': ['ADMIN'],
  'contratos.ver': ['TECNICO', 'ADMIN', 'DIRECCAO'],
  'contratos.gerir': ['ADMIN'],
  'departamentos.ver': ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],
  'departamentos.gerir': ['ADMIN'],

  // --- Manutenção ---
  'manutencao.ver': ['TECNICO', 'ADMIN'],
  'manutencao.gerir': ['TECNICO', 'ADMIN'],

  // --- Abate ---
  'abate.ver': ['TECNICO', 'ADMIN', 'DIRECCAO'],
  'abate.propor': ['TECNICO', 'ADMIN'],
  'abate.submeter': ['ADMIN'],
  'abate.decidir': ['DIRECCAO'],
  'abate.auto.pdf': ['TECNICO', 'ADMIN', 'DIRECCAO'],

  // --- Conhecimento e questionário ---
  'conhecimento.ver': ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],
  'conhecimento.escrever': ['TECNICO', 'ADMIN'],
  'questionario.responder': ['TECNICO', 'ADMIN'],
  'questionario.ver': ['TECNICO', 'ADMIN'],

  // --- Análise ---
  'relatorios.ver': ['TECNICO', 'ADMIN', 'DIRECCAO'],
  'relatorios.exportar': ['TECNICO', 'ADMIN', 'DIRECCAO'],

  // --- Transparência ---
  'auditoria.ver.proprios': ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],
  'auditoria.ver.global': ['TECNICO', 'ADMIN', 'DIRECCAO'],

  // --- Utilizadores ---
  'users.ver': ['ADMIN', 'DIRECCAO'],
  'users.criar': ['ADMIN'],
  'users.desactivar': ['ADMIN'],
  'users.repor.password': ['ADMIN'],
  'users.editar': ['ADMIN'],
  'conta.propria.gerir': ['FUNCIONARIO', 'TECNICO', 'ADMIN', 'DIRECCAO'],
} as const satisfies Record<string, readonly Perfil[]>;

export type Permissao = keyof typeof PERMISSOES;

export function podeFazer(perfil: string, permissao: Permissao): boolean {
  return (PERMISSOES[permissao] as readonly string[]).includes(perfil);
}

/** Lista de permissões de um perfil — enviada ao frontend no início de sessão */
export function permissoesDe(perfil: string): string[] {
  return Object.entries(PERMISSOES)
    .filter(([, perfis]) => (perfis as readonly string[]).includes(perfil))
    .map(([chave]) => chave);
}

/** Descrições legíveis, para o quadro de permissões apresentado à Direcção */
export const DESCRICOES: Record<string, string> = {
  'pedidos.criar': 'Abrir pedidos técnicos',
  'pedidos.ver.proprios': 'Consultar os próprios pedidos',
  'pedidos.ver.todos': 'Consultar os pedidos de todos os utilizadores',
  'pedidos.gerir': 'Atribuir, actualizar estado e resolver pedidos',
  'pedidos.notas.internas': 'Escrever e ler notas internas (não visíveis ao requerente)',
  'pedidos.avaliar': 'Avaliar o atendimento dos próprios pedidos',
  'itens.ver.proprios': 'Consultar os equipamentos atribuídos a si',
  'itens.ver.todos': 'Consultar todo o inventário',
  'itens.criar': 'Registar novos itens de configuração',
  'itens.editar': 'Editar itens e registar movimentações',
  'itens.relacoes.gerir': 'Definir dependências entre itens',
  'categorias.ver': 'Consultar categorias e ciclos de vida',
  'categorias.gerir': 'Criar e alterar categorias e campos próprios',
  'fornecedores.ver': 'Consultar fornecedores',
  'fornecedores.gerir': 'Registar e alterar fornecedores',
  'contratos.ver': 'Consultar contratos e subscrições',
  'contratos.gerir': 'Registar e alterar contratos',
  'departamentos.ver': 'Consultar departamentos',
  'departamentos.gerir': 'Criar, renomear e eliminar departamentos',
  'manutencao.ver': 'Consultar o calendário de manutenção preventiva',
  'manutencao.gerir': 'Criar e concluir ordens de manutenção',
  'abate.ver': 'Consultar processos de abate',
  'abate.propor': 'Emitir parecer técnico e propor abate',
  'abate.submeter': 'Submeter propostas à Direcção',
  'abate.decidir': 'Aprovar ou rejeitar propostas de abate',
  'abate.auto.pdf': 'Aceder aos Autos de Abate em PDF',
  'conhecimento.ver': 'Consultar a base de conhecimento',
  'conhecimento.escrever': 'Criar e editar artigos',
  'questionario.responder': 'Responder ao questionário técnico',
  'questionario.ver': 'Consultar as respostas do questionário',
  'relatorios.ver': 'Consultar relatórios e indicadores',
  'relatorios.exportar': 'Exportar inventário e relatórios',
  'auditoria.ver.proprios': 'Ver quem acedeu aos seus dados (Data Tracker)',
  'auditoria.ver.global': 'Consultar o registo de auditoria global',
  'users.ver': 'Consultar a lista de utilizadores',
  'users.criar': 'Criar contas por convite',
  'users.desactivar': 'Desactivar e reactivar contas',
  'users.repor.password': 'Repor palavras-passe',
  'users.editar': 'Alterar perfil, departamento e posto de utilizadores',
  'conta.propria.gerir': 'Alterar a própria palavra-passe',
};

export const GRUPOS: Record<string, string> = {
  pedidos: 'Pedidos técnicos', itens: 'Itens de configuração', categorias: 'Categorias',
  fornecedores: 'Fornecedores', contratos: 'Contratos', departamentos: 'Departamentos', manutencao: 'Manutenção',
  abate: 'Obsolescência e abate', conhecimento: 'Base de conhecimento',
  questionario: 'Questionário técnico', relatorios: 'Relatórios', auditoria: 'Transparência',
  users: 'Utilizadores', conta: 'Conta pessoal',
};

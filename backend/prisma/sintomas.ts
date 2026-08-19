/**
 * Catálogo de sintomas do SIGTEC.
 *
 * Escrito na linguagem de quem tem o problema, não na de quem o resolve.
 * Cada sintoma traz: perguntas de esclarecimento (respostas por toque),
 * passos de auto-ajuda (que evitam pedidos desnecessários) e o diagnóstico
 * provável para o técnico — que chega ao pedido já com meio caminho andado.
 */

export type PerguntaSintoma = { chave: string; pergunta: string; opcoes: string[] };

export type SintomaSeed = {
  grupo: string;
  rotulo: string;
  icone: string;
  descricaoAjuda?: string;
  perguntas?: PerguntaSintoma[];
  passosAutoAjuda?: string[];
  prioridadeSugerida: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  categoriaTecnica: string;
  diagnosticoProvavel?: string;
  ordem: number;
};

export const SINTOMAS: SintomaSeed[] = [
  /* ---------------- COMPUTADOR ---------------- */
  {
    grupo: 'Computador', rotulo: 'Não liga — nada acontece ao carregar no botão', icone: '🔌', ordem: 1,
    prioridadeSugerida: 'CRITICA', categoriaTecnica: 'Hardware',
    perguntas: [
      { chave: 'luzes', pergunta: 'Vê alguma luz acesa na caixa do computador?', opcoes: ['Nenhuma luz', 'Luz acesa mas não arranca', 'Luz a piscar'] },
      { chave: 'atendimento', pergunta: 'Está a atender público neste momento?', opcoes: ['Sim, com fila', 'Sim, sem fila', 'Não'] },
    ],
    passosAutoAjuda: [
      'Confirme que o cabo de alimentação está bem ligado à tomada e à parte de trás do computador.',
      'Verifique se a tomada tem corrente (experimente outro aparelho na mesma tomada).',
      'Se estiver ligado a uma extensão ou UPS, confirme que esta está ligada.',
    ],
    diagnosticoProvavel: 'Fonte de alimentação, cabo ou tomada. Se houver luz sem arranque: possível falha de placa ou memória.',
  },
  {
    grupo: 'Computador', rotulo: 'Liga mas o ecrã fica preto', icone: '🖥', ordem: 2,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Hardware',
    perguntas: [
      { chave: 'ecraLuz', pergunta: 'O ecrã tem alguma luz acesa?', opcoes: ['Sim, verde/branca', 'Sim, laranja', 'Nenhuma'] },
      { chave: 'mensagem', pergunta: 'Aparece alguma mensagem antes de ficar preto?', opcoes: ['Não, fica logo preto', 'Sim, aparece texto', 'Aparece o logótipo e depois preto'] },
    ],
    passosAutoAjuda: [
      'Verifique se o cabo entre o ecrã e o computador está bem encaixado nas duas pontas.',
      'Confirme que o ecrã está ligado no seu próprio botão.',
      'Se a luz do ecrã estiver laranja, normalmente significa que não está a receber imagem — experimente desligar e voltar a ligar o cabo.',
    ],
    diagnosticoProvavel: 'Cabo de vídeo, ecrã ou placa gráfica. Luz laranja indica ausência de sinal.',
  },
  {
    grupo: 'Computador', rotulo: 'Está muito lento', icone: '🐌', ordem: 3,
    prioridadeSugerida: 'MEDIA', categoriaTecnica: 'Hardware',
    perguntas: [
      { chave: 'quando', pergunta: 'Quando é que está mais lento?', opcoes: ['Desde que ligo', 'Ao abrir programas', 'Só em certas alturas do dia', 'Sempre'] },
      { chave: 'desde', pergunta: 'Desde quando?', opcoes: ['Começou hoje', 'Há alguns dias', 'Há semanas ou meses'] },
    ],
    passosAutoAjuda: [
      'Reinicie o computador — muitos casos resolvem-se assim, sobretudo se estiver ligado há vários dias.',
      'Feche os programas e separadores do browser que não estiver a usar.',
    ],
    diagnosticoProvavel: 'Disco em fim de vida, memória insuficiente ou excesso de programas no arranque. Verificar SMART do disco.',
  },
  {
    grupo: 'Computador', rotulo: 'Desliga-se ou reinicia sozinho', icone: '⚡', ordem: 4,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Hardware',
    perguntas: [
      { chave: 'frequencia', pergunta: 'Com que frequência acontece?', opcoes: ['Várias vezes por dia', 'Uma vez por dia', 'De vez em quando'] },
      { chave: 'quente', pergunta: 'O computador está a fazer mais barulho ou a aquecer?', opcoes: ['Sim', 'Não', 'Não reparei'] },
    ],
    passosAutoAjuda: ['Verifique se as saídas de ar do computador estão desobstruídas e sem pó acumulado.'],
    diagnosticoProvavel: 'Sobreaquecimento, fonte de alimentação ou falha de memória. Verificar temperaturas e registo de eventos.',
  },
  {
    grupo: 'Computador', rotulo: 'Bloqueia ou aparecem erros a meio do trabalho', icone: '⚠', ordem: 5,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Hardware',
    perguntas: [
      { chave: 'programa', pergunta: 'Acontece num programa específico?', opcoes: ['Sim, sempre no mesmo', 'Não, em qualquer um'] },
      { chave: 'perdeu', pergunta: 'Chegou a perder trabalho por causa disso?', opcoes: ['Sim', 'Não'] },
    ],
    diagnosticoProvavel: 'Se for num só programa: aplicação ou perfil. Se for geral: disco, memória ou sistema.',
  },
  {
    grupo: 'Computador', rotulo: 'Teclado ou rato não funcionam', icone: '⌨', ordem: 6,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Hardware',
    perguntas: [{ chave: 'qual', pergunta: 'O que não funciona?', opcoes: ['Teclado', 'Rato', 'Os dois'] }],
    passosAutoAjuda: [
      'Desligue e volte a ligar o cabo USB, de preferência noutra entrada.',
      'Se for sem fios, substitua as pilhas.',
    ],
    diagnosticoProvavel: 'Cabo, porta USB ou periférico avariado. Substituição por stock é geralmente imediata.',
  },
  {
    grupo: 'Computador', rotulo: 'Não tem som ou o microfone não capta', icone: '🔈', ordem: 7,
    prioridadeSugerida: 'BAIXA', categoriaTecnica: 'Hardware',
    passosAutoAjuda: ['Verifique se o volume não está no mínimo ou em silêncio, no canto inferior direito do ecrã.'],
    diagnosticoProvavel: 'Configuração de dispositivo de saída/entrada ou ficha mal ligada.',
  },

  /* ---------------- IMPRESSORA ---------------- */
  {
    grupo: 'Impressora', rotulo: 'Não imprime nada', icone: '🖨', ordem: 10,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Impressão',
    perguntas: [
      { chave: 'erro', pergunta: 'A impressora mostra alguma luz ou mensagem de erro?', opcoes: ['Sim, luz vermelha', 'Sim, mensagem no visor', 'Não, parece normal'] },
      { chave: 'outros', pergunta: 'Os colegas conseguem imprimir nesta impressora?', opcoes: ['Também não conseguem', 'Conseguem', 'Não sei'] },
    ],
    passosAutoAjuda: [
      'Confirme que a impressora está ligada e com o visor aceso.',
      'Verifique se há papel no tabuleiro e se não está encravado.',
      'Desligue a impressora, aguarde 30 segundos e volte a ligar.',
    ],
    diagnosticoProvavel: 'Se ninguém imprime: impressora ou rede. Se só um posto: fila de impressão ou controlador.',
  },
  {
    grupo: 'Impressora', rotulo: 'Encrava papel com frequência', icone: '📄', ordem: 11,
    prioridadeSugerida: 'MEDIA', categoriaTecnica: 'Impressão',
    perguntas: [{ chave: 'onde', pergunta: 'Onde costuma encravar?', opcoes: ['À entrada do papel', 'A meio', 'À saída', 'Não sei'] }],
    passosAutoAjuda: [
      'Retire o papel encravado puxando sempre no sentido do percurso, nunca ao contrário.',
      'Verifique se o papel está húmido ou empenado — no Porto a humidade é causa frequente.',
    ],
    diagnosticoProvavel: 'Rolos de alimentação gastos ou fusor. Encravamentos repetidos são critério de obsolescência.',
  },
  {
    grupo: 'Impressora', rotulo: 'Imprime com manchas, riscos ou desbotado', icone: '🎨', ordem: 12,
    prioridadeSugerida: 'MEDIA', categoriaTecnica: 'Impressão',
    perguntas: [{ chave: 'aspecto', pergunta: 'Como fica a impressão?', opcoes: ['Muito clara', 'Com riscos', 'Com manchas', 'Toda preta'] }],
    passosAutoAjuda: ['Verifique o nível de toner no visor da impressora.'],
    diagnosticoProvavel: 'Toner em fim de vida ou tambor. Riscos verticais indicam tambor riscado.',
  },
  {
    grupo: 'Impressora', rotulo: 'Acabou o toner ou o papel', icone: '📦', ordem: 13,
    prioridadeSugerida: 'MEDIA', categoriaTecnica: 'Impressão',
    perguntas: [{ chave: 'oque', pergunta: 'O que falta?', opcoes: ['Toner', 'Papel', 'Os dois'] }],
    diagnosticoProvavel: 'Reposição de consumível. Verificar stock e registar consumo.',
  },
  {
    grupo: 'Impressora', rotulo: 'Não consigo digitalizar documentos', icone: '📠', ordem: 14,
    prioridadeSugerida: 'MEDIA', categoriaTecnica: 'Impressão',
    diagnosticoProvavel: 'Controlador de digitalização, pasta de destino ou permissões de rede.',
  },

  /* ---------------- REDE E INTERNET ---------------- */
  {
    grupo: 'Rede e Internet', rotulo: 'Não tenho internet', icone: '🌐', ordem: 20,
    prioridadeSugerida: 'CRITICA', categoriaTecnica: 'Rede',
    perguntas: [
      { chave: 'quem', pergunta: 'Os colegas também estão sem internet?', opcoes: ['Também estão', 'Só eu', 'Não sei'] },
      { chave: 'atendimento', pergunta: 'Isto está a impedir o atendimento ao público?', opcoes: ['Sim', 'Não'] },
    ],
    passosAutoAjuda: [
      'Verifique se o cabo de rede está bem encaixado na parte de trás do computador.',
      'Se usa Wi-Fi, confirme que está ligado à rede correcta.',
    ],
    diagnosticoProvavel: 'Se for geral: fornecedor ou equipamento central (router/switch) — verificar contrato e SLA. Se for um posto: cabo, tomada ou placa de rede.',
  },
  {
    grupo: 'Rede e Internet', rotulo: 'A internet está muito lenta', icone: '🐢', ordem: 21,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Rede',
    perguntas: [{ chave: 'quando', pergunta: 'É a toda a hora ou em certas alturas?', opcoes: ['A toda a hora', 'Só de manhã', 'Só à tarde', 'Varia'] }],
    diagnosticoProvavel: 'Saturação de largura de banda ou problema no fornecedor. Verificar contrato e histórico.',
  },
  {
    grupo: 'Rede e Internet', rotulo: 'Não consigo aceder à pasta partilhada', icone: '📁', ordem: 22,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Rede',
    perguntas: [
      { chave: 'mensagem', pergunta: 'Que mensagem aparece?', opcoes: ['Acesso negado', 'Não encontrado', 'Pede palavra-passe', 'Fica a carregar'] },
    ],
    passosAutoAjuda: ['Termine sessão e volte a entrar no computador — as permissões são aplicadas no início de sessão.'],
    diagnosticoProvavel: 'Permissões, unidade desligada ou servidor de ficheiros.',
  },

  /* ---------------- SISTEMA BIOMÉTRICO ---------------- */
  {
    grupo: 'Atendimento Consular', rotulo: 'O leitor de impressões digitais não lê', icone: '👆', ordem: 30,
    prioridadeSugerida: 'CRITICA', categoriaTecnica: 'Sistema biométrico',
    perguntas: [
      { chave: 'quantos', pergunta: 'Acontece com todos os utentes ou só alguns?', opcoes: ['Todos', 'Só alguns', 'Piorou hoje'] },
      { chave: 'luz', pergunta: 'O leitor acende a luz quando toca?', opcoes: ['Sim', 'Não'] },
    ],
    passosAutoAjuda: [
      'Limpe o vidro do sensor com um pano seco de microfibra — nunca aplique álcool directamente.',
      'Peça ao utente para limpar e secar bem os dedos.',
    ],
    diagnosticoProvavel: 'Sensor sujo, cabo USB ou serviço do leitor. Se for só com alguns utentes, é normal com dedos secos ou gastos.',
  },
  {
    grupo: 'Atendimento Consular', rotulo: 'O sistema de vistos ou consular está em baixo', icone: '🛂', ordem: 31,
    prioridadeSugerida: 'CRITICA', categoriaTecnica: 'Aplicação',
    perguntas: [
      { chave: 'quem', pergunta: 'Acontece a todos os balcões?', opcoes: ['A todos', 'Só ao meu'] },
      { chave: 'fila', pergunta: 'Há utentes a aguardar?', opcoes: ['Sim, muitos', 'Alguns', 'Não'] },
    ],
    diagnosticoProvavel: 'Aplicação central, ligação ao serviço ou credenciais. Verificar dependências do sistema no inventário.',
  },
  {
    grupo: 'Atendimento Consular', rotulo: 'A câmara de fotografia não funciona', icone: '📷', ordem: 32,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Hardware',
    diagnosticoProvavel: 'Cabo USB, controlador ou aplicação de captura.',
  },
  {
    grupo: 'Atendimento Consular', rotulo: 'O sistema de senhas ou chamada não funciona', icone: '🎫', ordem: 33,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Aplicação',
    diagnosticoProvavel: 'Aplicação de gestão de filas, ecrã de chamada ou impressora de senhas.',
  },

  /* ---------------- PROGRAMAS E ACESSOS ---------------- */
  {
    grupo: 'Programas e Acessos', rotulo: 'Esqueci-me da palavra-passe / conta bloqueada', icone: '🔑', ordem: 40,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Software',
    perguntas: [{ chave: 'onde', pergunta: 'De que acesso se trata?', opcoes: ['Computador', 'Email', 'Sistema consular', 'Outro'] }],
    diagnosticoProvavel: 'Reposição de credenciais. Confirmar identidade do requerente antes de repor.',
  },
  {
    grupo: 'Programas e Acessos', rotulo: 'Um programa não abre ou dá erro', icone: '🚫', ordem: 41,
    prioridadeSugerida: 'MEDIA', categoriaTecnica: 'Software',
    perguntas: [
      { chave: 'qual', pergunta: 'Qual o programa?', opcoes: ['Word / Excel', 'Email', 'Sistema consular', 'Browser', 'Outro'] },
      { chave: 'desde', pergunta: 'Funcionava antes?', opcoes: ['Sim, até hoje', 'Nunca funcionou neste posto', 'Não sei'] },
    ],
    passosAutoAjuda: ['Feche o programa completamente e volte a abri-lo. Se persistir, reinicie o computador.'],
    diagnosticoProvavel: 'Instalação, licença ou perfil do utilizador.',
  },
  {
    grupo: 'Programas e Acessos', rotulo: 'Preciso de instalar ou actualizar um programa', icone: '⬇', ordem: 42,
    prioridadeSugerida: 'BAIXA', categoriaTecnica: 'Software',
    perguntas: [{ chave: 'motivo', pergunta: 'Para que precisa?', opcoes: ['Trabalho corrente', 'Pedido da chefia', 'Substituir outro programa'] }],
    diagnosticoProvavel: 'Verificar licenciamento disponível antes de instalar.',
  },
  {
    grupo: 'Programas e Acessos', rotulo: 'Não recebo ou não consigo enviar email', icone: '✉', ordem: 43,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Software',
    perguntas: [{ chave: 'oque', pergunta: 'O que não funciona?', opcoes: ['Não recebo', 'Não consigo enviar', 'Nenhum dos dois'] }],
    diagnosticoProvavel: 'Caixa cheia, configuração de conta ou serviço de correio.',
  },
  {
    grupo: 'Programas e Acessos', rotulo: 'Perdi um ficheiro ou apaguei sem querer', icone: '🗑', ordem: 44,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Software',
    perguntas: [
      { chave: 'quando', pergunta: 'Quando foi?', opcoes: ['Hoje', 'Esta semana', 'Há mais tempo'] },
      { chave: 'onde', pergunta: 'Onde estava guardado?', opcoes: ['Ambiente de trabalho', 'Documentos', 'Pasta partilhada', 'Não sei'] },
    ],
    passosAutoAjuda: ['Verifique primeiro a Reciclagem — o ficheiro pode estar lá e a recuperação é imediata.'],
    diagnosticoProvavel: 'Recuperação por cópia de segurança. Actuar depressa: quanto mais cedo, maior a probabilidade.',
  },

  /* ---------------- TELEFONE E OUTROS ---------------- */
  {
    grupo: 'Telefone e Outros', rotulo: 'O telefone não funciona', icone: '☎', ordem: 50,
    prioridadeSugerida: 'ALTA', categoriaTecnica: 'Rede',
    perguntas: [{ chave: 'oque', pergunta: 'O que se passa?', opcoes: ['Sem linha', 'Não recebo chamadas', 'Não consigo ligar', 'Sem som'] }],
    diagnosticoProvavel: 'Telefone IP: rede, alimentação PoE ou central telefónica.',
  },
  {
    grupo: 'Telefone e Outros', rotulo: 'Preciso de equipamento novo ou de substituição', icone: '📥', ordem: 51,
    prioridadeSugerida: 'BAIXA', categoriaTecnica: 'Hardware',
    perguntas: [
      { chave: 'oque', pergunta: 'De que precisa?', opcoes: ['Computador', 'Ecrã', 'Teclado ou rato', 'Telefone', 'Outro'] },
      { chave: 'motivo', pergunta: 'Porquê?', opcoes: ['Novo funcionário', 'O actual está avariado', 'Mudança de posto'] },
    ],
    diagnosticoProvavel: 'Verificar stock e, se necessário, iniciar processo de aquisição.',
  },
  {
    grupo: 'Telefone e Outros', rotulo: 'Mudança de posto de trabalho', icone: '📦', ordem: 52,
    prioridadeSugerida: 'BAIXA', categoriaTecnica: 'Hardware',
    perguntas: [{ chave: 'quando', pergunta: 'Para quando?', opcoes: ['Hoje', 'Esta semana', 'Próxima semana ou depois'] }],
    diagnosticoProvavel: 'Movimentação de equipamento — actualizar localização no inventário e emitir auto de entrega.',
  },
  {
    grupo: 'Telefone e Outros', rotulo: 'Outro problema não listado', icone: '❓', ordem: 99,
    descricaoAjuda: 'Descreva por palavras suas o que está a acontecer. Um técnico irá analisar.',
    prioridadeSugerida: 'MEDIA', categoriaTecnica: 'Hardware',
    diagnosticoProvavel: 'Requer triagem manual.',
  },
];

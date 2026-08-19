/**
 * Conhecimento de resolução — padrões conhecidos por fabricante e categoria.
 *
 * Serve de ponto de partida ao técnico: são procedimentos genéricos, publicados pelos
 * fabricantes ou de prática corrente. À medida que a equipa os aplica, o sistema regista
 * a taxa de sucesso real e os mais eficazes sobem nas sugestões.
 */

export type ResolucaoSeed = {
  marca?: string;
  categoria?: string;
  sintomaChave: string;
  titulo: string;
  passos: string[];
  pecaProvavel?: string;
  tempoEstimado?: number; // minutos
  fonte: string;
};

export const RESOLUCOES: ResolucaoSeed[] = [
  /* ---------- COMPUTADORES ---------- */
  {
    categoria: 'Computador', sintomaChave: 'não liga nada acontece botão',
    titulo: 'Sequência de diagnóstico para computador que não liga', tempoEstimado: 20,
    fonte: 'Prática corrente', pecaProvavel: 'Fonte de alimentação',
    passos: [
      'Testar a tomada com outro aparelho e substituir o cabo de alimentação por um conhecido bom.',
      'Desligar da corrente, manter o botão de ligar premido 15 segundos (descarrega os condensadores) e voltar a ligar.',
      'Retirar todos os periféricos USB e tentar arrancar apenas com ecrã e teclado.',
      'Abrir e reassentar a memória RAM e o cabo de alimentação da placa; limpar o pó.',
      'Se a ventoinha da fonte não roda em nenhum momento, a fonte é a causa mais provável.',
    ],
  },
  {
    marca: 'HP', categoria: 'Computador', sintomaChave: 'não liga luzes a piscar código',
    titulo: 'HP ProDesk — códigos de luz no diagnóstico de arranque', tempoEstimado: 15,
    fonte: 'Documentação HP', pecaProvavel: 'Memória RAM',
    passos: [
      'Contar as piscadelas da luz de energia: 3 piscadelas indicam memória, 4 indicam placa gráfica, 5 indicam placa-mãe.',
      'Para 3 piscadelas: retirar os módulos de memória, limpar os contactos com borracha branca e reinserir um de cada vez.',
      'Testar com um único módulo em cada ranhura para isolar módulo ou ranhura defeituosa.',
    ],
  },
  {
    marca: 'Dell', categoria: 'Computador', sintomaChave: 'não liga luzes diagnóstico',
    titulo: 'Dell OptiPlex — luzes de diagnóstico e teste integrado', tempoEstimado: 15,
    fonte: 'Documentação Dell',
    passos: [
      'Premir e manter o botão de diagnóstico integrado (junto ao botão de ligar) para executar o teste automático.',
      'Luz âmbar fixa indica falha de alimentação; âmbar intermitente indica sequência de erro a contar.',
      'Executar o ePSA premindo F12 no arranque e escolher Diagnostics — devolve o componente em falha.',
    ],
  },
  {
    categoria: 'Computador', sintomaChave: 'lento arranque disco',
    titulo: 'Computador lento — despiste por ordem de probabilidade', tempoEstimado: 30,
    fonte: 'Prática corrente', pecaProvavel: 'Disco (substituir por SSD)',
    passos: [
      'Verificar a saúde do disco (SMART): sectores reatribuídos ou pendentes acima de zero indicam disco em fim de vida.',
      'Confirmar espaço livre: abaixo de 15% da capacidade o desempenho degrada-se muito.',
      'Desactivar programas de arranque desnecessários no Gestor de Tarefas.',
      'Verificar se o antivírus está a fazer análise completa em horário de trabalho — reagendar para fora de horas.',
      'Em equipamentos com disco mecânico e mais de 4 anos, a substituição por SSD resolve a esmagadora maioria dos casos.',
    ],
  },
  {
    categoria: 'Computador', sintomaChave: 'desliga reinicia sozinho quente',
    titulo: 'Encerramentos inesperados — sobreaquecimento ou alimentação', tempoEstimado: 40,
    fonte: 'Prática corrente', pecaProvavel: 'Ventoinha ou pasta térmica',
    passos: [
      'Consultar o registo de eventos do sistema para distinguir falha de energia (evento 41) de erro de software.',
      'Limpar o pó das ventoinhas e dissipadores com ar comprimido; verificar se todas rodam.',
      'Se as temperaturas ultrapassarem os 90 °C em carga, substituir a pasta térmica.',
      'Testar com outra fonte de alimentação se o problema ocorrer sob carga.',
    ],
  },

  /* ---------- ECRÃS ---------- */
  {
    categoria: 'Monitor', sintomaChave: 'ecrã preto sem imagem luz laranja',
    titulo: 'Ecrã sem imagem — isolar cabo, ecrã ou computador', tempoEstimado: 10,
    fonte: 'Prática corrente', pecaProvavel: 'Cabo de vídeo',
    passos: [
      'Luz laranja ou intermitente significa ecrã ligado sem receber sinal: o problema está no cabo ou no computador.',
      'Substituir o cabo por um conhecido bom antes de trocar qualquer equipamento — é a causa mais frequente.',
      'Testar o ecrã noutro computador e o computador noutro ecrã para isolar definitivamente.',
      'Se o computador tem placa gráfica dedicada, confirmar que o cabo está ligado a essa saída e não à da placa-mãe.',
    ],
  },

  /* ---------- IMPRESSORAS ---------- */
  {
    marca: 'HP', categoria: 'Impressora', sintomaChave: 'não imprime fila trabalhos parados',
    titulo: 'HP LaserJet — reposição do serviço de impressão', tempoEstimado: 15,
    fonte: 'Documentação HP',
    passos: [
      'Parar o serviço Spooler de Impressão, apagar o conteúdo de C:\\Windows\\System32\\spool\\PRINTERS e reiniciar o serviço.',
      'Confirmar que a impressora não está em modo «Pausar impressão» nem «Utilizar impressora offline».',
      'Imprimir a página de configuração pelo painel da impressora: se sair, o problema é do posto e não do equipamento.',
      'Verificar o endereço IP na página de configuração — as impressões falham se o IP mudou por DHCP.',
    ],
  },
  {
    marca: 'Kyocera', categoria: 'Impressora', sintomaChave: 'manchas riscos impressão qualidade',
    titulo: 'Kyocera ECOSYS — qualidade de impressão degradada', tempoEstimado: 25,
    fonte: 'Documentação Kyocera', pecaProvavel: 'Unidade de tambor',
    passos: [
      'Executar a limpeza do tambor pelo menu do painel (Ajuste/Manutenção → Limpeza do tambor).',
      'Riscos verticais contínuos indicam tambor riscado; manchas repetidas a intervalos regulares indicam rolo sujo.',
      'Retirar o toner e agitá-lo horizontalmente 5 a 10 vezes antes de reinstalar — recupera impressões desbotadas.',
      'Imprimir a página de estado e comparar o padrão de teste antes e depois da limpeza.',
    ],
  },
  {
    categoria: 'Impressora', sintomaChave: 'encrava papel frequência',
    titulo: 'Encravamentos repetidos — rolos, papel e humidade', tempoEstimado: 30,
    fonte: 'Prática corrente', pecaProvavel: 'Kit de rolos de alimentação',
    passos: [
      'Limpar os rolos de alimentação com pano humedecido em álcool isopropílico e deixar secar.',
      'Verificar as guias do tabuleiro: papel folgado ou apertado provoca encravamentos.',
      'Guardar as resmas fechadas e fora do chão — a humidade do Porto empena o papel e é causa frequente.',
      'Contar os encravamentos por semana: acima de três, considerar substituição do kit de rolos ou do fusor.',
      'Se o custo do kit ultrapassar metade do valor de uma impressora nova, iniciar processo de abate.',
    ],
  },

  /* ---------- REDE ---------- */
  {
    categoria: 'Switch', sintomaChave: 'sem internet rede vários postos',
    titulo: 'Quebra de rede — isolar posto, switch ou fornecedor', tempoEstimado: 20,
    fonte: 'Prática corrente',
    passos: [
      'Determinar a abrangência: um posto, uma sala ou todo o edifício. Define imediatamente onde procurar.',
      'Se for todo o edifício: verificar as luzes do router do fornecedor e contactar o apoio com o número de cliente do contrato.',
      'Se for uma sala: verificar as luzes do switch e reiniciar apenas a porta afectada.',
      'Se for um posto: trocar o cabo e testar noutra tomada de rede antes de suspeitar da placa.',
      'Registar sempre a hora de início e fim — é o que permite reclamar o SLA ao fornecedor.',
    ],
  },
  {
    marca: 'Cisco Meraki', categoria: 'Router', sintomaChave: 'internet lenta rede desempenho',
    titulo: 'Meraki — verificar saturação e clientes com consumo anómalo', tempoEstimado: 20,
    fonte: 'Documentação Cisco Meraki',
    passos: [
      'No painel Meraki, consultar Network-wide → Clients e ordenar por utilização para identificar consumos anómalos.',
      'Verificar em Appliance status se há perda de pacotes ou latência elevada para o exterior.',
      'Comparar a largura de banda utilizada com a contratada; saturação recorrente justifica revisão do contrato.',
      'Aplicar regras de tráfego para limitar actualizações e serviços não essenciais em horário de atendimento.',
    ],
  },

  /* ---------- BIOMETRIA ---------- */
  {
    marca: 'Dermalog', categoria: 'Leitor biométrico', sintomaChave: 'leitor impressões digitais não lê',
    titulo: 'Dermalog — leitor não recolhe impressões', tempoEstimado: 20,
    fonte: 'Documentação Dermalog', pecaProvavel: 'Cabo USB ou sensor',
    passos: [
      'Limpar o vidro do sensor com pano de microfibra seco; nunca aplicar álcool directamente sobre o vidro.',
      'Ligar o leitor directamente ao computador, sem passar por hub USB — a alimentação insuficiente é causa comum.',
      'Reiniciar o serviço do leitor e confirmar que o dispositivo aparece no Gestor de Dispositivos sem aviso.',
      'Trocar o leitor com outro balcão: se o problema acompanha o equipamento, é o leitor; se fica no posto, é o computador.',
      'Dedos secos ou desgastados falham naturalmente — humedecer ligeiramente melhora a captura.',
    ],
  },

  /* ---------- UPS E INFRAESTRUTURA ---------- */
  {
    marca: 'APC', categoria: 'UPS', sintomaChave: 'ups apita bateria substituir',
    titulo: 'APC Smart-UPS — aviso de bateria e teste de autonomia', tempoEstimado: 30,
    fonte: 'Documentação APC', pecaProvavel: 'Conjunto de baterias',
    passos: [
      'Executar o teste automático pelo painel ou pelo software PowerChute e registar o resultado.',
      'Um apito contínuo com indicador de substituição significa bateria em fim de vida: substituir sem adiar.',
      'As baterias têm vida típica de 3 a 4 anos; registar sempre a data de substituição no histórico do equipamento.',
      'Após substituir, recalibrar a UPS para que a estimativa de autonomia volte a ser fiável.',
    ],
  },
  {
    categoria: 'Servidor', sintomaChave: 'servidor lento temperatura sala técnica',
    titulo: 'Servidor com desempenho degradado — verificar ambiente primeiro', tempoEstimado: 25,
    fonte: 'Prática corrente',
    passos: [
      'Medir a temperatura da sala técnica: acima de 27 °C os servidores reduzem a frequência para se protegerem.',
      'Confirmar que a climatização está a funcionar — é frequentemente a causa real de «o servidor está lento».',
      'Verificar o estado dos discos em RAID: um disco degradado reduz drasticamente o desempenho.',
      'Consultar o registo do controlador de armazenamento antes de investigar aplicações.',
    ],
  },

  /* ---------- SOFTWARE E ACESSOS ---------- */
  {
    categoria: 'Software', sintomaChave: 'programa não abre erro aplicação',
    titulo: 'Aplicação não arranca — perfil, permissões ou instalação', tempoEstimado: 25,
    fonte: 'Prática corrente',
    passos: [
      'Testar com outra conta de utilizador no mesmo computador: se funcionar, o problema é do perfil.',
      'Executar como administrador uma vez, para despistar permissões em pastas de dados.',
      'Consultar o Visualizador de Eventos → Aplicação, filtrando pelo nome do executável.',
      'Reparar a instalação antes de desinstalar: preserva configurações e é mais rápido.',
    ],
  },
  {
    categoria: 'Software', sintomaChave: 'ficheiro apagado perdido recuperar',
    titulo: 'Recuperação de ficheiro apagado — actuar por ordem de rapidez', tempoEstimado: 30,
    fonte: 'Prática corrente',
    passos: [
      'Verificar a Reciclagem do posto e, se o ficheiro estava em pasta de rede, a reciclagem do servidor.',
      'Usar Versões Anteriores (separador nas propriedades da pasta) — recupera sem repor toda a cópia.',
      'Se estiver em cópia de segurança, repor para uma pasta temporária e não sobre o original.',
      'Quanto mais cedo se actuar, maior a probabilidade: registar a hora do sucedido no pedido.',
    ],
  },
];

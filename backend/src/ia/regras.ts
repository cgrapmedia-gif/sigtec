/**
 * Motor de regras do SIGTEC — assistente de decisão determinístico.
 * Não depende de serviços externos: as sugestões são explicáveis e auditáveis,
 * requisito essencial num contexto institucional.
 */

const PALAVRAS_CRITICAS = ['não arranca', 'nao arranca', 'parado', 'sem acesso', 'bloqueado', 'atendimento parado', 'urgente', 'avariado', 'não liga', 'nao liga', 'fila', 'público', 'publico'];
const PALAVRAS_ALTAS = ['lento', 'erro', 'falha', 'intermitente', 'biométrico', 'biometrico', 'impressora', 'rede', 'não imprime', 'nao imprime'];
const PALAVRAS_BAIXAS = ['dúvida', 'duvida', 'informação', 'informacao', 'pedido de', 'formação', 'formacao', 'sugestão', 'sugestao'];

export type SugestaoTriagem = {
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  categoria: string;
  justificacao: string;
};

/** Triagem automática: sugere prioridade e categoria a partir do texto do pedido */
export function triagem(assunto: string, descricao?: string): SugestaoTriagem {
  const texto = `${assunto} ${descricao ?? ''}`.toLowerCase();
  const motivos: string[] = [];

  let prioridade: SugestaoTriagem['prioridade'] = 'MEDIA';
  const critica = PALAVRAS_CRITICAS.find((p) => texto.includes(p));
  const alta = PALAVRAS_ALTAS.find((p) => texto.includes(p));
  const baixa = PALAVRAS_BAIXAS.find((p) => texto.includes(p));

  if (critica) { prioridade = 'CRITICA'; motivos.push(`expressão «${critica}» indica serviço interrompido`); }
  else if (alta) { prioridade = 'ALTA'; motivos.push(`expressão «${alta}» indica degradação do serviço`); }
  else if (baixa) { prioridade = 'BAIXA'; motivos.push(`expressão «${baixa}» indica pedido informativo`); }
  else motivos.push('sem indícios de urgência no texto — prioridade normal');

  let categoria = 'Hardware';
  if (/rede|wi-?fi|internet|pasta partilhada|vpn/.test(texto)) categoria = 'Rede';
  else if (/impress|toner|papel|tinta/.test(texto)) categoria = 'Impressão';
  else if (/biom|impress(ão|ao) digital|dermalog|leitor/.test(texto)) categoria = 'Sistema biométrico';
  else if (/aplica|programa|sistema|software|licen/.test(texto)) categoria = 'Aplicação';
  else if (/windows|office|word|excel|antivírus|antivirus/.test(texto)) categoria = 'Software';

  return { prioridade, categoria, justificacao: motivos.join('; ') };
}

/** Resumo executivo para a Direcção, gerado a partir dos dados reais */
export function resumoExecutivo(d: {
  pedidosAbertos: number; criticos: number; slaCumpridoPct: number; tempoMedioHoras: number;
  candidatosAbate: number; topFalhas: { numInventario: string; marca: string; modelo: string; falhas6m: number }[];
  custoEstimadoRenovacao: number; variacaoAvarias: number; satisfacaoMedia: number | null;
}): string {
  const frases: string[] = [];

  if (d.variacaoAvarias < 0) frases.push(`As avarias registaram uma descida de ${Math.abs(d.variacaoAvarias)}% face ao mês anterior.`);
  else if (d.variacaoAvarias > 0) frases.push(`As avarias subiram ${d.variacaoAvarias}% face ao mês anterior, o que merece atenção.`);
  else frases.push('O volume de avarias manteve-se estável face ao mês anterior.');

  if (d.criticos > 0) frases.push(`Existem ${d.criticos} incidente(s) crítico(s) por resolver, num total de ${d.pedidosAbertos} pedidos abertos.`);
  else frases.push(`Não há incidentes críticos por resolver (${d.pedidosAbertos} pedidos abertos).`);

  if (d.slaCumpridoPct >= 90) frases.push(`O cumprimento de SLA está em ${d.slaCumpridoPct}%, acima do objectivo de 90%.`);
  else frases.push(`O cumprimento de SLA está em ${d.slaCumpridoPct}%, abaixo do objectivo de 90% — recomenda-se rever a afectação de técnicos.`);

  if (d.topFalhas.length) {
    const t = d.topFalhas[0];
    frases.push(`O equipamento com maior taxa de falha é ${t.numInventario} (${t.marca} ${t.modelo}), com ${t.falhas6m} ocorrências em 6 meses.`);
  }
  if (d.candidatosAbate > 0) {
    frases.push(`A análise de obsolescência identifica ${d.candidatosAbate} equipamento(s) candidatos a abate, com um investimento estimado de substituição de ${d.custoEstimadoRenovacao.toLocaleString('pt-PT')}€.`);
  }
  if (d.satisfacaoMedia !== null) {
    frases.push(`A satisfação média dos utilizadores é de ${d.satisfacaoMedia.toFixed(1)} em 5.`);
  }
  return frases.join(' ');
}

/** Previsão simples de risco de falha, por regras explicáveis */
export function riscoFalha(a: { falhas6m: number; dataAquisicao: Date; fimGarantia: Date | null; cicloVida: number }): { nivel: 'BAIXO' | 'MEDIO' | 'ALTO'; pontos: number } {
  let pontos = 0;
  const idade = (Date.now() - new Date(a.dataAquisicao).getTime()) / 31557600000;
  if (idade > a.cicloVida) pontos += 3;
  else if (idade > a.cicloVida * 0.75) pontos += 1;
  if (a.fimGarantia && new Date(a.fimGarantia) < new Date()) pontos += 2;
  pontos += Math.min(a.falhas6m, 6);
  const nivel = pontos >= 7 ? 'ALTO' : pontos >= 4 ? 'MEDIO' : 'BAIXO';
  return { nivel, pontos };
}

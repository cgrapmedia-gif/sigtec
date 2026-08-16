export const fmtData = (d: string | Date) =>
  new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

export const fmtDataHora = (d: string | Date) =>
  new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const diasAte = (d: string | Date) => Math.round((new Date(d).getTime() - Date.now()) / 86400000);

export const ESTADO_PEDIDO: Record<string, { rotulo: string; classe: string }> = {
  NOVO: { rotulo: 'Novo', classe: 'bg-azul/10 text-azul' },
  EM_ANALISE: { rotulo: 'Em análise', classe: 'bg-ambar/10 text-ambar' },
  EM_RESOLUCAO: { rotulo: 'Em resolução', classe: 'bg-purple-100 text-purple-800' },
  AGUARDA_MATERIAL: { rotulo: 'A aguardar material', classe: 'bg-linha text-cinza' },
  RESOLVIDO: { rotulo: 'Resolvido', classe: 'bg-verde/10 text-verde' },
  FECHADO: { rotulo: 'Fechado', classe: 'bg-linha text-grafite' },
};

export const PRIORIDADE: Record<string, { rotulo: string; classe: string }> = {
  BAIXA: { rotulo: 'Baixa', classe: 'bg-linha text-grafite' },
  MEDIA: { rotulo: 'Média', classe: 'bg-azul/10 text-azul' },
  ALTA: { rotulo: 'Alta', classe: 'bg-ambar/10 text-ambar' },
  CRITICA: { rotulo: 'Crítica', classe: 'bg-vermelho text-white' },
};

export const ESTADO_ACTIVO: Record<string, { rotulo: string; classe: string }> = {
  EM_ARMAZEM: { rotulo: 'Em armazém', classe: 'bg-linha text-grafite' },
  OPERACIONAL: { rotulo: 'Operacional', classe: 'bg-verde/10 text-verde' },
  EM_MANUTENCAO: { rotulo: 'Em manutenção', classe: 'bg-ambar/10 text-ambar' },
  AVARIADO: { rotulo: 'Avariado', classe: 'bg-vermelho/10 text-vermelho' },
  OBSOLETO: { rotulo: 'Obsoleto', classe: 'bg-linha text-cinza' },
  ABATIDO: { rotulo: 'Abatido', classe: 'bg-preto text-douradoClaro' },
};

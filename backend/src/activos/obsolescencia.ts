/** Ciclos de vida por omissão, em anos — usados apenas quando a categoria não está configurada */
export const CICLOS_VIDA: Record<string, number> = {
  'Computador': 5, 'Impressora': 6, 'Servidor': 6, 'Leitor biométrico': 5,
  'UPS': 4, 'Switch': 8, 'Router': 8, 'Scanner': 6, 'Telefone IP': 7, 'Monitor': 7,
};

export type ParametrosCategoria = {
  cicloVidaAnos: number;
  falhasCriticas: number;
  racioReparacao: number; // percentagem
};

export function parametrosDe(a: { categoria: string; categoriaRef?: { cicloVidaMeses: number; falhasCriticas: number; racioReparacao: number } | null }): ParametrosCategoria {
  if (a.categoriaRef) {
    return {
      cicloVidaAnos: a.categoriaRef.cicloVidaMeses / 12,
      falhasCriticas: a.categoriaRef.falhasCriticas,
      racioReparacao: a.categoriaRef.racioReparacao,
    };
  }
  return { cicloVidaAnos: CICLOS_VIDA[a.categoria] ?? 6, falhasCriticas: 5, racioReparacao: 50 };
}

/**
 * Análise de obsolescência.
 * `falhasReais` deve ser o número de pedidos registados no item nos últimos 6 meses —
 * um critério calculado é auditável; um critério declarado não é.
 */
export function analisarObsolescencia(
  a: {
    categoria: string; dataAquisicao: Date; fimGarantia: Date | null;
    falhas6m: number; custoReparacao: any; valorSubstituicao: any;
    categoriaRef?: { cicloVidaMeses: number; falhasCriticas: number; racioReparacao: number } | null;
  },
  falhasReais?: number,
): string[] {
  const motivos: string[] = [];
  const p = parametrosDe(a);
  const idade = (Date.now() - new Date(a.dataAquisicao).getTime()) / 31557600000;
  const falhas = falhasReais ?? a.falhas6m;

  if (idade > p.cicloVidaAnos) motivos.push(`Idade ${idade.toFixed(1)} anos (ciclo de vida: ${p.cicloVidaAnos})`);
  if (a.fimGarantia && new Date(a.fimGarantia) < new Date()) motivos.push('Garantia expirada');
  if (falhas >= p.falhasCriticas) motivos.push(`${falhas} falhas em 6 meses`);

  const custo = a.custoReparacao ? Number(a.custoReparacao) : null;
  const valor = a.valorSubstituicao ? Number(a.valorSubstituicao) : null;
  if (custo && valor && custo > valor * (p.racioReparacao / 100)) {
    motivos.push(`Reparação ${Math.round((custo / valor) * 100)}% do valor de substituição`);
  }
  return motivos;
}

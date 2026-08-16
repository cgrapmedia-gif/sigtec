/** Ciclos de vida por categoria, em anos (RF-ABT-01) */
export const CICLOS_VIDA: Record<string, number> = {
  'Computador': 5, 'Impressora': 6, 'Servidor': 6, 'Leitor biométrico': 5,
  'UPS': 4, 'Switch': 8, 'Router': 8, 'Scanner': 6, 'Telefone IP': 7, 'Monitor': 7,
};

export function analisarObsolescencia(a: {
  categoria: string; dataAquisicao: Date; fimGarantia: Date | null;
  falhas6m: number; custoReparacao: any; valorSubstituicao: any;
}): string[] {
  const motivos: string[] = [];
  const idade = (Date.now() - new Date(a.dataAquisicao).getTime()) / 31557600000;
  const ciclo = CICLOS_VIDA[a.categoria] ?? 6;
  if (idade > ciclo) motivos.push(`Idade ${idade.toFixed(1)} anos (ciclo de vida: ${ciclo})`);
  if (a.fimGarantia && new Date(a.fimGarantia) < new Date()) motivos.push('Garantia expirada');
  if (a.falhas6m >= 5) motivos.push(`${a.falhas6m} falhas em 6 meses`);
  const custo = a.custoReparacao ? Number(a.custoReparacao) : null;
  const valor = a.valorSubstituicao ? Number(a.valorSubstituicao) : null;
  if (custo && valor && custo > valor * 0.5) motivos.push(`Reparação ${Math.round((custo / valor) * 100)}% do valor de substituição`);
  return motivos;
}

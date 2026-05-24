export type CostUnit = 'gp' | 'sp' | 'cp'
export type CurrencyKey = 'gold' | 'silver' | 'copper'
export type Currency = { gold: number; silver: number; copper: number }

export const UNIT_MAP: Record<CostUnit, CurrencyKey> = { gp: 'gold', sp: 'silver', cp: 'copper' }
export const UNIT_LABEL: Record<CostUnit, string> = { gp: 'MO', sp: 'MP', cp: 'MC' }

export function toCp(qty: number, unit: CostUnit): number {
  if (unit === 'gp') return qty * 100
  if (unit === 'sp') return qty * 10
  return qty
}

export function formatCost(qty: number, unit: string): string {
  return `${qty} ${UNIT_LABEL[unit as CostUnit] ?? unit.toUpperCase()}`
}

export function getResaleValue(costQty: number, costUnit: CostUnit): { quantity: number; unit: CostUnit } {
  const totalCp = toCp(costQty, costUnit)
  const resaleCp = Math.max(1, Math.floor(totalCp / 2))
  if (resaleCp >= 100 && resaleCp % 100 === 0) return { quantity: resaleCp / 100, unit: 'gp' }
  if (resaleCp >= 10 && resaleCp % 10 === 0) return { quantity: resaleCp / 10, unit: 'sp' }
  return { quantity: resaleCp, unit: 'cp' }
}

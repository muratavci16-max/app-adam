export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('tr-TR')
}

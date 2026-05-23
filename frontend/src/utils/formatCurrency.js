export function formatCurrency(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '₺0'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num)
}
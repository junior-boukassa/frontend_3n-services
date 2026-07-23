const cdfFormatter = new Intl.NumberFormat('fr-CD', {
  style: 'currency',
  currency: 'CDF',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
});

export function formatCDF(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  const value = Number.isFinite(n) ? n : 0;
  return cdfFormatter.format(value);
}

export function formatCDFPerDay(amount: number | string): string {
  return `${formatCDF(amount)} / jour`;
}

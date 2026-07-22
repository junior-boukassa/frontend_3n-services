const DECIMAL = /^-?\d+(?:\.\d{1,2})?$/;

export function decimalToCents(value: string): bigint {
  const normalized = value.trim();
  if (!DECIMAL.test(normalized)) throw new Error('Montant décimal invalide');
  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ''] = unsigned.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

function grouped(value: bigint): string {
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString();
  const rendered = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  return `${negative ? '−' : ''}${rendered}`;
}

function formatCents(cents: bigint, showCents = false): string {
  const absolute = cents < 0n ? -cents : cents;
  const whole = absolute / 100n;
  const fraction = absolute % 100n;
  const suffix = (showCents || fraction !== 0n) && fraction !== 0n
    ? `,${fraction.toString().padStart(2, '0')}`
    : '';
  return `${cents < 0n ? '−' : ''}${grouped(whole)}${suffix} CDF`;
}

export function formatCDFDecimal(value: string, showCents = false): string {
  return formatCents(decimalToCents(value), showCents);
}

export function pricingDifference(base: string, proposed: string) {
  const baseCents = decimalToCents(base);
  const proposedCents = decimalToCents(proposed);
  const difference = proposedCents - baseCents;
  const basisPoints = baseCents === 0n ? null : (difference * 10000n) / baseCents;
  return {
    amount: formatCents(difference, true),
    percentage:
      basisPoints === null
        ? '—'
        : `${basisPoints < 0n ? '−' : basisPoints > 0n ? '+' : ''}${
            (basisPoints < 0n ? -basisPoints : basisPoints) / 100n
          },${((basisPoints < 0n ? -basisPoints : basisPoints) % 100n).toString().padStart(2, '0')} %`,
    direction: difference < 0n ? 'down' : difference > 0n ? 'up' : 'same',
  } as const;
}

export function inclusiveRentalDays(startDate: string, endDate: string): number {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Date invalide');
    const [year, month, day] = value.split('-').map(Number);
    const timestamp = Date.UTC(year, month - 1, day);
    const date = new Date(timestamp);
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    )
      throw new Error('Date invalide');
    return timestamp;
  };
  const difference = parse(endDate) - parse(startDate);
  if (difference < 0) throw new Error('La date de fin précède la date de début');
  return difference / 86_400_000 + 1;
}

export function canAccessPricing(role: string | null | undefined): boolean {
  return role === 'AGENCY' || role === 'ADMIN';
}

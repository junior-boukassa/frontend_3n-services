import { describe, expect, it } from 'vitest';
import {
  canAccessPricing,
  decimalToCents,
  formatCDFDecimal,
  inclusiveRentalDays,
  pricingDifference,
} from './pricing';

describe('contrat monétaire shadow pricing', () => {
  it('conserve exactement les décimales sans nombres flottants', () => {
    expect(decimalToCents('9007199254740993.25')).toBe(900719925474099325n);
    expect(formatCDFDecimal('125000.00')).toBe('125\u202f000 CDF');
    expect(formatCDFDecimal('300000.55')).toBe('300\u202f000,55 CDF');
    expect(formatCDFDecimal('-0.50', true)).toBe('−0,50 CDF');
  });

  it('calcule une différence et un pourcentage exacts', () => {
    expect(pricingDifference('100000.00', '112500.00')).toEqual({
      amount: '12\u202f500 CDF',
      percentage: '+12,50 %',
      direction: 'up',
    });
    expect(pricingDifference('100.00', '99.50').amount).toBe('−0,50 CDF');
  });

  it('rejette les formats ambigus', () => {
    expect(() => decimalToCents('1e6')).toThrow('Montant décimal invalide');
    expect(() => decimalToCents('NaN')).toThrow('Montant décimal invalide');
  });
});

describe('durée de location', () => {
  it('utilise la même convention inclusive que Django', () => {
    expect(inclusiveRentalDays('2026-08-10', '2026-08-14')).toBe(5);
    expect(inclusiveRentalDays('2026-08-10', '2026-08-10')).toBe(1);
  });

  it('rejette une période inversée ou une date impossible', () => {
    expect(() => inclusiveRentalDays('2026-08-14', '2026-08-10')).toThrow();
    expect(() => inclusiveRentalDays('2026-02-30', '2026-03-01')).toThrow();
  });
});

describe('visibilité selon le rôle', () => {
  it('autorise uniquement agence et administrateur', () => {
    expect(canAccessPricing('AGENCY')).toBe(true);
    expect(canAccessPricing('ADMIN')).toBe(true);
    expect(canAccessPricing('CLIENT')).toBe(false);
    expect(canAccessPricing(null)).toBe(false);
  });
});

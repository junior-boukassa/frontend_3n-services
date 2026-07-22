import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { pricingService } from './index';

vi.mock('../api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

describe('client Django de tarification', () => {
  beforeEach(() => vi.mocked(api.post).mockResolvedValue({ data: { id: 'rec-1' } }));

  it('communique uniquement avec les endpoints Django prévus', async () => {
    await pricingService.create({ vehicle_id: 4, client_id: 7, start_date: '2026-08-10', end_date: '2026-08-14' });
    await pricingService.accept('rec-1');
    await pricingService.modify('rec-1', '120000.00', 'Décision agence');
    await pricingService.reject('rec-1', 'Demande insuffisante');
    const urls = vi.mocked(api.post).mock.calls.map(([url]) => String(url));
    expect(urls).toEqual([
      '/ai/pricing-recommendations/',
      '/ai/pricing-recommendations/rec-1/accept/',
      '/ai/pricing-recommendations/rec-1/modify/',
      '/ai/pricing-recommendations/rec-1/reject/',
    ]);
    expect(JSON.stringify(vi.mocked(api.post).mock.calls)).not.toMatch(/ML_API_KEY|X-3N-ML-Key|FastAPI/i);
  });

  it('transmet pagination et filtre de statut', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } });
    await pricingService.list({ page: 3, status: 'PENDING', vehicle: 4, technical_status: 'SUCCESS' });
    expect(api.get).toHaveBeenCalledWith('/ai/pricing-recommendations/', {
      params: { page: 3, status: 'PENDING', vehicle: 4, technical_status: 'SUCCESS' },
    });
  });

  it('utilise le répertoire client minimal paginé', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { count: 1, next: null, previous: null, results: [{ id: 7, display_name: 'Alice Locale' }] } });
    await pricingService.clients(2, 'Alice');
    expect(api.get).toHaveBeenCalledWith('/ai/pricing-clients/', { params: { page: 2, search: 'Alice' } });
  });
});

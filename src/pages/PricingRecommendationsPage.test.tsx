import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PricingRecommendationsPage } from './PricingRecommendationsPage';
import { dataService, pricingService } from '../services';
import type { PricingRecommendation, Vehicle } from '../types';

vi.mock('../services', () => ({
  agencyService: { list: vi.fn() },
  dataService: { vehicles: vi.fn(), bookings: vi.fn() },
  pricingService: {
    list: vi.fn(),
    create: vi.fn(),
    accept: vi.fn(),
    modify: vi.fn(),
    reject: vi.fn(),
    clients: vi.fn(),
  },
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 2, role: 'AGENCY' }, loading: false }),
}));

const vehicle: Vehicle = {
  id: 4,
  owner: 2,
  agency_name: 'Agence Test',
  owner_city: 'Kinshasa',
  location_city: 'KINSHASA',
  brand: 'Toyota',
  model: 'Hiace',
  year: 2024,
  registration_plate: 'TEST-01',
  color: 'Blanc',
  category: 'VAN',
  seats: 9,
  fuel_type: 'DIESEL',
  transmission: 'MANUAL',
  daily_price: '100000.00',
  status: 'AVAILABLE',
  has_gps: false,
  has_baby_seat: false,
  unlimited_mileage: false,
  average_rating: null,
  review_count: 0,
  created_at: '2026-01-01T00:00:00+01:00',
  images: [],
};
const recommendation: PricingRecommendation = {
  id: '11111111-1111-4111-8111-111111111111',
  vehicle: 4,
  vehicle_label: 'Toyota Hiace',
  agency_id: 2,
  booking_id: null,
  start_date: '2026-08-10',
  end_date: '2026-08-14',
  rental_days: 5,
  currency: 'CDF',
  base_daily_price: '100000.00',
  recommended_daily_price: '112500.00',
  manually_proposed_daily_price: null,
  status: 'PENDING',
  technical_status: 'SUCCESS',
  decision: 'NONE',
  decision_reason: '',
  prediction_id: 'prediction-1',
  model_version: 'v3.0.0',
  main_factors: [{ nom: 'demande_locale', direction: 'hausse', impact: '0.12' }],
  input_snapshot: {},
  guardrails: {},
  error_reason: '',
  decided_by_id: null,
  decided_at: null,
  created_at: '2026-07-21T10:30:00+01:00',
  updated_at: '2026-07-21T10:30:00+01:00',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><PricingRecommendationsPage /></QueryClientProvider>);
}

describe('interface de tarification en shadow mode', () => {
  beforeEach(() => {
    vi.mocked(dataService.vehicles).mockResolvedValue([vehicle]);
    vi.mocked(dataService.bookings).mockResolvedValue([]);
    vi.mocked(pricingService.list).mockResolvedValue({ count: 1, next: null, previous: null, results: [recommendation] });
    vi.mocked(pricingService.clients).mockResolvedValue({ count: 1, next: null, previous: null, results: [{ id: 7, display_name: 'Alice Locale' }] });
  });

  it('affiche historique, montants exacts, durée, modèle et badge expérimental', async () => {
    renderPage();
    expect((await screen.findAllByText('Toyota Hiace')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mode expérimental/).length).toBeGreaterThan(0);
    expect(screen.getByText((_, element) => element?.tagName === 'SPAN' && element.textContent?.replace(/\s/g, '') === '112500CDF')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === '12\u202f500 CDF · +12,50 %')).toBeInTheDocument();
    expect(screen.getByText(/5 jour\(s\)/)).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveClass('card');
  });

  it('ouvre le détail et accepte sans appeler une mutation de prix réel', async () => {
    const accepted = { ...recommendation, status: 'ACCEPTED' as const, decision: 'ACCEPT' as const };
    vi.mocked(pricingService.accept).mockResolvedValue(accepted);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Ouvrir la recommandation/ }));
    expect(screen.getByText('v3.0.0')).toBeInTheDocument();
    expect(screen.getByText(/demande locale/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));
    await waitFor(() => expect(pricingService.accept).toHaveBeenCalledWith(recommendation.id));
    expect(dataService.vehicles).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/ne modifie pas le prix facturé/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accepter' })).not.toBeInTheDocument();
  });

  it('signale un fallback et n’affiche aucune action de décision', async () => {
    vi.mocked(pricingService.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ ...recommendation, status: 'FALLBACK', technical_status: 'FALLBACK', recommended_daily_price: '100000.00', error_reason: 'ML_TIMEOUT' }],
    });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Ouvrir la recommandation/ }));
    expect(screen.getByText(/Service ML indisponible/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accepter' })).not.toBeInTheDocument();
  });

  it('gère la pagination et les erreurs réseau', async () => {
    vi.mocked(pricingService.list).mockResolvedValueOnce({ count: 20, next: 'page-2', previous: null, results: [recommendation] });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Page suivante' }));
    await waitFor(() => expect(pricingService.list).toHaveBeenCalledWith({ page: 2 }));
  });

  it('transmet les filtres au serveur au lieu de filtrer la page localement', async () => {
    renderPage();
    await screen.findByRole('article');
    fireEvent.change(screen.getByLabelText('Filtrer par véhicule'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Filtrer par résultat technique'), { target: { value: 'SUCCESS' } });
    fireEvent.change(screen.getByLabelText('Générées depuis'), { target: { value: '2026-07-01' } });
    await waitFor(() => expect(pricingService.list).toHaveBeenLastCalledWith({
      page: 1,
      vehicle: 4,
      technical_status: 'SUCCESS',
      date_min: '2026-07-01',
    }));
  });

  it('crée une recommandation avec une sélection client sécurisée', async () => {
    vi.mocked(pricingService.create).mockResolvedValue(recommendation);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Demander une recommandation/ }));
    fireEvent.change(screen.getByLabelText('Véhicule'), { target: { value: '4' } });
    await screen.findByRole('option', { name: 'Alice Locale' });
    fireEvent.change(screen.getByLabelText('Client'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Date de début'), { target: { value: '2026-08-10' } });
    fireEvent.change(screen.getByLabelText('Date de fin'), { target: { value: '2026-08-14' } });
    const submitButtons = screen.getAllByRole('button', { name: /Demander la recommandation/ });
    fireEvent.click(submitButtons[submitButtons.length - 1]);
    await waitFor(() => expect(vi.mocked(pricingService.create).mock.calls[0]?.[0]).toEqual({
      vehicle_id: 4,
      client_id: 7,
      start_date: '2026-08-10',
      end_date: '2026-08-14',
    }));
  });
});

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  AlertTriangle,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiError } from '../api/client';
import { EmptyState, ErrorState, Modal, PageLoader, Spinner } from '../components/ui';
import { agencyService, dataService, pricingService, type PricingRecommendationRequest } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type {
  PricingFactor,
  PricingRecommendation,
  PricingRecommendationStatus,
  PricingTechnicalStatus,
  Vehicle,
} from '../types';
import { formatCDFDecimal, inclusiveRentalDays, pricingDifference } from '../utils/pricing';

const statusLabels: Record<PricingRecommendationStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  MODIFIED: 'Modifiée',
  REJECTED: 'Refusée',
  FALLBACK: 'Prix de secours',
  FAILED: 'Échec technique',
};
const technicalLabels: Record<PricingTechnicalStatus, string> = {
  SUCCESS: 'ML disponible',
  FALLBACK: 'Fallback',
  FAILED: 'Échec',
};
const cityLabels: Record<string, string> = {
  KINSHASA: 'Kinshasa',
  LUBUMBASHI: 'Lubumbashi',
  GOMA: 'Goma',
  BUKAVU: 'Bukavu',
  KISANGANI: 'Kisangani',
  MBUJI_MAYI: 'Mbuji-Mayi',
  KANANGA: 'Kananga',
  MATADI: 'Matadi',
};

function statusClass(status: PricingRecommendationStatus) {
  if (status === 'ACCEPTED' || status === 'MODIFIED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'REJECTED' || status === 'FAILED') return 'bg-red-100 text-red-700';
  if (status === 'FALLBACK') return 'bg-violet-100 text-violet-700';
  return 'bg-amber-100 text-amber-700';
}

function technicalClass(status: PricingTechnicalStatus) {
  return status === 'SUCCESS'
    ? 'bg-sky-100 text-sky-700'
    : status === 'FALLBACK'
      ? 'bg-violet-100 text-violet-700'
      : 'bg-red-100 text-red-700';
}

function backendError(error: unknown): string {
  if (!axios.isAxiosError(error)) return apiError(error);
  const status = error.response?.status;
  if (status === 401) return 'Votre session a expiré. Reconnectez-vous.';
  if (status === 403) return 'Vous n’êtes pas autorisé à consulter ces recommandations.';
  if (status === 409) return 'Cette recommandation a déjà reçu une décision.';
  if (status === 422) return 'Les données envoyées ne respectent pas le contrat de tarification.';
  const data = error.response?.data as
    | { error?: string; details?: Record<string, string | string[]> }
    | undefined;
  if (data?.details) {
    const first = Object.values(data.details)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return apiError(error);
}

export function PricingRecommendationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [technical, setTechnical] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<PricingRecommendation | null>(null);
  const vehicles = useQuery({ queryKey: ['vehicles', 'pricing'], queryFn: () => dataService.vehicles() });
  const agencies = useQuery({
    queryKey: ['agencies', 'pricing-filter'],
    queryFn: agencyService.list,
    enabled: user?.role === 'ADMIN',
  });
  const serverFilters = {
    page,
    ...(status ? { status } : {}),
    ...(technical ? { technical_status: technical } : {}),
    ...(vehicleId ? { vehicle: Number(vehicleId) } : {}),
    ...(from ? { date_min: from } : {}),
    ...(to ? { date_max: to } : {}),
    ...(agencyId && user?.role === 'ADMIN' ? { agency: Number(agencyId) } : {}),
  };
  const recommendations = useQuery({
    queryKey: ['pricing-recommendations', serverFilters],
    queryFn: () => pricingService.list(serverFilters),
    retry: false,
  });
  const vehicleMap = useMemo(
    () => new Map((vehicles.data || []).map((vehicle) => [vehicle.id, vehicle])),
    [vehicles.data],
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['pricing-recommendations'] });

  return (
    <div className="space-y-6">
      <ShadowBanner />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tarification intelligente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Analysez les recommandations expérimentales sans affecter les prix réels.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={18} /> Demander une recommandation
        </button>
      </div>
      <section className="card space-y-4" aria-label="Filtres des recommandations">
        <div className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal size={18} /> Filtres
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <select
            className="field"
            aria-label="Filtrer par véhicule"
            value={vehicleId}
            onChange={(event) => { setVehicleId(event.target.value); setPage(1); }}
          >
            <option value="">Tous les véhicules</option>
            {vehicles.data?.map((vehicle) => (
              <option value={vehicle.id} key={vehicle.id}>
                {vehicle.brand} {vehicle.model}
              </option>
            ))}
          </select>
          <select
            className="field"
            aria-label="Filtrer par statut"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Toutes les décisions</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
          <select
            className="field"
            aria-label="Filtrer par résultat technique"
            value={technical}
            onChange={(event) => { setTechnical(event.target.value); setPage(1); }}
          >
            <option value="">Tous les résultats techniques</option>
            {Object.entries(technicalLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
          <input className="field" aria-label="Générées depuis" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
          <input className="field" aria-label="Générées jusqu’au" type="date" min={from || undefined} value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
          {user?.role === 'ADMIN' && (
            <select className="field" aria-label="Filtrer par agence" value={agencyId} onChange={(event) => { setAgencyId(event.target.value); setPage(1); }}>
              <option value="">Toutes les agences</option>
              {agencies.data?.map((agency) => <option value={agency.id} key={agency.id}>{agency.name}</option>)}
            </select>
          )}
        </div>
      </section>
      {recommendations.isLoading ? (
        <PageLoader />
      ) : recommendations.error ? (
        <ErrorState message={backendError(recommendations.error)} />
      ) : !recommendations.data?.results.length ? (
        <EmptyState
          title="Aucune recommandation"
          description="Modifiez les filtres ou demandez une première recommandation."
        />
      ) : (
        <RecommendationList
          recommendations={recommendations.data.results}
          vehicleMap={vehicleMap}
          onOpen={setSelected}
        />
      )}
      {recommendations.data && recommendations.data.count > 0 && (
        <Pagination
          page={page}
          count={recommendations.data.count}
          hasNext={Boolean(recommendations.data.next)}
          hasPrevious={Boolean(recommendations.data.previous)}
          onChange={setPage}
        />
      )}
      {creating && (
        <Modal title="Nouvelle recommandation" onClose={() => setCreating(false)}>
          <CreateRecommendationForm
            vehicles={vehicles.data || []}
            onDone={(recommendation) => {
              setCreating(false);
              setSelected(recommendation);
              void refresh();
            }}
          />
        </Modal>
      )}
      {selected && (
        <Modal title={`Recommandation ${selected.id.slice(0, 8)}`} onClose={() => setSelected(null)}>
          <RecommendationDetail
            recommendation={selected}
            vehicle={vehicleMap.get(selected.vehicle)}
            onUpdated={(updated) => {
              setSelected(updated);
              void refresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ShadowBanner() {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" role="status">
      <AlertTriangle className="mt-0.5 shrink-0" size={20} />
      <div>
        <strong>Mode expérimental — aucun prix n’est appliqué automatiquement</strong>
        <p className="mt-1 text-sm">Le prix facturé demeure celui du système Django actuel.</p>
      </div>
    </div>
  );
}

function RecommendationList({
  recommendations,
  vehicleMap,
  onOpen,
}: {
  recommendations: PricingRecommendation[];
  vehicleMap: Map<number, Vehicle>;
  onOpen: (recommendation: PricingRecommendation) => void;
}) {
  return (
    <div className="grid gap-4">
      {recommendations.map((item) => {
        const difference = pricingDifference(item.base_daily_price, item.recommended_daily_price);
        const vehicle = vehicleMap.get(item.vehicle);
        return (
          <article className="card" key={item.id}>
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
              <div>
                <p className="font-bold">{item.vehicle_label}</p>
                <p className="text-sm text-slate-500">
                  {cityLabels[vehicle?.location_city || ''] || vehicle?.owner_city || 'Ville non renseignée'} ·{' '}
                  {formatDate(item.start_date)} → {formatDate(item.end_date)} ({item.rental_days} jour(s))
                </p>
                <p className="mt-1 text-xs text-slate-400">Générée le {formatDateTime(item.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Actuel / recommandé par jour</p>
                <p className="font-semibold">
                  {formatCDFDecimal(item.base_daily_price)} →{' '}
                  <span className="text-brand-600">{formatCDFDecimal(item.recommended_daily_price)}</span>
                </p>
                <p className={`text-xs ${difference.direction === 'up' ? 'text-amber-600' : difference.direction === 'down' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {difference.amount} · {difference.percentage}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${statusClass(item.status)}`}>{statusLabels[item.status]}</span>
                <span className={`badge ${technicalClass(item.technical_status)}`}>{technicalLabels[item.technical_status]}</span>
              </div>
              <button className="btn-secondary" onClick={() => onOpen(item)} aria-label={`Ouvrir la recommandation ${item.id}`}>
                <Eye size={17} /> Détail
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CreateRecommendationForm({ vehicles, onDone }: { vehicles: Vehicle[]; onDone: (recommendation: PricingRecommendation) => void }) {
  const bookings = useQuery({ queryKey: ['bookings', 'pricing'], queryFn: dataService.bookings });
  const [vehicleId, setVehicleId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fieldError, setFieldError] = useState('');
  const clients = useQuery({
    queryKey: ['pricing-clients', clientPage, clientSearch],
    queryFn: () => pricingService.clients(clientPage, clientSearch),
    retry: false,
  });
  const create = useMutation({
    mutationFn: pricingService.create,
    onSuccess: (data) => {
      toast.success(data.technical_status === 'FALLBACK' ? 'Prix de secours enregistré' : 'Recommandation générée');
      onDone(data);
    },
    onError: (error) => setFieldError(backendError(error)),
  });
  const selectedBooking = bookings.data?.find((booking) => booking.id === Number(bookingId));
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === Number(vehicleId));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError('');
    if (!vehicleId) return setFieldError('Sélectionnez un véhicule.');
    const payload: PricingRecommendationRequest = { vehicle_id: Number(vehicleId) };
    if (selectedBooking) {
      payload.booking_id = selectedBooking.id;
    } else {
      if (!clientId || !startDate || !endDate) return setFieldError('Le client et les deux dates sont requis sans réservation.');
      try {
        inclusiveRentalDays(startDate, endDate);
      } catch (error) {
        return setFieldError(error instanceof Error ? error.message : 'Période invalide.');
      }
      payload.client_id = Number(clientId);
      payload.start_date = startDate;
      payload.end_date = endDate;
    }
    create.mutate(payload);
  };
  return (
    <form className="space-y-4" onSubmit={submit}>
      <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-200">
        La recommandation sera historisée à des fins d’évaluation uniquement.
      </p>
      <label className="label">Véhicule
        <select className="field mt-1" value={vehicleId} onChange={(event) => { setVehicleId(event.target.value); setBookingId(''); }} required>
          <option value="">Sélectionner…</option>
          {vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.brand} {vehicle.model} · {formatCDFDecimal(vehicle.daily_price)}/jour</option>)}
        </select>
      </label>
      <label className="label">Réservation existante (optionnelle)
        <select className="field mt-1" value={bookingId} onChange={(event) => {
          const id = event.target.value;
          setBookingId(id);
          const booking = bookings.data?.find((item) => item.id === Number(id));
          if (booking) setVehicleId(String(booking.vehicle));
        }} disabled={bookings.isLoading}>
          <option value="">Aucune — saisir le client et les dates</option>
          {bookings.data?.filter((booking) => !vehicleId || booking.vehicle === Number(vehicleId)).map((booking) => (
            <option value={booking.id} key={booking.id}>#{booking.id} · {booking.vehicle_detail.brand} {booking.vehicle_detail.model} · {formatDate(booking.start_date)} au {formatDate(booking.end_date)}</option>
          ))}
        </select>
      </label>
      {selectedBooking ? (
        <div className="rounded-xl border p-3 text-sm">
          Période reprise de la réservation : <strong>{formatDate(selectedBooking.start_date)} → {formatDate(selectedBooking.end_date)}</strong> ({selectedBooking.duration_days} jour(s)).
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="label">Rechercher un client autorisé
              <input
                className="field mt-1"
                type="search"
                value={clientSearch}
                onChange={(event) => { setClientSearch(event.target.value); setClientPage(1); setClientId(''); }}
                placeholder="Nom du client…"
              />
            </label>
            <label className="label">Client
              <select className="field mt-1" value={clientId} onChange={(event) => setClientId(event.target.value)} required disabled={clients.isLoading}>
                <option value="">Sélectionner…</option>
                {clients.data?.results.map((client) => <option value={client.id} key={client.id}>{client.display_name}</option>)}
              </select>
            </label>
            {clients.error && <p className="text-sm text-red-600">{backendError(clients.error)}</p>}
            {clients.data && (clients.data.next || clients.data.previous) && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{clients.data.count} client(s) · page {clientPage}</span>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary !p-2" type="button" disabled={!clients.data.previous} onClick={() => setClientPage((value) => value - 1)} aria-label="Clients précédents"><ChevronLeft size={16} /></button>
                  <button className="btn-secondary !p-2" type="button" disabled={!clients.data.next} onClick={() => setClientPage((value) => value + 1)} aria-label="Clients suivants"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
            <small className="text-slate-500">Seuls les clients déjà liés à l’agence sont proposés, sans coordonnées sensibles.</small>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">Date de début<input className="field mt-1" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label>
            <label className="label">Date de fin<input className="field mt-1" type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} required /></label>
          </div>
          {startDate && endDate && endDate >= startDate && <p className="text-sm text-slate-500">Durée inclusive : {inclusiveRentalDays(startDate, endDate)} jour(s).</p>}
        </>
      )}
      {selectedVehicle && <p className="text-sm">Prix journalier réel inchangé : <strong>{formatCDFDecimal(selectedVehicle.daily_price)}</strong></p>}
      {fieldError && <p className="text-sm text-red-600" role="alert">{fieldError}</p>}
      <button className="btn-primary w-full" disabled={create.isPending}>{create.isPending ? <><Spinner /> Calcul en cours…</> : <><BrainCircuit size={18} /> Demander la recommandation</>}</button>
    </form>
  );
}

function RecommendationDetail({ recommendation, vehicle, onUpdated }: { recommendation: PricingRecommendation; vehicle?: Vehicle; onUpdated: (recommendation: PricingRecommendation) => void }) {
  const [decision, setDecision] = useState<'MODIFY' | 'REJECT' | null>(null);
  const [manualPrice, setManualPrice] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: async (kind: 'ACCEPT' | 'MODIFY' | 'REJECT') => {
      if (kind === 'ACCEPT') return pricingService.accept(recommendation.id);
      if (reason.trim().length < 3) throw new Error('Une justification d’au moins 3 caractères est requise.');
      if (kind === 'MODIFY') {
        if (!manualPrice) throw new Error('Indiquez le prix proposé.');
        return pricingService.modify(recommendation.id, manualPrice, reason.trim());
      }
      return pricingService.reject(recommendation.id, reason.trim());
    },
    onSuccess: (updated) => {
      toast.success('Décision enregistrée en shadow mode');
      setDecision(null);
      onUpdated(updated);
    },
    onError: (caught) => setError(caught instanceof Error && !axios.isAxiosError(caught) ? caught.message : backendError(caught)),
  });
  const difference = pricingDifference(recommendation.base_daily_price, recommendation.recommended_daily_price);
  const canDecide = recommendation.status === 'PENDING' && recommendation.technical_status === 'SUCCESS';
  return (
    <div className="space-y-5">
      <ShadowBanner />
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <Detail label="Véhicule" value={recommendation.vehicle_label} />
        <Detail label="Ville de retrait" value={cityLabels[vehicle?.location_city || ''] || vehicle?.owner_city || 'Non renseignée'} />
        <Detail label="Période" value={`${formatDate(recommendation.start_date)} → ${formatDate(recommendation.end_date)} (${recommendation.rental_days} jour(s))`} />
        <Detail label="Génération" value={formatDateTime(recommendation.created_at)} />
        <Detail label="Prix journalier actuel" value={formatCDFDecimal(recommendation.base_daily_price)} />
        <Detail label="Prix recommandé" value={formatCDFDecimal(recommendation.recommended_daily_price)} />
        <Detail label="Différence" value={`${difference.amount} (${difference.percentage})`} />
        <Detail label="Version du modèle" value={recommendation.model_version || 'Non fournie'} />
        <Detail label="Statut de décision" value={statusLabels[recommendation.status]} />
        <Detail label="Résultat technique" value={technicalLabels[recommendation.technical_status]} />
      </dl>
      {recommendation.manually_proposed_daily_price && <div className="rounded-xl border p-3 text-sm">Prix proposé manuellement : <strong>{formatCDFDecimal(recommendation.manually_proposed_daily_price)}</strong></div>}
      {(recommendation.technical_status === 'FALLBACK' || recommendation.status === 'FALLBACK') && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800 dark:bg-violet-950/30 dark:text-violet-100">
          Service ML indisponible : le prix journalier actuel a été conservé comme prix de secours. Code : {recommendation.error_reason || 'fallback'}.
        </div>
      )}
      <section>
        <h3 className="font-semibold">Principaux facteurs explicatifs</h3>
        {recommendation.main_factors.length ? (
          <ul className="mt-2 space-y-2">{recommendation.main_factors.map((factor, index) => <Factor factor={factor} key={`${factor.nom || factor.name || 'factor'}-${index}`} />)}</ul>
        ) : <p className="mt-1 text-sm text-slate-500">Aucun facteur fourni.</p>}
      </section>
      {recommendation.decision_reason && <div><p className="text-sm font-semibold">Justification</p><p className="text-sm text-slate-600">{recommendation.decision_reason}</p></div>}
      {(recommendation.status === 'ACCEPTED' || recommendation.status === 'MODIFIED') && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
          Cette décision est enregistrée uniquement pour évaluation et ne modifie pas le prix facturé.
        </p>
      )}
      {!canDecide && recommendation.status !== 'PENDING' && <p className="text-sm text-slate-500">Cette recommandation est déjà décidée et ne peut plus recevoir une seconde décision.</p>}
      {canDecide && !decision && (
        <div className="grid gap-2 sm:grid-cols-3">
          <button className="btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate('ACCEPT')}><Check size={17} /> Accepter</button>
          <button className="btn-secondary" onClick={() => setDecision('MODIFY')}><RefreshCw size={17} /> Modifier</button>
          <button className="btn-secondary text-red-600" onClick={() => setDecision('REJECT')}><X size={17} /> Refuser</button>
        </div>
      )}
      {canDecide && decision && (
        <form className="space-y-3 rounded-xl border p-4" onSubmit={(event) => { event.preventDefault(); setError(''); mutation.mutate(decision); }}>
          {decision === 'MODIFY' && <label className="label">Nouveau prix journalier en CDF<input className="field mt-1" inputMode="decimal" pattern="\d+(?:[.,]\d{1,2})?" value={manualPrice} onChange={(event) => setManualPrice(event.target.value.replace(',', '.'))} required /></label>}
          <label className="label">Justification obligatoire<textarea className="field mt-1 min-h-24" minLength={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} required /></label>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <div className="flex flex-wrap gap-2"><button className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? <Spinner /> : 'Enregistrer la décision'}</button><button className="btn-secondary" type="button" onClick={() => { setDecision(null); setError(''); }}>Annuler</button></div>
        </form>
      )}
      {error && !decision && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}
function Factor({ factor }: { factor: PricingFactor }) {
  const name = factor.nom || factor.name || 'Facteur';
  const direction = factor.direction ? ` · ${factor.direction}` : '';
  const impact = factor.impact ?? factor.impact_usd;
  return <li className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><strong>{name.replaceAll('_', ' ')}</strong>{direction}{impact !== undefined ? ` · impact ${String(impact)}` : ''}</li>;
}
function Pagination({ page, count, hasNext, hasPrevious, onChange }: { page: number; count: number; hasNext: boolean; hasPrevious: boolean; onChange: (page: number) => void }) {
  return <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Pagination"><p className="text-sm text-slate-500">{count} recommandation(s) · page {page}</p><div className="flex gap-2"><button className="btn-secondary !p-2.5" disabled={!hasPrevious} onClick={() => onChange(page - 1)} aria-label="Page précédente"><ChevronLeft size={18} /></button><button className="btn-secondary !p-2.5" disabled={!hasNext} onClick={() => onChange(page + 1)} aria-label="Page suivante"><ChevronRight size={18} /></button></div></nav>;
}
function formatDate(value: string) { return new Intl.DateTimeFormat('fr-CD', { timeZone: 'Africa/Kinshasa', dateStyle: 'medium' }).format(new Date(`${value}T12:00:00+01:00`)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('fr-CD', { timeZone: 'Africa/Kinshasa', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }

// Explicit exports keep contract/error behavior directly testable without browser secrets.
export const pricingUiContract = { backendError, statusLabels, technicalLabels };

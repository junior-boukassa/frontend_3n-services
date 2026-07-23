import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  CreditCard,
  Info,
  WalletCards,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { apiError } from '../api/client';
import { ErrorState, PageLoader } from '../components/ui';
import { dataService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { Booking, Payment, PaymentMethod } from '../types';
import { formatCDF, formatCDFPerDay } from '../utils/format';

const schema = z
  .object({
    start_date: z.string().min(1, 'Date de début requise'),
    start_time: z.string().min(1, 'Heure de début requise'),
    end_date: z.string().min(1, 'Date de fin requise'),
    end_time: z.string().min(1, 'Heure de fin requise'),
  })
  .refine((v) => `${v.end_date}T${v.end_time}` > `${v.start_date}T${v.start_time}`, {
    path: ['end_date'],
    message: 'La fin doit être strictement après le début',
  });
type Dates = z.infer<typeof schema>;

const today = new Intl.DateTimeFormat('fr-CA', {
  timeZone: 'Africa/Kinshasa',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const steps = ['Dates', 'Détails', 'Paiement', 'Confirmation'];

function BookingSteps({ current }: { current: number }) {
  return (
    <ol className="mt-7 grid grid-cols-4 gap-2" aria-label="Étapes de réservation">
      {steps.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li className="min-w-0 text-center" key={label}>
            <div
              className={`mx-auto grid size-9 place-items-center rounded-full text-sm font-bold ${
                done || active
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
              }`}
            >
              {done ? <Check size={17} /> : number}
            </div>
            <p
              className={`mt-2 truncate text-[11px] sm:text-xs ${
                active ? 'font-bold text-brand-700' : 'text-slate-500'
              }`}
            >
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function VehicleBookingPage() {
  const { id } = useParams();
  const vehicleId = Number(id);
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedDates, setSelectedDates] = useState<Dates | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('MOBILE_MONEY');
  const [flowError, setFlowError] = useState('');
  const [busy, setBusy] = useState(false);

  const vehicle = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => dataService.vehicle(vehicleId).then((r) => r.data),
  });
  const {
    register,
    watch,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Dates>({ resolver: zodResolver(schema) });
  const [start, startTime, end, endTime] = watch([
    'start_date',
    'start_time',
    'end_date',
    'end_time',
  ]);
  const validPeriod = Boolean(
    start && startTime && end && endTime && `${end}T${endTime}` > `${start}T${startTime}`,
  );
  const days = useMemo(
    () =>
      validPeriod
        ? Math.max(
            1,
            Math.round(
              (new Date(`${end}T00:00:00`).getTime() -
                new Date(`${start}T00:00:00`).getTime()) /
                86400000,
            ) + 1,
          )
        : 0,
    [start, end, validPeriod],
  );

  const verifyDates = async (values: Dates) => {
    try {
      const availability = await dataService.availability(
        vehicleId,
        values.start_date,
        values.end_date,
        values.start_time,
        values.end_time,
      );
      if (!availability.available) {
        setError('root', { message: 'Ce véhicule est déjà réservé sur cette période.' });
        return;
      }
      setSelectedDates(values);
      setFlowError('');
      setStep(2);
    } catch (error) {
      setError('root', { message: apiError(error) });
    }
  };

  const createBooking = async () => {
    if (!selectedDates) return;
    setBusy(true);
    setFlowError('');
    try {
      const response = await dataService.createBooking({
        vehicle_id: vehicleId,
        ...selectedDates,
      });
      setBooking(response.data);
      setStep(3);
      await qc.invalidateQueries({ queryKey: ['bookings'] });
    } catch (error) {
      setFlowError(apiError(error));
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!booking) return;
    setBusy(true);
    setFlowError('');
    try {
      const created = await dataService.createPayment({
        booking_id: booking.id,
        method,
        amount: booking.total_price,
      });
      const confirmed = await dataService.confirmPayment(created.id);
      setPayment(confirmed);
      setBooking({ ...booking, status: 'CONFIRMED' });
      setStep(4);
      toast.success('Paiement confirmé. Votre réservation est validée.');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['bookings'] }),
        qc.invalidateQueries({ queryKey: ['booking', booking.id] }),
      ]);
    } catch (error) {
      setFlowError(apiError(error));
    } finally {
      setBusy(false);
    }
  };

  if (vehicle.isLoading) return <PageLoader />;
  if (vehicle.error) return <ErrorState message={apiError(vehicle.error)} />;
  const v = vehicle.data!;
  const estimatedTotal = days * Number(v.daily_price);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="inline-flex items-center gap-2 text-sm text-slate-500"
        to={`/vehicles/${v.id}`}
      >
        <ArrowLeft size={17} /> Retour au véhicule
      </Link>
      <BookingSteps current={step} />
      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_1.2fr]">
        <aside className="card h-fit">
          <div className="grid h-52 place-items-center rounded-2xl bg-brand-50 dark:bg-slate-800">
            {v.images[0]?.image ? (
              <img
                className="size-full rounded-2xl object-cover"
                src={v.images[0].image}
                alt={`${v.brand} ${v.model}`}
              />
            ) : (
              <Car size={65} className="text-brand-600/30" />
            )}
          </div>
          <h1 className="mt-5 text-2xl font-black">
            {v.brand} {v.model}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {v.agency_name?.trim() || 'Agence Three-N Services'} ·{' '}
            {v.owner_city || 'Ville non renseignée'}
          </p>
          <p className="mt-5 text-xl font-bold text-brand-600">
            {formatCDFPerDay(Number(v.daily_price))}
          </p>
        </aside>

        <section className="card">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold">Choisissez vos dates et heures</h2>
              <p className="mt-2 text-sm text-slate-500">
                La disponibilité sera vérifiée avant de continuer.
              </p>
              <form className="mt-7 space-y-5" onSubmit={handleSubmit(verifyDates)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="label">
                    Début
                    <input
                      className="field mt-1"
                      type="date"
                      min={today}
                      {...register('start_date')}
                    />
                    <small className="text-red-600">{errors.start_date?.message}</small>
                  </label>
                  <label className="label">
                    Heure de début
                    <input className="field mt-1" type="time" {...register('start_time')} />
                    <small className="text-red-600">{errors.start_time?.message}</small>
                  </label>
                  <label className="label">
                    Fin
                    <input
                      className="field mt-1"
                      type="date"
                      min={start || today}
                      {...register('end_date')}
                    />
                    <small className="text-red-600">{errors.end_date?.message}</small>
                  </label>
                  <label className="label">
                    Heure de fin
                    <input className="field mt-1" type="time" {...register('end_time')} />
                    <small className="text-red-600">{errors.end_time?.message}</small>
                  </label>
                </div>
                <Summary
                  dates={validPeriod ? { start_date: start, start_time: startTime, end_date: end, end_time: endTime } : null}
                  days={days}
                  total={estimatedTotal}
                />
                <div className="flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
                  <Info className="shrink-0" size={19} />
                  Le montant définitif sera calculé et validé par le serveur.
                </div>
                {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
                <button
                  className="btn-primary w-full !py-3.5"
                  disabled={isSubmitting || !validPeriod || !days}
                >
                  <CalendarDays size={18} />
                  {isSubmitting ? 'Vérification…' : 'Continuer vers les détails'}
                </button>
              </form>
            </>
          )}

          {step === 2 && selectedDates && (
            <>
              <h2 className="text-2xl font-bold">Confirmez les détails</h2>
              <p className="mt-2 text-sm text-slate-500">
                Vérifiez votre période et le montant avant de créer la réservation.
              </p>
              <div className="mt-7">
                <Summary dates={selectedDates} days={days} total={estimatedTotal} />
              </div>
              {flowError && <p className="mt-4 text-sm text-red-600">{flowError}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button className="btn-secondary" onClick={() => setStep(1)} disabled={busy}>
                  Modifier les dates
                </button>
                <button className="btn-primary" onClick={createBooking} disabled={busy}>
                  {busy ? 'Création…' : 'Confirmer et payer'}
                </button>
              </div>
            </>
          )}

          {step === 3 && booking && (
            <>
              <h2 className="text-2xl font-bold">Choisissez le paiement</h2>
              <p className="mt-2 text-sm text-slate-500">
                Montant à payer : <b>{formatCDF(Number(booking.total_price))}</b>
              </p>
              <div className="mt-7 grid gap-3">
                {[
                  ['MOBILE_MONEY', 'Mobile Money', 'M-Pesa, Airtel Money ou Orange Money'],
                  ['CARD', 'Carte bancaire', 'Visa ou Mastercard'],
                  ['CASH', 'Paiement en espèces', "Paiement auprès de l'agence"],
                ].map(([value, label, description]) => (
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 ${
                      method === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                    }`}
                    key={value}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={value}
                      checked={method === value}
                      onChange={() => setMethod(value as PaymentMethod)}
                    />
                    {value === 'CARD' ? <CreditCard /> : <WalletCards />}
                    <span>
                      <b className="block">{label}</b>
                      <small className="text-slate-500">{description}</small>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                Mode prototype : la confirmation du paiement est simulée. Aucun débit bancaire
                réel n’est effectué.
              </p>
              {flowError && <p className="mt-4 text-sm text-red-600">{flowError}</p>}
              <button className="btn-primary mt-6 w-full !py-3.5" onClick={pay} disabled={busy}>
                <CreditCard size={18} />
                {busy ? 'Confirmation du paiement…' : 'Confirmer le paiement'}
              </button>
            </>
          )}

          {step === 4 && booking && payment && (
            <div className="py-5 text-center">
              <CheckCircle2 className="mx-auto text-emerald-500" size={68} />
              <p className="mt-6 text-sm font-bold uppercase tracking-wider text-emerald-600">
                Paiement confirmé
              </p>
              <h2 className="mt-2 text-3xl font-black">Votre réservation est confirmée</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                La réservation #{booking.id} a bien été enregistrée. L’agence dispose maintenant
                de toutes les informations nécessaires.
              </p>
              <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left dark:bg-slate-800">
                <div className="flex justify-between gap-4">
                  <span>Montant payé</span>
                  <b>{formatCDF(Number(payment.amount))}</b>
                </div>
                <div className="mt-3 flex justify-between gap-4 border-t pt-3">
                  <span>Référence</span>
                  <b>{payment.transaction_reference}</b>
                </div>
              </div>
              <Link className="btn-primary mt-6 w-full" to={`/bookings/${booking.id}`}>
                Voir les détails de la réservation
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Summary({
  dates,
  days,
  total,
}: {
  dates: Dates | null;
  days: number;
  total: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
      {dates && (
        <p className="mb-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
          Du {new Date(`${dates.start_date}T${dates.start_time}`).toLocaleString('fr-CD')} au{' '}
          {new Date(`${dates.end_date}T${dates.end_time}`).toLocaleString('fr-CD')}
        </p>
      )}
      <div className="flex justify-between text-sm">
        <span>Durée estimée</span>
        <b>{days || 0} jour(s)</b>
      </div>
      <div className="mt-3 flex justify-between border-t pt-3">
        <span>Montant estimé</span>
        <b className="text-xl text-brand-600">{formatCDF(total)}</b>
      </div>
    </div>
  );
}

const badge = (s: string) =>
  s === 'PAID' || s === 'CONFIRMED' || s === 'COMPLETED'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'CANCELLED' || s === 'FAILED'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
const bookingStatusLabel: Record<Booking['status'], string> = {
  PENDING: 'En attente de paiement',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
};

export function BookingDetailPage() {
  const { id } = useParams();
  const bookingId = Number(id);
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => dataService.booking(bookingId),
  });
  const action = useMutation({
    mutationFn: (status: Booking['status']) => dataService.bookingStatus(bookingId, status),
    onSuccess: () => {
      toast.success('Réservation mise à jour');
      void qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  const b = q.data!;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link className="inline-flex items-center gap-2 text-sm text-slate-500" to="/app/bookings">
        <ArrowLeft size={17} /> Mes réservations
      </Link>
      <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold uppercase text-brand-600">Réservation #{b.id}</p>
          <h1 className="mt-2 text-3xl font-black">
            {b.vehicle_detail.brand} {b.vehicle_detail.model}
          </h1>
        </div>
        <span className={`badge ${badge(b.status)}`}>{bookingStatusLabel[b.status]}</span>
      </div>
      {b.status === 'CONFIRMED' && (
        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="shrink-0" />
          <p>
            <b>Réservation confirmée.</b> Votre paiement a été accepté et l’agence a été informée.
          </p>
        </div>
      )}
      <section className="card mt-7">
        <h2 className="font-bold">Détails de la location</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          {[
            ['Client', b.client_email],
            ['Agence', b.vehicle_detail.agency_name?.trim() || 'Agence Three-N Services'],
            [
              'Début',
              `${new Date(b.start_date).toLocaleDateString('fr-FR')} à ${b.start_time?.slice(0, 5) || 'heure non renseignée'}`,
            ],
            [
              'Fin',
              `${new Date(b.end_date).toLocaleDateString('fr-FR')} à ${b.end_time?.slice(0, 5) || 'heure non renseignée'}`,
            ],
            ['Durée', `${b.duration_days} jour(s)`],
            ['Montant', formatCDF(Number(b.total_price))],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="mt-1 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="mt-6 flex flex-wrap gap-3">
        {user?.role !== 'CLIENT' && b.status === 'PENDING' && (
          <button className="btn-primary" onClick={() => action.mutate('CONFIRMED')}>
            Confirmer
          </button>
        )}
        {user?.role !== 'CLIENT' && b.status === 'CONFIRMED' && (
          <button className="btn-primary" onClick={() => action.mutate('COMPLETED')}>
            Marquer comme terminée
          </button>
        )}
      </div>
    </main>
  );
}

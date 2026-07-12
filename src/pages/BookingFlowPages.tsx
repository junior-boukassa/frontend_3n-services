import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Car, CreditCard, Info } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { apiError } from '../api/client';
import { ErrorState, PageLoader } from '../components/ui';
import { dataService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { Booking, Payment } from '../types';
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
export function VehicleBookingPage() {
  const { id } = useParams();
  const vehicleId = Number(id);
  const nav = useNavigate();
  const qc = useQueryClient();
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
  const submit = async (v: Dates) => {
    try {
      const availability = await dataService.availability(
        vehicleId,
        v.start_date,
        v.end_date,
        v.start_time,
        v.end_time,
      );
      if (!availability.available) {
        setError('root', { message: 'Ce véhicule est déjà réservé sur cette période.' });
        return;
      }
      const response = await dataService.createBooking({ vehicle_id: vehicleId, ...v });
      toast.success('Réservation créée');
      await qc.invalidateQueries({ queryKey: ['bookings'] });
      nav(`/bookings/${response.data.id}`);
    } catch (error) {
      setError('root', { message: apiError(error) });
    }
  };
  if (vehicle.isLoading) return <PageLoader />;
  if (vehicle.error) return <ErrorState message={apiError(vehicle.error)} />;
  const v = vehicle.data!;
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        className="inline-flex items-center gap-2 text-sm text-slate-500"
        to={`/vehicles/${v.id}`}
      >
        <ArrowLeft size={17} /> Retour au véhicule
      </Link>
      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_1.2fr]">
        <aside className="card h-fit">
          <div className="grid h-52 place-items-center rounded-2xl bg-brand-50 dark:bg-slate-800">
            {v.images[0]?.image ? (
              <img
                className="size-full rounded-2xl object-cover"
                src={v.images[0].image}
                alt={v.model}
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
          <h2 className="text-2xl font-bold">Choisissez vos dates et heures</h2>
          <p className="mt-2 text-sm text-slate-500">
            La disponibilité sera vérifiée avant la création.
          </p>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit(submit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">
                Début
                <input className="field mt-1" type="date" min={today} {...register('start_date')} />
                <small className="text-red-600">{errors.start_date?.message}</small>
              </label>
              <label className="label">
                Heure de début
                <input className="field mt-1" type="time" required {...register('start_time')} />
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
                <input className="field mt-1" type="time" required {...register('end_time')} />
                <small className="text-red-600">{errors.end_time?.message}</small>
              </label>
            </div>
            {validPeriod && (
              <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
                Du {new Date(`${start}T${startTime}`).toLocaleString('fr-CD')} au{' '}
                {new Date(`${end}T${endTime}`).toLocaleString('fr-CD')}
              </p>
            )}
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
              <div className="flex justify-between text-sm">
                <span>Durée estimée</span>
                <b>{days || 0} jour(s)</b>
              </div>
              <div className="mt-3 flex justify-between border-t pt-3">
                <span>Montant estimé</span>
                <b className="text-xl text-brand-600">
                  {formatCDF(days * Number(v.daily_price))}
                </b>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
              <Info className="shrink-0" size={19} /> Le montant définitif est calculé et validé par
              le serveur.
            </div>
            {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
            <button
              className="btn-primary w-full !py-3.5"
              disabled={isSubmitting || !validPeriod || !days}
            >
              <CalendarDays size={18} />
              {isSubmitting ? 'Vérification…' : 'Confirmer la réservation'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
const badge = (s: string) =>
  s === 'PAID' || s === 'CONFIRMED' || s === 'COMPLETED'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'CANCELLED' || s === 'FAILED'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
export function BookingDetailPage() {
  const { id } = useParams();
  const bookingId = Number(id);
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => dataService.booking(bookingId),
  });
  const payments = useQuery({ queryKey: ['payments'], queryFn: dataService.payments });
  const action = useMutation({
    mutationFn: (status: Booking['status']) =>
      status === 'CANCELLED' && user?.role === 'CLIENT'
        ? dataService.cancelBooking(bookingId)
        : dataService.bookingStatus(bookingId, status),
    onSuccess: () => {
      toast.success('Réservation mise à jour');
      void qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  const b = q.data!;
  const payment = payments.data?.find((p) => p.booking === b.id);
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
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
        <span className={`badge ${badge(b.status)}`}>{b.status}</span>
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="font-bold">Détails de la location</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {[
              ['Client', b.client_email],
              ['Agence', b.vehicle_detail.agency_name?.trim() || 'Agence Three-N Services'],
              ['Début', `${new Date(b.start_date).toLocaleDateString('fr-FR')} à ${b.start_time?.slice(0, 5) || 'heure non renseignée'}`],
              ['Fin', `${new Date(b.end_date).toLocaleDateString('fr-FR')} à ${b.end_time?.slice(0, 5) || 'heure non renseignée'}`],
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
        <aside className="card h-fit">
          <h2 className="font-bold">Paiement</h2>
          {payment ? (
            <>
              <span className={`badge mt-4 ${badge(payment.status)}`}>{payment.status}</span>
              <Link className="btn-secondary mt-4 w-full" to={`/payments/${payment.id}`}>
                Voir le paiement
              </Link>
            </>
          ) : b.status !== 'CANCELLED' ? (
            <>
              <p className="mt-3 text-sm text-slate-500">Aucun paiement initialisé.</p>
              <Link className="btn-primary mt-4 w-full" to={`/bookings/${b.id}/payment`}>
                Procéder à la démo
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Réservation annulée.</p>
          )}
        </aside>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {user?.role === 'CLIENT' && b.status === 'PENDING' && (
          <button
            className="btn-secondary text-red-600"
            onClick={() => confirm('Annuler cette réservation ?') && action.mutate('CANCELLED')}
          >
            Annuler la réservation
          </button>
        )}
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
export function PaymentDemoPage() {
  const { id } = useParams();
  const bookingId = Number(id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const booking = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => dataService.booking(bookingId),
  });
  const [method, setMethod] = useState<Payment['method']>('MOBILE_MONEY');
  const create = useMutation({
    mutationFn: async () => {
      const b = booking.data!;
      const p = await dataService.createPayment({
        booking_id: b.id,
        method,
        amount: b.total_price,
      });
      return dataService.confirmPayment(p.data.id);
    },
    onSuccess: (r) => {
      toast.success('Paiement de démonstration confirmé');
      void qc.invalidateQueries({ queryKey: ['payments'] });
      nav(`/payments/${r.data.id}`);
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (booking.isLoading) return <PageLoader />;
  if (booking.error) return <ErrorState message={apiError(booking.error)} />;
  const b = booking.data!;
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Info /> Paiement de démonstration
        </h1>
        <p className="mt-2 text-sm">
          Aucune transaction bancaire réelle ne sera effectuée. Le backend simule uniquement le
          changement de statut.
        </p>
      </div>
      <section className="card mt-6">
        <h2 className="text-xl font-bold">Réservation #{b.id}</h2>
        <p className="mt-2 text-slate-500">
          {b.vehicle_detail.brand} {b.vehicle_detail.model}
        </p>
        <p className="mt-6 text-3xl font-black text-brand-600">
          {formatCDF(Number(b.total_price))}
        </p>
        <label className="label mt-6">
          Méthode indicative
          <select
            className="field mt-1"
            value={method}
            onChange={(e) => setMethod(e.target.value as Payment['method'])}
          >
            <option value="MOBILE_MONEY">Mobile Money — simulation</option>
            <option value="CARD">Carte — simulation</option>
            <option value="CASH">Espèces — simulation</option>
          </select>
        </label>
        <button
          className="btn-primary mt-5 w-full"
          disabled={create.isPending}
          onClick={() => create.mutate()}
        >
          <CreditCard size={18} />
          {create.isPending ? 'Confirmation…' : 'Confirmer le paiement de démonstration'}
        </button>
      </section>
    </main>
  );
}
export function PaymentDetailPage() {
  const { id } = useParams();
  const paymentId = Number(id);
  const q = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => dataService.payment(paymentId),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  const p = q.data!;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link className="text-sm text-slate-500" to="/app/payments">
        ← Tous les paiements
      </Link>
      <section className="card mt-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-slate-500">Paiement</p>
            <h1 className="text-3xl font-black">#{p.id}</h1>
          </div>
          <span className={`badge h-fit ${badge(p.status)}`}>{p.status}</span>
        </div>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          {[
            ['Réservation', `#${p.booking}`],
            ['Véhicule', p.booking_vehicle],
            ['Montant', formatCDF(Number(p.amount))],
            ['Méthode', p.method.replace('_', ' ')],
            ['Référence', p.transaction_reference || 'Non attribuée'],
            ['Date', new Date(p.created_at).toLocaleString('fr-FR')],
          ].map(([l, v]) => (
            <div key={l}>
              <dt className="text-xs text-slate-400">{l}</dt>
              <dd className="mt-1 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

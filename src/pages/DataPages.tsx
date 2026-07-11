import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Search, Star, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { apiError } from '../api/client';
import { EmptyState, ErrorState, Modal, PageLoader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services';
import type { Booking } from '../types';
import { formatCDF, formatCDFPerDay } from '../utils/format';

const statusLabel: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  PAID: 'Payé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
};
const badge = (s: string) =>
  s === 'PAID' || s === 'CONFIRMED' || s === 'COMPLETED'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'CANCELLED' || s === 'FAILED'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="card overflow-hidden !p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
            <tr>
              {headers.map((h) => (
                <th className="px-5 py-4" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50" key={i}>
                {r.map((c, j) => (
                  <td className="whitespace-nowrap px-5 py-4" key={j}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function BookingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const q = useQuery({ queryKey: ['bookings'], queryFn: dataService.bookings });
  const action = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Booking['status'] }) =>
      status === 'CANCELLED' && user?.role === 'CLIENT'
        ? dataService.cancelBooking(id)
        : dataService.bookingStatus(id, status),
    onSuccess: () => {
      toast.success('Réservation mise à jour');
      void qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {user?.role === 'CLIENT' && (
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus size={17} /> Nouvelle réservation
          </button>
        )}
      </div>
      {!q.data?.length ? (
        <EmptyState title="Aucune réservation" />
      ) : (
        <Table
          headers={['Réservation', 'Véhicule', 'Client', 'Période', 'Montant', 'Statut', 'Actions']}
          rows={q.data.map((b) => [
            <Link className="font-bold text-brand-600" to={`/bookings/${b.id}`}>
              #{b.id}
            </Link>,
            `${b.vehicle_detail.brand} ${b.vehicle_detail.model}`,
            b.client_email,
            <span>
              {new Date(b.start_date).toLocaleDateString('fr-FR')} →{' '}
              {new Date(b.end_date).toLocaleDateString('fr-FR')}
              <small className="block text-slate-400">{b.duration_days} jour(s)</small>
            </span>,
            formatCDF(Number(b.total_price)),
            <span className={`badge ${badge(b.status)}`}>{statusLabel[b.status]}</span>,
            <div className="flex gap-2">
              {user?.role === 'CLIENT' && b.status === 'PENDING' && (
                <button
                  className="btn-secondary !p-2 text-red-600"
                  title="Annuler"
                  onClick={() =>
                    confirm('Annuler cette réservation ?') &&
                    action.mutate({ id: b.id, status: 'CANCELLED' })
                  }
                >
                  <X size={16} />
                </button>
              )}
              {user?.role !== 'CLIENT' && b.status === 'PENDING' && (
                <button
                  className="btn-secondary !p-2 text-emerald-600"
                  title="Confirmer"
                  onClick={() => action.mutate({ id: b.id, status: 'CONFIRMED' })}
                >
                  <Check size={16} />
                </button>
              )}
              {user?.role !== 'CLIENT' && b.status === 'CONFIRMED' && (
                <button
                  className="btn-secondary !px-3"
                  onClick={() => action.mutate({ id: b.id, status: 'COMPLETED' })}
                >
                  Terminer
                </button>
              )}
            </div>,
          ])}
        />
      )}
      {creating && (
        <Modal title="Nouvelle réservation" onClose={() => setCreating(false)}>
          <BookingForm
            onDone={() => {
              setCreating(false);
              void qc.invalidateQueries({ queryKey: ['bookings'] });
            }}
          />
        </Modal>
      )}
    </div>
  );
}
const bookingSchema = z
  .object({
    vehicle_id: z.coerce.number().positive(),
    start_date: z.string().min(1, 'Requis'),
    end_date: z.string().min(1, 'Requis'),
  })
  .refine((v) => v.end_date >= v.start_date, {
    path: ['end_date'],
    message: 'La date de fin doit être après la date de début',
  });
type BookingFormData = z.infer<typeof bookingSchema>;
function BookingForm({ onDone }: { onDone: () => void }) {
  const vehicles = useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: () => dataService.vehicles({ available_only: 'true' }),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({ resolver: zodResolver(bookingSchema) });
  const submit = async (v: BookingFormData) => {
    try {
      await dataService.createBooking(v);
      toast.success('Réservation créée');
      onDone();
    } catch (error) {
      setError('root', { message: apiError(error) });
    }
  };
  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <label className="label">
        Véhicule
        <select className="field mt-1" {...register('vehicle_id')}>
          <option value="">Sélectionner…</option>
          {vehicles.data?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.model} · {formatCDFPerDay(Number(v.daily_price))}
            </option>
          ))}
        </select>
        <small className="text-red-600">{errors.vehicle_id?.message}</small>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">
          Date de début
          <input
            className="field mt-1"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            {...register('start_date')}
          />
          <small className="text-red-600">{errors.start_date?.message}</small>
        </label>
        <label className="label">
          Date de fin
          <input className="field mt-1" type="date" {...register('end_date')} />
          <small className="text-red-600">{errors.end_date?.message}</small>
        </label>
      </div>
      {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
      <button className="btn-primary w-full" disabled={isSubmitting || vehicles.isLoading}>
        {isSubmitting ? 'Vérification…' : 'Réserver'}
      </button>
    </form>
  );
}
export function PaymentsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['payments'], queryFn: dataService.payments });
  const confirmPayment = useMutation({
    mutationFn: dataService.confirmPayment,
    onSuccess: () => {
      toast.success('Paiement confirmé');
      void qc.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  if (!q.data?.length)
    return (
      <EmptyState
        title="Aucun paiement"
        description="Les paiements associés à vos réservations apparaîtront ici."
      />
    );
  return (
    <Table
      headers={['Référence', 'Réservation', 'Véhicule', 'Méthode', 'Montant', 'Statut', 'Action']}
      rows={q.data.map((p) => [
        <Link className="font-bold text-brand-600" to={`/payments/${p.id}`}>
          #{p.id}
        </Link>,
        <Link className="text-brand-600" to={`/bookings/${p.booking}`}>
          #{p.booking}
        </Link>,
        p.booking_vehicle,
        p.method.replace('_', ' '),
        formatCDF(Number(p.amount)),
        <span className={`badge ${badge(p.status)}`}>{statusLabel[p.status]}</span>,
        p.status === 'PENDING' ? (
          <button
            className="btn-primary !px-3 !py-2"
            onClick={() =>
              confirm('Confirmer ce paiement via le mécanisme prototype du backend ?') &&
              confirmPayment.mutate(p.id)
            }
          >
            Confirmer
          </button>
        ) : (
          '—'
        ),
      ])}
    />
  );
}
export function ReviewsPage() {
  const q = useQuery({ queryKey: ['reviews'], queryFn: dataService.reviews });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  if (!q.data?.length) return <EmptyState title="Aucun avis" />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {q.data.map((r) => (
        <article className="card" key={r.id}>
          <div className="flex items-center justify-between">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={17}
                  className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {new Date(r.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">{r.comment || 'Aucun commentaire.'}</p>
          <div className="mt-5 border-t pt-4 text-xs text-slate-500">
            {r.client_email} · Véhicule {r.vehicle_plate}
          </div>
        </article>
      ))}
    </div>
  );
}
export function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: ['users'], queryFn: dataService.users });
  const update = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      dataService.updateUser(id, { is_active: active }),
    onSuccess: () => {
      toast.success('Compte mis à jour');
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  const users = q.data?.filter((u) => u.email.toLowerCase().includes(search.toLowerCase())) || [];
  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input
          className="field pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur…"
        />
      </div>
      <Table
        headers={['Utilisateur', 'Rôle', 'Téléphone', 'Statut', 'Action']}
        rows={users.map((u) => [
          <span>
            <b>
              {u.first_name} {u.last_name}
            </b>
            <small className="block text-slate-500">{u.email}</small>
          </span>,
          u.role_display,
          u.phone || '—',
          <span
            className={`badge ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
          >
            {u.is_active ? 'Actif' : 'Suspendu'}
          </span>,
          <button
            className="btn-secondary !py-2"
            onClick={() => update.mutate({ id: u.id, active: !u.is_active })}
          >
            {u.is_active ? 'Suspendre' : 'Réactiver'}
          </button>,
        ])}
      />
    </div>
  );
}
export function LogsPage() {
  const q = useQuery({ queryKey: ['logs'], queryFn: dataService.logs });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  if (!q.data?.length) return <EmptyState title="Journal vide" />;
  return (
    <Table
      headers={['Date', 'Utilisateur', 'Module', 'Action', 'Description', 'Adresse IP']}
      rows={q.data.map((l) => [
        new Date(l.created_at).toLocaleString('fr-FR'),
        l.user_email || 'Système',
        l.module,
        l.action,
        l.description,
        l.ip_address || '—',
      ])}
    />
  );
}

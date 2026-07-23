import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { apiError } from '../api/client';
import { EmptyState, ErrorState, Modal, PageLoader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services';
import type { Booking, User } from '../types';
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
        <table className="min-w-[720px] w-full text-left text-sm">
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
      dataService.bookingStatus(id, status),
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
    start_time: z.string().min(1, 'Requis'),
    end_date: z.string().min(1, 'Requis'),
    end_time: z.string().min(1, 'Requis'),
  })
  .refine((v) => `${v.end_date}T${v.end_time}` > `${v.start_date}T${v.start_time}`, {
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
          Heure de début
          <input className="field mt-1" type="time" required {...register('start_time')} />
          <small className="text-red-600">{errors.start_time?.message}</small>
        </label>
        <label className="label">
          Date de fin
          <input className="field mt-1" type="date" {...register('end_date')} />
          <small className="text-red-600">{errors.end_date?.message}</small>
        </label>
        <label className="label">
          Heure de fin
          <input className="field mt-1" type="time" required {...register('end_time')} />
          <small className="text-red-600">{errors.end_time?.message}</small>
        </label>
      </div>
      {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
      <button className="btn-primary w-full" disabled={isSubmitting || vehicles.isLoading}>
        {isSubmitting ? 'Vérification…' : 'Réserver'}
      </button>
    </form>
  );
}
export function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [creatingAgency, setCreatingAgency] = useState(false);
  const {
    register: registerAgency,
    handleSubmit: handleAgencySubmit,
    reset: resetAgency,
    formState: { isSubmitting: isCreatingAgency },
  } = useForm<{
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    company_name: string;
  }>();
  const q = useQuery({ queryKey: ['users'], queryFn: dataService.users });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      dataService.updateUser(id, data),
    onSuccess: () => {
      toast.success('Compte mis à jour');
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const createAgency = useMutation({
    mutationFn: dataService.createAgency,
    onSuccess: () => {
      toast.success('Agence créée et validée');
      resetAgency();
      setCreatingAgency(false);
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const remove = useMutation({
    mutationFn: dataService.deleteUser,
    onSuccess: () => {
      toast.success('Compte supprimé');
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  const users = q.data?.filter((u) => u.email.toLowerCase().includes(search.toLowerCase())) || [];
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className="field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur…"
          />
        </div>
        <button className="btn-primary" onClick={() => setCreatingAgency(true)}>
          <Plus size={17} /> Créer une agence
        </button>
      </div>
      <Table
        headers={['Utilisateur', 'Rôle', 'Validation agence', 'Téléphone', 'Statut', 'Actions']}
        rows={users.map((u) => [
          <span>
            <b>
              {u.first_name} {u.last_name}
            </b>
            <small className="block text-slate-500">{u.email}</small>
          </span>,
          u.role_display,
          u.role === 'AGENCY' ? (
            <span
              className={`badge ${
                u.agency_approval_status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : u.agency_approval_status === 'REJECTED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {u.agency_approval_status_display}
            </span>
          ) : (
            '—'
          ),
          u.phone || '—',
          <span
            className={`badge ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
          >
            {u.is_active ? 'Actif' : 'Suspendu'}
          </span>,
          <div className="flex flex-wrap gap-2">
            {u.role === 'AGENCY' && u.agency_approval_status !== 'APPROVED' && (
              <button
                className="btn-primary !py-2"
                onClick={() =>
                  update.mutate({ id: u.id, data: { agency_approval_status: 'APPROVED' } })
                }
              >
                Valider
              </button>
            )}
            {u.role === 'AGENCY' && u.agency_approval_status !== 'REJECTED' && (
              <button
                className="btn-secondary !py-2 text-red-600"
                onClick={() =>
                  update.mutate({ id: u.id, data: { agency_approval_status: 'REJECTED' } })
                }
              >
                Refuser
              </button>
            )}
            <button
              className="btn-secondary !py-2"
              onClick={() => update.mutate({ id: u.id, data: { is_active: !u.is_active } })}
            >
              {u.is_active ? 'Bloquer' : 'Débloquer'}
            </button>
            <button
              className="btn-secondary !py-2 text-red-600"
              onClick={() => {
                if (window.confirm(`Supprimer définitivement le compte ${u.email} ?`)) {
                  remove.mutate(u.id);
                }
              }}
            >
              Supprimer
            </button>
          </div>,
        ])}
      />
      {creatingAgency && (
        <Modal title="Créer une agence" onClose={() => setCreatingAgency(false)}>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleAgencySubmit((data) => createAgency.mutate(data))}
          >
            <label className="label">
              Prénom
              <input className="field mt-1" required {...registerAgency('first_name')} />
            </label>
            <label className="label">
              Nom
              <input className="field mt-1" required {...registerAgency('last_name')} />
            </label>
            <label className="label sm:col-span-2">
              Nom de l’agence
              <input className="field mt-1" required {...registerAgency('company_name')} />
            </label>
            <label className="label sm:col-span-2">
              E-mail
              <input className="field mt-1" type="email" required {...registerAgency('email')} />
            </label>
            <label className="label">
              Téléphone
              <input className="field mt-1" {...registerAgency('phone')} />
            </label>
            <label className="label">
              Mot de passe initial
              <input
                className="field mt-1"
                type="password"
                minLength={8}
                required
                {...registerAgency('password')}
              />
            </label>
            <button
              className="btn-primary sm:col-span-2"
              disabled={isCreatingAgency || createAgency.isPending}
            >
              Créer et valider l’agence
            </button>
          </form>
        </Modal>
      )}
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

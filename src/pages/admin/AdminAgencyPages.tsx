import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Car,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Search,
  UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiError } from '../../api/client';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui';
import { dataService } from '../../services';
import type { Booking } from '../../types';
import { formatCDF } from '../../utils/format';

function useAdminAgencyData() {
  const users = useQuery({ queryKey: ['users'], queryFn: dataService.users });
  const vehicles = useQuery({ queryKey: ['vehicles'], queryFn: () => dataService.vehicles() });
  const bookings = useQuery({ queryKey: ['bookings'], queryFn: dataService.bookings });
  return { users, vehicles, bookings };
}

const bookingLabels: Record<Booking['status'], string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
};
const paymentLabels = {
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Carte bancaire',
  CASH: 'Espèces',
};

export function AdminAgenciesPage() {
  const [search, setSearch] = useState('');
  const { users, vehicles, bookings } = useAdminAgencyData();
  if (users.isLoading || vehicles.isLoading || bookings.isLoading) return <PageLoader />;
  const error = users.error || vehicles.error || bookings.error;
  if (error) return <ErrorState message={apiError(error)} />;

  const agencies = (users.data || []).filter(
    (user) =>
      user.role === 'AGENCY' &&
      `${user.profile.company_name} ${user.first_name} ${user.last_name} ${user.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
            Administration
          </p>
          <h2 className="mt-2 text-3xl font-black">Agences</h2>
          <p className="mt-2 text-slate-500">
            Consultez leurs coordonnées, véhicules, réservations reçues et paiements.
          </p>
        </div>
        <Link className="btn-primary" to="/app/users">
          Gérer les comptes
        </Link>
      </div>
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input
          className="field pl-10"
          placeholder="Rechercher une agence…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {!agencies.length ? (
        <EmptyState title="Aucune agence trouvée" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {agencies.map((agency) => {
            const agencyVehicles = (vehicles.data || []).filter((v) => v.owner === agency.id);
            const vehicleIds = new Set(agencyVehicles.map((v) => v.id));
            const received = (bookings.data || []).filter((b) => vehicleIds.has(b.vehicle));
            const paid = received.filter((b) => b.payments.some((p) => p.status === 'PAID'));
            return (
              <article className="card" key={agency.id}>
                <div className="flex items-start gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900">
                    <Building2 size={28} />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">
                      {agency.profile.company_name ||
                        `${agency.first_name} ${agency.last_name}`.trim() ||
                        agency.email}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{agency.email}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`badge ${
                      agency.agency_approval_status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {agency.agency_approval_status_display}
                  </span>
                  <span
                    className={`badge ${
                      agency.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {agency.is_active ? 'Active' : 'Bloquée'}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <Stat value={agencyVehicles.length} label="Véhicules" />
                  <Stat value={received.length} label="Réservations" />
                  <Stat value={paid.length} label="Paiements" />
                </div>
                <Link className="btn-primary mt-5 w-full" to={`/app/agencies/${agency.id}`}>
                  Voir tous les détails
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <b className="text-lg">{value}</b>
      <small className="block truncate text-slate-500">{label}</small>
    </div>
  );
}

export function AdminAgencyDetailPage() {
  const agencyId = Number(useParams().id);
  const { users, vehicles, bookings } = useAdminAgencyData();
  const agency = (users.data || []).find(
    (candidate) => candidate.id === agencyId && candidate.role === 'AGENCY',
  );
  const agencyVehicles = useMemo(
    () => (vehicles.data || []).filter((vehicle) => vehicle.owner === agencyId),
    [vehicles.data, agencyId],
  );
  const vehicleIds = useMemo(
    () => new Set(agencyVehicles.map((vehicle) => vehicle.id)),
    [agencyVehicles],
  );
  const received = useMemo(
    () => (bookings.data || []).filter((booking) => vehicleIds.has(booking.vehicle)),
    [bookings.data, vehicleIds],
  );

  if (users.isLoading || vehicles.isLoading || bookings.isLoading) return <PageLoader />;
  const error = users.error || vehicles.error || bookings.error;
  if (error) return <ErrorState message={apiError(error)} />;
  if (!agency) return <ErrorState message="Agence introuvable." />;

  const name =
    agency.profile.company_name ||
    `${agency.first_name} ${agency.last_name}`.trim() ||
    agency.email;
  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-2 text-sm text-slate-500" to="/app/agencies">
        <ArrowLeft size={17} /> Toutes les agences
      </Link>
      <section className="card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900">
            <Building2 size={32} />
          </span>
          <div className="flex-1">
            <h2 className="text-3xl font-black">{name}</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <Info icon={Mail} label="E-mail" value={agency.email} />
              <Info icon={Phone} label="Téléphone" value={agency.phone || 'Non renseigné'} />
              <Info
                icon={UserRound}
                label="Responsable"
                value={`${agency.first_name} ${agency.last_name}`.trim() || 'Non renseigné'}
              />
              <Info
                icon={MapPin}
                label="Adresse"
                value={
                  [agency.profile.address, agency.profile.city, agency.profile.country]
                    .filter(Boolean)
                    .join(', ') || 'Non renseignée'
                }
              />
            </div>
          </div>
          <Link className="btn-secondary" to="/app/users">
            Modifier le compte
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center gap-3">
          <Car className="text-brand-600" />
          <h3 className="text-2xl font-bold">Véhicules ({agencyVehicles.length})</h3>
        </div>
        {!agencyVehicles.length ? (
          <EmptyState title="Aucun véhicule" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agencyVehicles.map((vehicle) => (
              <article className="card flex gap-4" key={vehicle.id}>
                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {vehicle.images[0]?.image ? (
                    <img
                      className="size-full object-cover"
                      src={vehicle.images[0].image}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                    />
                  ) : (
                    <Car className="m-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold">
                    {vehicle.brand} {vehicle.model}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">{vehicle.registration_plate}</p>
                  <p className="mt-2 text-sm font-semibold text-brand-600">
                    {formatCDF(Number(vehicle.daily_price))} / jour
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center gap-3">
          <CalendarDays className="text-brand-600" />
          <h3 className="text-2xl font-bold">Réservations reçues ({received.length})</h3>
        </div>
        {!received.length ? (
          <EmptyState title="Aucune réservation reçue" />
        ) : (
          <div className="space-y-4">
            {received.map((booking) => (
              <BookingReceipt booking={booking} key={booking.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <Icon className="mt-0.5 shrink-0 text-brand-600" size={17} />
      <div>
        <small className="text-slate-500">{label}</small>
        <p className="break-words font-semibold">{value}</p>
      </div>
    </div>
  );
}

function BookingReceipt({ booking }: { booking: Booking }) {
  const payment = booking.payments.find((item) => item.status === 'PAID') || booking.payments[0];
  return (
    <article className="card">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <Link className="font-bold text-brand-600" to={`/bookings/${booking.id}`}>
            Réservation #{booking.id}
          </Link>
          <h4 className="mt-1 text-lg font-bold">
            {booking.vehicle_detail.brand} {booking.vehicle_detail.model}
          </h4>
        </div>
        <span
          className={`badge ${
            booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {bookingLabels[booking.status]}
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Info icon={UserRound} label="Client" value={booking.client_name || booking.client_email} />
        <Info icon={Mail} label="E-mail client" value={booking.client_email} />
        <Info icon={Phone} label="Téléphone client" value={booking.client_phone || 'Non renseigné'} />
        <Info
          icon={CalendarDays}
          label="Période"
          value={`${new Date(booking.start_date).toLocaleDateString('fr-FR')} → ${new Date(
            booking.end_date,
          ).toLocaleDateString('fr-FR')}`}
        />
      </div>
      <div className="mt-4 rounded-2xl border border-dashed p-4">
        <div className="flex items-center gap-2 font-bold">
          <ReceiptText size={18} className="text-brand-600" />
          Reçu et paiement
        </div>
        {payment ? (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-slate-500">Montant</dt>
              <dd className="font-bold">{formatCDF(Number(payment.amount))}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Méthode</dt>
              <dd className="font-bold">{paymentLabels[payment.method]}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Statut</dt>
              <dd className="font-bold">{payment.status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Référence du reçu</dt>
              <dd className="break-all font-bold">
                {payment.transaction_reference || 'En attente'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Aucun paiement enregistré.</p>
        )}
      </div>
    </article>
  );
}

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, Car, Clock3, DollarSign, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services';
import { apiError } from '../api/client';
import { ErrorState, PageLoader } from '../components/ui';
import { brandColors } from '../config/theme';
import { formatCDF } from '../utils/format';
const names: Record<string, string> = {
  total_users: 'Utilisateurs',
  agency_count: 'Agences',
  client_count: 'Clients',
  vehicle_count: 'Véhicules',
  booking_count: 'Réservations',
  total_revenue: 'Revenu total',
  payments_total_count: 'Paiements',
  suspended_users_count: 'Comptes suspendus',
  total_bookings: 'Réservations',
  active_bookings: 'Réservations actives',
  pending_bookings: 'En attente',
  confirmed_bookings: 'Confirmées',
  completed_bookings: 'Terminées',
  payments_count: 'Mes paiements',
  historical_bookings: 'Locations terminées',
  total_spent: 'Total dépensé',
  vehicles_available: 'Disponibles',
  vehicles_reserved: 'Réservés',
  revenue_generated: 'Revenu généré',
  bookings_received: 'Demandes reçues',
  payments_received: 'Paiements reçus',
  occupancy_rate: 'Taux d’occupation',
};
export function DashboardPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: () => dataService.dashboard(user!.role).then((r) => r.data),
    enabled: !!user,
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  const data = q.data || {};
  const cards = Object.entries(data)
    .filter(([k, v]) => names[k] && (typeof v === 'number' || typeof v === 'string'))
    .slice(0, 6);
  const chart =
    (data.bookings_by_month as { year: number; month: number; count: number }[] | undefined)?.map(
      (x) => ({ label: `${x.month}/${String(x.year).slice(2)}`, value: x.count }),
    ) || [];
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h2 className="mt-1 text-3xl font-bold">Bonjour, {user?.first_name || 'bienvenue'} 👋</h2>
          <p className="mt-2 text-slate-500">
            Voici ce qui se passe dans votre espace aujourd’hui.
          </p>
        </div>
        <a href="/app/vehicles" className="btn-primary">
          Explorer les véhicules <ArrowUpRight size={17} />
        </a>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([k, v], i) => {
          const I = [Users, Car, CalendarDays, DollarSign, Clock3, ArrowUpRight][i % 6];
          const percent = k.includes('rate')
            ? `${Math.round(Number(v) * 100)}%`
            : k.includes('revenue') || k.includes('spent')
              ? formatCDF(Number(v))
              : String(v);
          return (
            <div className="card" key={k}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{names[k]}</p>
                  <p className="mt-3 text-3xl font-bold">{percent}</p>
                </div>
                <span className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-900">
                  <I size={20} />
                </span>
              </div>
            </div>
          );
        })}
      </section>
      {chart.length > 0 && (
        <section className="card">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Activité des réservations</h3>
            <p className="text-sm text-slate-500">Volume mensuel sur les six derniers mois</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Réservations" fill={brandColors.primaryHover} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="font-bold">Actions rapides</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <a
              className="rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-100"
              href="/app/vehicles"
            >
              Voir le catalogue
            </a>
            <a
              className="rounded-xl bg-slate-50 p-4 text-sm font-semibold dark:bg-slate-800"
              href="/app/bookings"
            >
              Gérer les réservations
            </a>
            <a
              className="rounded-xl bg-slate-50 p-4 text-sm font-semibold dark:bg-slate-800"
              href="/app/profile"
            >
              Mettre à jour le profil
            </a>
          </div>
        </div>
        <div className="card bg-ink text-white">
          <p className="text-sm text-white/60">Besoin d’aide ?</p>
          <h3 className="mt-2 text-xl font-bold">Notre centre d’aide vous accompagne.</h3>
          <a className="mt-5 inline-flex text-sm font-semibold text-brand-500" href="/app/help">
            Consulter l’aide →
          </a>
        </div>
      </section>
    </div>
  );
}

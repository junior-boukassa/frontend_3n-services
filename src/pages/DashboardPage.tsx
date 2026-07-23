import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Car,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  Headphones,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiError } from '../api/client';
import { ErrorState, PageLoader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services';
import { formatCDF } from '../utils/format';

const names: Record<string, string> = {
  total_users: 'Utilisateurs',
  agency_count: 'Agences partenaires',
  client_count: 'Clients inscrits',
  vehicle_count: 'Véhicules',
  booking_count: 'Réservations',
  total_revenue: 'Revenu total',
  payments_total_count: 'Paiements',
  suspended_users_count: 'Comptes suspendus',
  total_bookings: 'Réservations',
  active_bookings: 'Locations actives',
  pending_bookings: 'En attente',
  confirmed_bookings: 'Confirmées',
  completed_bookings: 'Terminées',
  payments_count: 'Mes paiements',
  historical_bookings: 'Locations terminées',
  total_spent: 'Total dépensé',
  vehicles_available: 'Véhicules disponibles',
  vehicles_reserved: 'Véhicules réservés',
  revenue_generated: 'Revenu généré',
  bookings_received: 'Demandes reçues',
  payments_received: 'Paiements reçus',
  occupancy_rate: 'Taux d’occupation',
};

const icons = [Users, Building2, UserRoundCheck, Car, CalendarCheck2, CircleDollarSign];
const accents = [
  'from-blue-500/15 to-blue-500/5 text-blue-700 dark:text-blue-300',
  'from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-300',
  'from-cyan-500/15 to-cyan-500/5 text-cyan-700 dark:text-cyan-300',
  'from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300',
  'from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300',
  'from-indigo-500/15 to-indigo-500/5 text-indigo-700 dark:text-indigo-300',
];

export function DashboardPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: () => dataService.dashboard(user!.role).then((response) => response.data),
    enabled: !!user,
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;

  const data = q.data || {};
  const cards = Object.entries(data)
    .filter(([key, value]) => names[key] && (typeof value === 'number' || typeof value === 'string'))
    .slice(0, 6);
  const chart =
    (data.bookings_by_month as { year: number; month: number; count: number }[] | undefined)?.map(
      (item) => ({
        label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(
          new Date(item.year, item.month - 1),
        ),
        value: item.count,
      }),
    ) || [];
  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Pilotage global'
      : user?.role === 'AGENCY'
        ? 'Performance de votre agence'
        : 'Votre espace mobilité';

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-night-950 via-brand-900 to-brand-600 px-5 py-7 text-white shadow-2xl shadow-brand-900/15 sm:px-8 sm:py-9">
        <div className="absolute -right-20 -top-24 size-80 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute bottom-0 right-8 hidden opacity-10 lg:block">
          <ChartNoAxesCombined size={220} strokeWidth={1.2} />
        </div>
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-brand-100">
              <Sparkles size={14} /> {roleLabel}
            </div>
            <p className="mt-6 text-sm capitalize text-white/60">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Bonjour, {user?.first_name || 'bienvenue'}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
              Les indicateurs essentiels de votre activité, réunis dans une vue claire et
              actualisée.
            </p>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-900 shadow-lg transition hover:-translate-y-0.5"
            to={user?.role === 'ADMIN' ? '/app/agencies' : '/app/vehicles'}
          >
            {user?.role === 'ADMIN' ? 'Gérer les agences' : 'Voir les véhicules'}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([key, value], index) => {
          const Icon = icons[index % icons.length];
          const display = key.includes('rate')
            ? `${Math.round(Number(value) * 100)}%`
            : key.includes('revenue') || key.includes('spent')
              ? formatCDF(Number(value))
              : String(value);
          return (
            <article
              className="group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-night-800 sm:p-6"
              key={key}
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-70 ${accents[index]}`} />
              <div className="relative flex items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{names[key]}</p>
                  <p className="mt-4 text-3xl font-black tracking-tight text-ink dark:text-white">
                    {display}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <ShieldCheck size={14} /> Données actualisées
                  </p>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-sm backdrop-blur dark:bg-night-900/80">
                  <Icon size={22} />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.65fr_.75fr]">
        <article className="rounded-[1.5rem] border bg-white p-5 shadow-soft dark:bg-night-800 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">
                Tendances
              </p>
              <h3 className="mt-1 text-xl font-black">Activité des réservations</h3>
              <p className="mt-1 text-sm text-slate-500">Évolution mensuelle récente</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-500" /> Système opérationnel
            </span>
          </div>
          <div className="mt-7 h-64 sm:h-72">
            {chart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#146cff" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#146cff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#dfe5ef" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, border: '1px solid #dfe5ef' }}
                    cursor={{ stroke: '#146cff', strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Réservations"
                    stroke="#146cff"
                    strokeWidth={3}
                    fill="url(#dashboardArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed text-center text-slate-500">
                <div>
                  <CalendarDays className="mx-auto mb-3 opacity-40" size={36} />
                  <p className="font-semibold">Aucune activité pour le moment</p>
                  <p className="mt-1 text-sm">Les prochaines réservations apparaîtront ici.</p>
                </div>
              </div>
            )}
          </div>
        </article>

        <aside className="flex flex-col rounded-[1.5rem] bg-night-950 p-6 text-white shadow-xl sm:p-7">
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-500/20 text-brand-100">
            <Headphones size={23} />
          </div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-brand-200">
            Assistance 3N
          </p>
          <h3 className="mt-2 text-2xl font-black">Besoin d’un accompagnement ?</h3>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Consultez les réponses utiles ou contactez l’équipe depuis votre centre d’aide.
          </p>
          <Link
            className="mt-auto flex items-center justify-between border-t border-white/10 pt-6 text-sm font-bold text-brand-100"
            to="/app/help"
          >
            Ouvrir le centre d’aide <ArrowRight size={17} />
          </Link>
        </aside>
      </section>

      <section className="rounded-[1.5rem] border bg-white p-5 shadow-soft dark:bg-night-800 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">
              Accès directs
            </p>
            <h3 className="mt-1 text-xl font-black">Actions rapides</h3>
          </div>
          <Clock3 className="text-slate-300" />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ['/app/vehicles', Car, 'Catalogue', 'Consulter et gérer les véhicules'],
            ['/app/bookings', CalendarCheck2, 'Réservations', 'Suivre toutes les demandes'],
            ['/app/profile', UserRoundCheck, 'Mon profil', 'Actualiser vos informations'],
          ].map(([to, Icon, title, description]) => (
            <Link
              className="group flex items-center gap-4 rounded-2xl border bg-slate-50 p-4 transition hover:border-brand-200 hover:bg-brand-50 dark:bg-night-900 dark:hover:bg-brand-900"
              to={to as string}
              key={to as string}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm dark:bg-night-800">
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <b className="block">{title as string}</b>
                <small className="text-slate-500">{description as string}</small>
              </span>
              <ArrowRight
                className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600"
                size={17}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

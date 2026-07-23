import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Search, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiError } from '../../api/client';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui';
import { useSeo } from '../../components/public/PublicLayout';
import { VehicleCard } from '../../components/public/VehicleCard';
import { agencyService, publicReviewService } from '../../services';
export function AgenciesPage() {
  useSeo(
    'Agences de location | 3N Services',
    'Découvrez les agences de location actives sur 3N Services.',
  );
  const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: ['agencies'], queryFn: agencyService.list });
  const agencies = useMemo(
    () =>
      q.data?.filter((a) => `${a.name} ${a.city}`.toLowerCase().includes(search.toLowerCase())) ||
      [],
    [q.data, search],
  );
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Professionnels</p>
        <h1 className="mt-3 text-4xl font-black">Agences de location</h1>
        <p className="mt-3 text-slate-500">
          Explorez les flottes proposées par les agences actives de la plateforme.
        </p>
      </header>
      <div className="relative mt-8 max-w-lg">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input
          className="field pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou ville…"
        />
      </div>
      {q.isLoading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <AgencySkeleton key={n} />
          ))}
        </div>
      ) : q.error ? (
        <div className="mt-8">
          <ErrorState message={apiError(q.error)} />
        </div>
      ) : !agencies.length ? (
        <EmptyState title="Aucune agence trouvée" />
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {agencies.map((a) => (
            <article className="card" key={a.id}>
              <div className="flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-slate-800">
                  <Building2 size={28} />
                </span>
                <div>
                  <Link className="text-xl font-bold hover:text-brand-600" to={`/agencies/${a.id}`}>
                    {a.name}
                  </Link>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={14} />
                    {a.city || 'Ville non renseignée'}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <b>{a.vehicles_count}</b>
                  <small className="block text-slate-500">véhicule(s)</small>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <b className="flex items-center gap-1">
                    <Star size={15} className="fill-amber-400 text-amber-400" />
                    {a.average_rating?.toFixed(1) || '—'}
                  </b>
                  <small className="block text-slate-500">{a.reviews_count} avis</small>
                </div>
              </div>
              <Link className="btn-secondary mt-5 w-full" to={`/agencies/${a.id}`}>
                Consulter l’agence
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
export function AgencyDetailPage() {
  const { id } = useParams();
  const agencyId = Number(id);
  const q = useQuery({
    queryKey: ['agency', agencyId],
    queryFn: () => agencyService.detail(agencyId),
  });
  const reviews = useQuery({
    queryKey: ['public-reviews', 'agency', agencyId],
    queryFn: () => publicReviewService.list({ agency: agencyId }),
  });
  useSeo(
    q.data ? `${q.data.name} | 3N Services` : 'Agence de location | 3N Services',
    'Flotte, localisation et avis publics de cette agence.',
  );
  if (q.isLoading) return <PageLoader />;
  if (q.error)
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <ErrorState message={apiError(q.error)} />
      </main>
    );
  const a = q.data!;
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <Link className="text-sm text-slate-500" to="/agencies">
        ← Toutes les agences
      </Link>
      <header className="mt-7 flex flex-col gap-5 rounded-2xl bg-ink p-5 text-white sm:flex-row sm:items-center sm:rounded-3xl sm:p-8">
        <span className="grid size-20 place-items-center rounded-2xl bg-white/10">
          <Building2 size={38} />
        </span>
        <div>
          <h1 className="text-4xl font-black">{a.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-white/60">
            <MapPin size={16} />
            {[a.address, a.city, a.country].filter(Boolean).join(', ') ||
              'Localisation non renseignée'}
          </p>
        </div>
        <div className="sm:ml-auto">
          <p className="text-2xl font-bold">{a.vehicles_count}</p>
          <small className="text-white/60">véhicule(s)</small>
        </div>
        <div>
          <p className="flex items-center gap-1 text-2xl font-bold">
            <Star className="fill-amber-400 text-amber-400" />
            {a.average_rating?.toFixed(1) || '—'}
          </p>
          <small className="text-white/60">{a.reviews_count} avis</small>
        </div>
      </header>
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Véhicules disponibles</h2>
          <Link
            className="text-sm font-semibold text-brand-600"
            to={`/vehicles?q=${encodeURIComponent(a.name)}`}
          >
            Voir dans le catalogue →
          </Link>
        </div>
        {!a.available_vehicles?.length ? (
          <EmptyState title="Aucun véhicule disponible" />
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {a.available_vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Derniers avis</h2>
        {!reviews.data?.length ? (
          <EmptyState title="Aucun avis publié" />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.data.slice(0, 4).map((r) => (
              <article className="card" key={r.id}>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      size={16}
                      key={n}
                      className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6">{r.comment}</p>
                <p className="mt-4 text-xs text-slate-500">
                  {r.author_display_name} · {r.vehicle.brand} {r.vehicle.model}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
function AgencySkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-14 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="mt-6 h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
      <div className="mt-5 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

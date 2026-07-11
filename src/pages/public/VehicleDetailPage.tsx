import { ArrowLeft, CalendarDays, Car, Check, MapPin, Star } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiError } from '../../api/client';
import { ErrorState, PageLoader, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services';
import { useSeo } from '../../components/public/PublicLayout';
import { VehicleCard } from '../../components/public/VehicleCard';
import { isDemoMode } from '../../config/demo';
import { demoVehicleTerms } from '../../demo/demoVehicles';
export function VehicleDetailPage() {
  const { id } = useParams();
  const vehicleId = Number(id);
  const { user } = useAuth();
  const nav = useNavigate();
  const vehicle = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => dataService.vehicle(vehicleId).then((r) => r.data),
    enabled: Number.isFinite(vehicleId),
  });
  const reviews = useQuery({
    queryKey: ['public-reviews', vehicleId],
    queryFn: () => dataService.publicReviews(vehicleId),
    enabled: Number.isFinite(vehicleId),
  });
  const similar = useQuery({
    queryKey: ['public-vehicles'],
    queryFn: () => dataService.vehicles(),
  });
  useSeo(
    vehicle.data
      ? `${vehicle.data.brand} ${vehicle.data.model} — 3N Services`
      : 'Détail du véhicule — 3N Services',
    'Caractéristiques, disponibilité et avis du véhicule.',
  );
  if (vehicle.isLoading) return <PageLoader />;
  if (vehicle.error)
    return (
      <main className="mx-auto max-w-4xl px-6 py-20">
        <ErrorState message={apiError(vehicle.error)} />
        <Link className="btn-secondary mt-5" to="/vehicles">
          <ArrowLeft size={17} /> Retour au catalogue
        </Link>
      </main>
    );
  const v = vehicle.data!;
  const book = () => {
    const destination = `/vehicles/${v.id}/book`;
    if (!user) nav('/login', { state: { from: destination } });
    else if (user.role !== 'CLIENT') nav('/forbidden');
    else nav(destination);
  };
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600"
        to="/vehicles"
      >
        <ArrowLeft size={17} /> Retour au catalogue
      </Link>
      <div className="mt-7 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="grid h-[430px] place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-brand-50 dark:from-slate-800 dark:to-brand-900">
            {v.images?.[0] ? (
              <img
                className="size-full object-cover"
                src={v.images[0].image}
                alt={`${v.brand} ${v.model}`}
              />
            ) : (
              <Car size={110} className="text-brand-600/25" />
            )}
          </div>
          {v.images && v.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {v.images.slice(1, 5).map((img) => (
                <img
                  className="h-24 w-full rounded-xl object-cover"
                  src={img.image}
                  alt={img.caption || v.model}
                  key={img.id}
                />
              ))}
            </div>
          )}
        </section>
        <aside className="card h-fit lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <span
              className={`badge ${v.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
            >
              {v.status === 'AVAILABLE' ? 'Disponible' : v.status}
            </span>
            <span className="flex items-center gap-1 text-sm">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              {v.average_rating || '—'} ({v.review_count})
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-black">
            {v.brand} {v.model}
          </h1>
          <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={15} />
            {v.owner_city || 'Localisation non renseignée'} · {v.owner_email}
          </p>
          <p className="mt-7 text-3xl font-black text-[#FF9500]">
            {Number(v.daily_price).toLocaleString('fr-FR')}{' '}
            <small className="text-sm font-normal text-slate-500">{isDemoMode ? 'USD / jour' : 'FCFA / jour'}</small>
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {[
              [v.year || 'Non renseignée', 'Année'],
              [v.transmission ? (v.transmission === 'MANUAL' ? 'Manuelle' : 'Automatique') : 'Non renseignée', 'Transmission'],
              [v.fuel_type || 'Non renseigné', 'Carburant'],
              [v.color, 'Couleur'],
              [v.category || 'Non renseignée', 'Catégorie'],
              [v.seats ? `${v.seats} places` : 'Non renseigné', 'Capacité'],
            ].map(([value, label]) => (
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800" key={label}>
                <small className="text-slate-400">{label}</small>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <button
            className="btn-primary mt-6 w-full !py-3.5"
            disabled={v.status !== 'AVAILABLE'}
            onClick={book}
          >
            <CalendarDays size={18} />
            {v.status === 'AVAILABLE' ? 'Réserver ce véhicule' : 'Indisponible actuellement'}
          </button>
        </aside>
      </div>
      <section className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-bold">À propos de ce véhicule</h2>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            {v.description || 'Aucune description supplémentaire fournie par l’agence.'}
          </p>
          <h3 className="mt-7 font-bold">Équipements</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              [v.has_gps, 'GPS'],
              [v.has_baby_seat, 'Siège bébé'],
              [v.unlimited_mileage, 'Kilométrage illimité'],
            ]
              .filter(([ok]) => ok)
              .map(([, label]) => (
                <span className="badge bg-brand-50 text-brand-700" key={label as string}>
                  <Check size={13} />
                  {label as string}
                </span>
              ))}
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold">Conditions essentielles</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            {(isDemoMode ? demoVehicleTerms : ['Dates soumises à disponibilité réelle', 'Prix calculé par journée de location', 'Compte client requis pour réserver', 'Conditions finales confirmées par l’agence']).map((term) => <li key={term}>• {term}</li>)}
          </ul>
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Avis des clients</h2>
        {reviews.isLoading ? (
          <PageLoader />
        ) : !reviews.data?.length ? (
          <EmptyState title="Aucun avis pour ce véhicule" />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.data.map((r) => (
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
                <p className="mt-4 text-sm leading-6">{r.comment || 'Aucun commentaire.'}</p>
                <p className="mt-4 text-xs text-slate-500">
                  {r.client_first_name} · {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Véhicules similaires</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {similar.data
            ?.filter((x) => x.id !== v.id && (x.brand === v.brand || x.fuel_type === v.fuel_type))
            .slice(0, 3)
            .map((x) => (
              <VehicleCard key={x.id} vehicle={x} />
            ))}
        </div>
      </section>
    </main>
  );
}

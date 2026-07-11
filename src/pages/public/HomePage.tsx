import {
  ArrowRight,
  CalendarCheck,
  Car,
  CheckCircle2,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services';
import { VehicleCard, VehicleSkeleton } from '../../components/public/VehicleCard';
import { useSeo } from '../../components/public/PublicLayout';
import { isDemoMode } from '../../config/demo';
import { demoVehicles } from '../../demo/demoVehicles';
export function HomePage() {
  useSeo(
    '3N Services — Location de véhicules',
    'Trouvez et réservez un véhicule auprès d’agences professionnelles avec 3N Services.',
  );
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ['public-vehicles'],
    queryFn: () => dataService.vehicles({ available_only: 'true', ordering: '-created_at' }),
  });
  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-night-950 via-brand-900 to-brand-600 text-white">
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_78%_30%,var(--brand-glow),transparent_38%)]" />
        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div className="relative z-10">
            {isDemoMode && <span className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">Mode démonstration</span>}
            <p className="mb-5 text-sm font-bold uppercase tracking-[.25em] text-brand-100">
              La mobilité, simplement
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.08] sm:text-6xl">
              Trouvez le véhicule idéal pour tous vos déplacements
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
              Comparez les offres, vérifiez la disponibilité et réservez auprès d’agences de
              confiance depuis une seule plateforme.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary !px-6 !py-3.5" to="/vehicles">
                Rechercher un véhicule <ArrowRight size={18} />
              </Link>
              <Link
                className="btn-secondary !border-white/20 !bg-white/5 !px-6 !py-3.5 !text-white"
                to="/register"
              >
                Créer un compte
              </Link>
            </div>
          </div>
          <div className="relative z-10">
            {isDemoMode && <div className="relative mb-5 overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 shadow-2xl"><img className="aspect-[16/10] w-full object-cover" src={demoVehicles[0].images?.[0].image} alt="Toyota Noah blanc de démonstration"/><span className="absolute bottom-4 right-4 rounded-2xl bg-accent-500 px-4 py-2 font-black text-white">Dès 80 USD</span></div>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              navigate(`/vehicles?brand=${encodeURIComponent(String(fd.get('brand') || ''))}`);
            }}
            className="rounded-3xl bg-white p-6 text-ink shadow-2xl dark:bg-slate-900 dark:text-white"
          >
            <h2 className="text-xl font-bold">Recherche rapide</h2>
            <p className="mt-1 text-sm text-slate-500">Quel véhicule recherchez-vous ?</p>
            <label className="label mt-5">
              Marque ou modèle
              <input className="field mt-1" name="brand" placeholder="Ex. Toyota, SUV…" />
            </label>
            <button className="btn-primary mt-4 w-full">
              <Search size={18} /> Voir les véhicules disponibles
            </button>
          </form>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
              Disponibles maintenant
            </p>
            <h2 className="mt-2 text-3xl font-bold">Une sélection pour chaque trajet</h2>
          </div>
          <Link className="hidden font-semibold text-brand-600 sm:block" to="/vehicles">
            Tout le catalogue →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {q.isLoading
            ? [1, 2, 3].map((n) => <VehicleSkeleton key={n} />)
            : q.data?.slice(0, 3).map((v) => <VehicleCard vehicle={v} key={v.id} />)}
        </div>
      </section>
      <section className="bg-white py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
              Pourquoi 3N Services ?
            </p>
            <h2 className="mt-2 text-3xl font-bold">La location automobile en toute confiance</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [
                ShieldCheck,
                'Agences identifiées',
                'Consultez clairement le propriétaire et la localisation de chaque véhicule.',
              ],
              [
                CalendarCheck,
                'Disponibilité vérifiée',
                'Les conflits de dates sont contrôlés directement par notre API.',
              ],
              [
                Star,
                'Avis authentiques',
                'Seuls les clients ayant terminé une réservation peuvent publier un avis.',
              ],
            ].map(([Icon, title, text]) => (
              <div className="card" key={title as string}>
                <Icon className="text-brand-600" size={30} />
                <h3 className="mt-5 text-lg font-bold">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {[
            [Search, '1. Recherchez', 'Explorez les véhicules selon votre budget et vos besoins.'],
            [
              CalendarCheck,
              '2. Réservez',
              'Choisissez vos dates et obtenez immédiatement le montant estimé.',
            ],
            [
              CheckCircle2,
              '3. Prenez la route',
              'Suivez votre réservation et son paiement depuis votre espace.',
            ],
          ].map(([Icon, title, text]) => (
            <div className="flex gap-4" key={title as string}>
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-800">
                <Icon />
              </span>
              <div>
                <h3 className="font-bold">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text as string}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl bg-brand-700 px-8 py-12 text-center text-white">
          <Car className="mx-auto" size={42} />
          <h2 className="mt-5 text-3xl font-bold">Prêt à trouver votre prochain véhicule ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Parcourez les offres réellement disponibles et réservez en quelques étapes.
          </p>
          <Link className="btn mt-7 bg-white text-brand-700" to="/vehicles">
            Explorer le catalogue <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}

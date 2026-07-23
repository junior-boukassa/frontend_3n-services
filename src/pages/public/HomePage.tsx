import {
  ArrowRight,
  CalendarCheck,
  Car,
  CheckCircle2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services';
import { VehicleCard, VehicleSkeleton } from '../../components/public/VehicleCard';
import { useSeo } from '../../components/public/PublicLayout';
const partners = [
  { name: 'FlexPaie', logo: '/images/partners/flexpaie.png' },
  { name: 'PM', logo: '/images/partners/pm.jpeg' },
  { name: 'Naëlle Traiteur', logo: '/images/partners/naelle-traiteur.jpeg' },
  { name: 'Mboka Media', logo: '/images/partners/mboka-media.avif' },
];
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
        <img
          className="absolute inset-0 size-full object-cover object-center"
          src="/images/kinshasa-boulevard.jpeg"
          alt=""
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-night-950 via-night-950/90 to-brand-900/55" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_78%_30%,var(--brand-glow),transparent_38%)]" />
        <div className="relative mx-auto grid min-h-[560px] max-w-7xl items-center gap-10 px-4 py-14 sm:min-h-[640px] sm:px-6 sm:py-20 lg:grid-cols-2">
          <div className="relative z-10">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-brand-100 sm:mb-5 sm:text-sm sm:tracking-[.25em]">
              La mobilité, simplement
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] min-[420px]:text-5xl sm:text-6xl">
              Trouvez le véhicule idéal pour tous vos déplacements
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:mt-6 sm:text-lg sm:leading-8">
              Comparez les offres, vérifiez la disponibilité et réservez auprès d’agences de
              confiance depuis une seule plateforme.
            </p>
            <div className="mt-8 grid gap-3 min-[420px]:flex min-[420px]:flex-wrap">
              <Link className="btn-primary w-full !px-5 !py-3.5 min-[420px]:w-auto sm:!px-6" to="/vehicles">
                Rechercher un véhicule <ArrowRight size={18} />
              </Link>
              <Link
                className="btn-secondary w-full !border-white/20 !bg-white/5 !px-5 !py-3.5 !text-white min-[420px]:w-auto sm:!px-6"
                to="/register"
              >
                Créer un compte
              </Link>
            </div>
          </div>
          <div className="relative z-10">
            <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              navigate(`/vehicles?brand=${encodeURIComponent(String(fd.get('brand') || ''))}`);
            }}
            className="rounded-2xl bg-white p-4 text-ink shadow-2xl dark:bg-slate-900 dark:text-white sm:rounded-3xl sm:p-6"
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
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
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
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="grid overflow-hidden rounded-3xl bg-night-950 text-white shadow-2xl lg:grid-cols-[1.15fr_.85fr]">
          <div className="relative min-h-64 sm:min-h-80">
            <img
              className="absolute inset-0 size-full object-cover"
              src="/images/kinshasa-aerial.jpeg"
              alt="Vue aérienne de Kinshasa et de ses axes routiers"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night-950/55 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-night-950/50" />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-brand-200">
              Pensé pour Kinshasa
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Bougez librement dans toute la ville
            </h2>
            <p className="mt-4 leading-7 text-white/65">
              Du centre-ville aux communes périphériques, trouvez un véhicule adapté à vos
              rendez-vous, vos événements et vos voyages.
            </p>
            <Link className="btn-primary mt-6 w-fit" to="/vehicles">
              Voir les véhicules <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-white py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
                CheckCircle2,
                'Parcours guidé',
                'Les détails, le paiement et la confirmation sont présentés étape par étape.',
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
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
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
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="rounded-3xl bg-brand-700 px-4 py-10 text-center text-white sm:px-8 sm:py-12">
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
      <section className="border-t bg-white py-20 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
            Un réseau de confiance
          </p>
          <h2 className="mt-2 text-3xl font-bold">Nos partenaires</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Nous collaborons avec des organisations engagées pour proposer une mobilité fiable et
            accessible.
          </p>
          <div className="partner-marquee mt-10">
            <div className="partner-track">
              {[...partners, ...partners].map((partner, index) => (
                <div
                  className="flex h-32 w-56 shrink-0 items-center justify-center rounded-2xl border bg-white p-5 shadow-soft dark:bg-slate-800 sm:h-36 sm:w-64"
                  key={`${partner.name}-${index}`}
                  aria-hidden={index >= partners.length}
                >
                  <img
                    className="max-h-full max-w-full object-contain"
                    src={partner.logo}
                    alt={index < partners.length ? `Logo ${partner.name}` : ''}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

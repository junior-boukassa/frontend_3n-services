import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiError } from '../../api/client';
import { ErrorState, EmptyState } from '../../components/ui';
import { VehicleCard, VehicleSkeleton } from '../../components/public/VehicleCard';
import { useSeo } from '../../components/public/PublicLayout';
import { dataService } from '../../services';
const PAGE_SIZE = 9;
export function VehiclesPublicPage() {
  useSeo(
    'Véhicules disponibles — 3N Services',
    'Découvrez les véhicules disponibles, leurs prix et leurs caractéristiques.',
  );
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['public-vehicles'], queryFn: () => dataService.vehicles() });
  const filtered = useMemo(() => {
    const search = (params.get('q') || params.get('brand') || '').toLowerCase(),
      fuel = params.get('fuel') || '',
      transmission = params.get('transmission') || '',
      status = params.get('status') || '',
      category = params.get('category') || '',
      seats = Number(params.get('seats') || 0),
      min = Number(params.get('min') || 0),
      max = Number(params.get('max') || Infinity);
    const list = (q.data || []).filter(
      (v) =>
        (!search || `${v.brand} ${v.model} ${v.owner_city}`.toLowerCase().includes(search)) &&
        (!fuel || v.fuel_type === fuel) &&
        (!transmission || v.transmission === transmission) &&
        (!status || v.status === status) &&
        (!category || v.category === category) &&
        (!seats || (v.seats || 0) >= seats) &&
        Number(v.daily_price) >= min &&
        Number(v.daily_price) <= max,
    );
    const order = params.get('sort');
    return [...list].sort((a, b) =>
      order === 'price_asc'
        ? Number(a.daily_price) - Number(b.daily_price)
        : order === 'price_desc'
          ? Number(b.daily_price) - Number(a.daily_price)
          : (b.year || 0) - (a.year || 0),
    );
  }, [q.data, params]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
  };
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Catalogue</p>
        <h1 className="mt-2 text-4xl font-black">Trouvez votre prochain véhicule</h1>
        <p className="mt-3 text-slate-500">
          Comparez les offres chargées directement depuis les agences partenaires.
        </p>
      </header>
      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit">
          <h2 className="flex items-center gap-2 font-bold">
            <SlidersHorizontal size={18} /> Filtres
          </h2>
          <div className="mt-5 space-y-4">
            <label className="label">
              Recherche
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={17} />
                <input
                  className="field pl-9"
                  value={params.get('q') || params.get('brand') || ''}
                  onChange={(e) => update('q', e.target.value)}
                  placeholder="Marque, modèle, ville"
                />
              </div>
            </label>
            <Filter
              label="Catégorie"
              value={params.get('category') || ''}
              onChange={(v) => update('category', v)}
              options={[
                ['', 'Toutes'],
                ['CITY', 'Citadine'],
                ['SEDAN', 'Berline'],
                ['SUV', 'SUV'],
                ['VAN', 'Van'],
                ['PICKUP', 'Pick-up'],
                ['LUXURY', 'Luxe'],
              ]}
            />
            <label className="label">
              Places minimum
              <input
                className="field mt-1"
                type="number"
                min="1"
                max="20"
                value={params.get('seats') || ''}
                onChange={(e) => update('seats', e.target.value)}
              />
            </label>
            <Filter
              label="Carburant"
              value={params.get('fuel') || ''}
              onChange={(v) => update('fuel', v)}
              options={[
                ['', 'Tous'],
                ['PETROL', 'Essence'],
                ['DIESEL', 'Diesel'],
                ['ELECTRIC', 'Électrique'],
                ['HYBRID', 'Hybride'],
              ]}
            />
            <Filter
              label="Transmission"
              value={params.get('transmission') || ''}
              onChange={(v) => update('transmission', v)}
              options={[
                ['', 'Toutes'],
                ['MANUAL', 'Manuelle'],
                ['AUTOMATIC', 'Automatique'],
              ]}
            />
            <Filter
              label="Disponibilité"
              value={params.get('status') || ''}
              onChange={(v) => update('status', v)}
              options={[
                ['', 'Tous'],
                ['AVAILABLE', 'Disponible'],
                ['RESERVED', 'Réservé'],
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="label">
                Prix min
                <input
                  className="field mt-1"
                  type="number"
                  value={params.get('min') || ''}
                  onChange={(e) => update('min', e.target.value)}
                />
              </label>
              <label className="label">
                Prix max
                <input
                  className="field mt-1"
                  type="number"
                  value={params.get('max') || ''}
                  onChange={(e) => update('max', e.target.value)}
                />
              </label>
            </div>
          </div>
        </aside>
        <section>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <b className="text-ink dark:text-white">{filtered.length}</b> véhicule(s)
            </p>
            <select
              className="field w-auto"
              value={params.get('sort') || ''}
              onChange={(e) => update('sort', e.target.value)}
            >
              <option value="">Plus récents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>
          {q.isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <VehicleSkeleton key={n} />
              ))}
            </div>
          ) : q.error ? (
            <ErrorState message={apiError(q.error)} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Aucun véhicule ne correspond"
              description="Modifiez vos critères de recherche."
            />
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
              {pages > 1 && (
                <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <button
                      className={n === page ? 'btn-primary' : 'btn-secondary'}
                      onClick={() => setPage(n)}
                      key={n}
                    >
                      {n}
                    </button>
                  ))}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[][];
}) {
  return (
    <label className="label">
      {label}
      <select className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option value={v} key={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

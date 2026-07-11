import { Car, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../types';
import { isDemoMode } from '../../config/demo';
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="group overflow-hidden rounded-2xl border bg-white shadow-soft transition hover:-translate-y-1 dark:bg-slate-900">
      <Link
        to={`/vehicles/${vehicle.id}`}
        className="relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br from-slate-100 to-brand-50 dark:from-slate-800 dark:to-brand-900"
      >
        {vehicle.images?.[0] ? (
          <img
            className="size-full object-cover transition duration-500 group-hover:scale-105"
            src={vehicle.images[0].image}
            alt={`${vehicle.brand} ${vehicle.model}`}
          />
        ) : (
          <Car size={74} className="text-brand-600/30" />
        )}
        <span
          className={`badge absolute left-4 top-4 ${vehicle.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
        >
          {vehicle.status === 'AVAILABLE' ? 'Disponible' : vehicle.status}
        </span>
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link className="text-lg font-bold hover:text-brand-600" to={`/vehicles/${vehicle.id}`}>
              {vehicle.brand} {vehicle.model}
            </Link>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={13} />
              {vehicle.owner_city || 'Localisation non renseignée'}
            </p>
          </div>
          <p className="text-right text-lg font-black text-accent-500">
            {Number(vehicle.daily_price).toLocaleString('fr-FR')}
            <small className="block font-normal text-slate-400">{isDemoMode ? 'USD / jour' : 'FCFA / jour'}</small>
          </p>
        </div>
        <div className="mt-4 flex justify-between border-t pt-4 text-sm text-slate-500">
          <span>
            {vehicle.year || 'Année non renseignée'} · {vehicle.transmission ? (vehicle.transmission === 'MANUAL' ? 'Manuelle' : 'Automatique') : 'Transmission non renseignée'}
          </span>
          <span className="flex items-center gap-1">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            {vehicle.average_rating || '—'} ({vehicle.review_count})
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link className="btn-secondary" to={`/vehicles/${vehicle.id}`}>Détails</Link>
          <Link className="btn-primary" to={`/vehicles/${vehicle.id}/book`}>Réserver</Link>
        </div>
      </div>
    </article>
  );
}
export function VehicleSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border bg-white dark:bg-slate-900">
      <div className="h-52 bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-10 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

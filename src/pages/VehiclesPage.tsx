import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, MapPin, Plus, Search, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services';
import { apiError } from '../api/client';
import { EmptyState, ErrorState, Modal, PageLoader } from '../components/ui';
import { formatCDFPerDay } from '../utils/format';

export function VehiclesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const q = useQuery({ queryKey: ['vehicles'], queryFn: () => dataService.vehicles() });
  const vehicles = useMemo(
    () =>
      q.data?.filter((v) =>
        `${v.brand} ${v.model} ${v.registration_plate}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ) || [],
    [q.data, search],
  );
  const del = useMutation({
    mutationFn: dataService.deleteVehicle,
    onSuccess: () => {
      toast.success('Véhicule supprimé');
      void qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  const canWrite = user?.role === 'AGENCY' || user?.role === 'ADMIN';
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className="field pl-10"
            placeholder="Rechercher une marque, un modèle ou une plaque…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canWrite && (
          <button className="btn-primary" onClick={() => setModal(true)}>
            <Plus size={17} /> Ajouter
          </button>
        )}
      </div>
      {vehicles.length === 0 ? (
        <EmptyState title="Aucun véhicule trouvé" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => (
            <article
              className="group overflow-hidden rounded-2xl border bg-white shadow-soft dark:bg-slate-900"
              key={v.id}
            >
              <div className="relative grid h-44 place-items-center bg-gradient-to-br from-slate-100 to-brand-50 dark:from-slate-800 dark:to-brand-900">
                {v.images?.[0] ? (
                  <img
                    className="size-full object-cover"
                    src={v.images[0].image}
                    alt={`${v.brand} ${v.model}`}
                  />
                ) : (
                  <Car size={64} className="text-brand-600/35" />
                )}
                <span
                  className={`badge absolute left-4 top-4 ${v.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {v.status === 'AVAILABLE' ? 'Disponible' : v.status}
                </span>
                {canWrite && (user?.role === 'ADMIN' || v.owner === user?.id) && (
                  <button
                    onClick={() =>
                      confirm('Supprimer définitivement ce véhicule ?') && del.mutate(v.id)
                    }
                    className="absolute right-3 top-3 rounded-lg bg-white p-2 text-red-600 opacity-0 shadow group-hover:opacity-100"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      {v.brand} {v.model}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={13} />
                      {v.owner_city || 'Localisation non renseignée'}
                    </p>
                  </div>
                  <p className="font-bold text-brand-600">
                    {formatCDFPerDay(Number(v.daily_price))}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-slate-500">
                  <span>
                    {v.year} · {v.transmission === 'MANUAL' ? 'Manuelle' : 'Automatique'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={15} className="fill-amber-400 text-amber-400" />
                    {v.average_rating || '—'} ({v.review_count})
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {modal && (
        <Modal title="Ajouter un véhicule" onClose={() => setModal(false)}>
          <VehicleForm
            onDone={() => {
              setModal(false);
              void qc.invalidateQueries({ queryKey: ['vehicles'] });
            }}
          />
        </Modal>
      )}
    </div>
  );
}

const vehicleSchema = z.object({
  brand: z.string().min(1, 'Requis'),
  model: z.string().min(1, 'Requis'),
  year: z.coerce
    .number()
    .min(1950)
    .max(new Date().getFullYear() + 1),
  registration_plate: z.string().min(2, 'Requis'),
  color: z.string().min(1, 'Requis'),
  category: z.enum(['CITY', 'SEDAN', 'SUV', 'VAN', 'PICKUP', 'LUXURY']).optional(),
  seats: z.number().min(1).max(20).optional(),
  fuel_type: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  daily_price: z.coerce.number().positive('Prix invalide'),
  description: z.string(),
});
type VehicleFormData = z.infer<typeof vehicleSchema>;
function VehicleForm({ onDone }: { onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      fuel_type: 'PETROL',
      transmission: 'MANUAL',
      description: '',
      category: undefined,
      seats: undefined,
    },
  });
  const submit = async (v: VehicleFormData) => {
    try {
      await dataService.saveVehicle({
        ...v,
        daily_price: String(v.daily_price),
        status: 'AVAILABLE',
        has_gps: false,
        has_baby_seat: false,
        unlimited_mileage: false,
      });
      toast.success('Véhicule ajouté');
      onDone();
    } catch (error) {
      toast.error(apiError(error));
    }
  };
  const fields = [
    ['brand', 'Marque', 'text'],
    ['model', 'Modèle', 'text'],
    ['year', 'Année', 'number'],
    ['registration_plate', 'Immatriculation', 'text'],
    ['color', 'Couleur', 'text'],
    ['daily_price', 'Prix journalier', 'number'],
  ] as const;
  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
      {fields.map(([name, label, type]) => (
        <label className="label" key={name}>
          {label}
          <input className="field mt-1" type={type} {...register(name)} />
          <small className="text-red-600">{errors[name]?.message}</small>
        </label>
      ))}
      <label className="label">
        Catégorie
        <select className="field mt-1" {...register('category')}>
          <option value="">Non renseignée</option>
          <option value="CITY">Citadine</option>
          <option value="SEDAN">Berline</option>
          <option value="SUV">SUV</option>
          <option value="VAN">Van</option>
          <option value="PICKUP">Pick-up</option>
          <option value="LUXURY">Luxe</option>
        </select>
      </label>
      <label className="label">
        Places
        <input
          className="field mt-1"
          type="number"
          min="1"
          max="20"
          {...register('seats', {
            setValueAs: (value) => (value === '' ? undefined : Number(value)),
          })}
        />
        <small className="text-red-600">{errors.seats?.message}</small>
      </label>
      <label className="label">
        Carburant
        <select className="field mt-1" {...register('fuel_type')}>
          <option value="PETROL">Essence</option>
          <option value="DIESEL">Diesel</option>
          <option value="ELECTRIC">Électrique</option>
          <option value="HYBRID">Hybride</option>
        </select>
      </label>
      <label className="label">
        Transmission
        <select className="field mt-1" {...register('transmission')}>
          <option value="MANUAL">Manuelle</option>
          <option value="AUTOMATIC">Automatique</option>
        </select>
      </label>
      <label className="label sm:col-span-2">
        Description
        <textarea className="field mt-1" {...register('description')} />
      </label>
      <button className="btn-primary sm:col-span-2" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

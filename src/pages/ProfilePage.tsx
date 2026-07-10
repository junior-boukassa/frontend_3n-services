import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services';
const schema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string(),
  company_name: z.string(),
  address: z.string(),
  city: z.string(),
  postal_code: z.string(),
  country: z.string(),
});
type Form = z.infer<typeof schema>;
export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      company_name: user?.profile.company_name || '',
      address: user?.profile.address || '',
      city: user?.profile.city || '',
      postal_code: user?.profile.postal_code || '',
      country: user?.profile.country || '',
    },
  });
  const submit = async ({ company_name, address, city, postal_code, country, ...base }: Form) => {
    try {
      await authService.updateProfile({
        ...base,
        profile: { company_name, address, city, postal_code, country },
      });
      await refreshUser();
      toast.success('Profil mis à jour');
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  return (
    <div className="mx-auto max-w-3xl">
      <div className="card">
        <div className="mb-7 flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
            {user?.first_name?.[0] || user?.email[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-sm text-slate-500">
              {user?.email} · {user?.role_display}
            </p>
          </div>
        </div>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
          {(
            [
              ['first_name', 'Prénom'],
              ['last_name', 'Nom'],
              ['phone', 'Téléphone'],
              ['company_name', 'Entreprise'],
              ['address', 'Adresse'],
              ['city', 'Ville'],
              ['postal_code', 'Code postal'],
              ['country', 'Pays'],
            ] as const
          ).map(([n, l]) => (
            <label className={`label ${n === 'address' ? 'sm:col-span-2' : ''}`} key={n}>
              {l}
              <input className="field mt-1" {...register(n)} />
            </label>
          ))}
          <button className="btn-primary sm:col-span-2" disabled={isSubmitting}>
            Enregistrer les modifications
          </button>
        </form>
      </div>
    </div>
  );
}
export function HelpPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="card lg:col-span-2">
        <h2 className="text-2xl font-bold">Comment pouvons-nous vous aider ?</h2>
        <p className="mt-2 text-slate-500">
          Retrouvez les réponses aux questions fréquentes sur 3N Services.
        </p>
        <div className="mt-7 divide-y">
          {[
            [
              'Comment effectuer une réservation ?',
              'Choisissez un véhicule disponible puis indiquez vos dates. La disponibilité et le prix sont vérifiés par le serveur.',
            ],
            [
              'Comment suivre un paiement ?',
              'La page Paiements affiche l’état transmis par l’API pour chaque transaction.',
            ],
            [
              'Comment modifier mes informations ?',
              'Rendez-vous dans Mon profil depuis le menu utilisateur.',
            ],
            [
              'Qui peut gérer les véhicules ?',
              'Les rôles AGENCY gèrent leur propre flotte. Les administrateurs disposent d’un accès global.',
            ],
          ].map(([q, a]) => (
            <details className="py-4" key={q}>
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <aside className="card h-fit bg-brand-900 text-white">
        <p className="text-sm text-brand-100">Assistance</p>
        <h3 className="mt-2 text-xl font-bold">Un problème persiste ?</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Aucun endpoint de ticket support n’est disponible actuellement. Contactez directement
          votre administrateur.
        </p>
      </aside>
    </div>
  );
}
export function SettingsPage() {
  const passwordSchema = z
    .object({
      old_password: z.string().min(1, 'Requis'),
      new_password: z.string().min(8, '8 caractères minimum'),
      confirmation: z.string(),
    })
    .refine((v) => v.new_password === v.confirmation, {
      path: ['confirmation'],
      message: 'Les mots de passe diffèrent',
    });
  type PasswordForm = z.infer<typeof passwordSchema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const changePassword = async ({ old_password, new_password }: PasswordForm) => {
    try {
      await authService.changePassword({ old_password, new_password });
      reset();
      toast.success('Mot de passe mis à jour');
    } catch (error) {
      toast.error(apiError(error));
    }
  };
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card">
        <h2 className="text-lg font-bold">Sécurité du compte</h2>
        <p className="mt-2 text-sm text-slate-500">
          Modifiez votre mot de passe. La double authentification nécessite un endpoint
          supplémentaire.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(changePassword)}>
          <label className="label">
            Mot de passe actuel
            <input
              className="field mt-1"
              type="password"
              autoComplete="current-password"
              {...register('old_password')}
            />
            <small className="text-red-600">{errors.old_password?.message}</small>
          </label>
          <label className="label">
            Nouveau mot de passe
            <input
              className="field mt-1"
              type="password"
              autoComplete="new-password"
              {...register('new_password')}
            />
            <small className="text-red-600">{errors.new_password?.message}</small>
          </label>
          <label className="label">
            Confirmer le nouveau mot de passe
            <input
              className="field mt-1"
              type="password"
              autoComplete="new-password"
              {...register('confirmation')}
            />
            <small className="text-red-600">{errors.confirmation?.message}</small>
          </label>
          <button className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
      <div className="card">
        <h2 className="text-lg font-bold">Abonnement et facturation</h2>
        <p className="mt-2 text-sm text-slate-500">
          Le backend actuel gère les paiements de réservations, mais ne fournit ni plans SaaS, ni
          abonnements, ni factures. Ces fonctionnalités ne sont donc pas simulées.
        </p>
      </div>
    </div>
  );
}

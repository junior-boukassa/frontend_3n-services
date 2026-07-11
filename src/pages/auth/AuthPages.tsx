import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Eye, EyeOff, Receipt, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { apiError } from '../../api/client';
import { authService } from '../../services';
const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(8, '8 caractères minimum'),
});
type Login = z.infer<typeof loginSchema>;
function Shell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <main className="grid min-h-screen bg-white dark:bg-slate-950 lg:grid-cols-2">
      <section className="hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 font-bold">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-500">3N</span>3N
          SERVICES
        </div>
        <div className="my-auto max-w-lg">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[.25em] text-brand-500">
            L’avenir de la mobilité
          </p>
          <h2 className="text-5xl font-bold leading-tight">
            Votre flotte.
            <br />
            Votre liberté.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/60">
            Gérez vos véhicules, réservations et paiements depuis une expérience pensée pour aller à
            l’essentiel.
          </p>
          <div className="mt-12 flex gap-3">
            {[Car, UserRound, Receipt].map((I, i) => (
              <span key={i} className="grid size-12 place-items-center rounded-xl bg-white/10">
                <I />
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/40">© 2026 3N Services</p>
      </section>
      <section className="grid place-items-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-600 font-bold text-white">
              3N
            </span>
          </div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Login>({ resolver: zodResolver(loginSchema) });
  const submit = async (v: Login) => {
    try {
      await login(v.email, v.password);
      toast.success('Connexion réussie');
      nav((loc.state as { from?: string })?.from || '/app/dashboard', { replace: true });
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  return (
    <Shell title="Ravi de vous revoir" subtitle="Connectez-vous pour accéder à votre espace.">
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <div>
          <label className="label">Adresse e-mail</label>
          <input
            className="field"
            type="email"
            placeholder="vous@entreprise.com"
            {...register('email')}
          />
          <p className="mt-1 text-xs text-red-600">{errors.email?.message}</p>
        </div>
        <div>
          <div className="flex justify-between">
            <label className="label">Mot de passe</label>
            <Link className="text-sm text-brand-600" to="/forgot-password">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              className="field pr-11"
              type={show ? 'text' : 'password'}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-slate-400"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <p className="mt-1 text-xs text-red-600">{errors.password?.message}</p>
        </div>
        <button className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Nouveau sur 3N ?{' '}
        <Link to="/register" className="font-semibold text-brand-600">
          Créer un compte
        </Link>
      </p>
    </Shell>
  );
}
const registerSchema = loginSchema
  .extend({
    first_name: z.string().min(2, 'Requis'),
    last_name: z.string().min(2, 'Requis'),
    phone: z.string(),
    role: z.enum(['CLIENT', 'AGENCY']),
    company_name: z.string().optional(),
  })
  .refine((v) => v.role !== 'AGENCY' || !!v.company_name, {
    path: ['company_name'],
    message: 'Requis pour une agence',
  });
type Register = z.infer<typeof registerSchema>;
export function RegisterPage() {
  const nav = useNavigate();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Register>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CLIENT' },
  });
  const submit = async (v: Register) => {
    try {
      await authService.register(v);
      toast.success('Compte créé. Vous pouvez vous connecter.');
      nav('/login');
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  return (
    <Shell title="Créer votre espace" subtitle="Quelques informations et vous êtes prêt.">
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Prénom</label>
          <input className="field" {...register('first_name')} />
          <small className="text-red-600">{errors.first_name?.message}</small>
        </div>
        <div>
          <label className="label">Nom</label>
          <input className="field" {...register('last_name')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">E-mail</label>
          <input className="field" {...register('email')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Téléphone</label>
          <input className="field" {...register('phone')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Type de compte</label>
          <select className="field" {...register('role')}>
            <option value="CLIENT">Client</option>
            <option value="AGENCY">Agence / propriétaire</option>
          </select>
        </div>
        {watch('role') === 'AGENCY' && (
          <div className="sm:col-span-2">
            <label className="label">Nom de l’agence</label>
            <input className="field" {...register('company_name')} />
            <small className="text-red-600">{errors.company_name?.message}</small>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="label">Mot de passe</label>
          <input className="field" type="password" {...register('password')} />
          <small className="text-red-600">{errors.password?.message}</small>
        </div>
        <button className="btn-primary sm:col-span-2" disabled={isSubmitting}>
          Créer mon compte
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        Déjà inscrit ?{' '}
        <Link className="text-brand-600" to="/login">
          Se connecter
        </Link>
      </p>
    </Shell>
  );
}
export function ForgotPage() {
  return (
    <Shell title="Mot de passe oublié" subtitle="La récupération n’est pas encore disponible.">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        L’API ne fournit actuellement aucun endpoint d’envoi ou de réinitialisation. Contactez un
        administrateur pour récupérer l’accès à votre compte.
      </div>
      <Link className="btn-primary mt-5 w-full" to="/login">
        Retour à la connexion
      </Link>
    </Shell>
  );
}

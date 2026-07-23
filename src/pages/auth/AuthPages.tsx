import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { apiError } from '../../api/client';
import { authService } from '../../services';
import { BrandLogo } from '../../components/BrandLogo';
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
    <main className="grid min-h-screen bg-slate-50 dark:bg-night-950 lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden text-white lg:flex lg:flex-col">
        <img
          className="absolute inset-0 size-full object-cover"
          src="/images/kinshasa-boulevard.jpeg"
          alt=""
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-night-950 via-night-950/95 to-brand-900/75" />
        <div className="absolute -bottom-24 -right-20 size-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex h-full flex-1 flex-col p-10 xl:p-14">
          <Link to="/" className="w-fit" aria-label="Retour à l’accueil">
            <BrandLogo className="h-20 w-48 rounded-2xl shadow-2xl" />
          </Link>
          <div className="my-auto max-w-xl py-14">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.2em] text-brand-100 backdrop-blur">
              <Sparkles size={14} /> La mobilité, maîtrisée
            </p>
            <h2 className="text-5xl font-black leading-[1.08] xl:text-6xl">
              Pilotez chaque trajet en toute confiance.
            </h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-white/65">
              Véhicules, réservations et paiements réunis dans une expérience claire, sécurisée et
              pensée pour Kinshasa.
            </p>
            <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
              {[
                [ShieldCheck, 'Accès sécurisé'],
                [CheckCircle2, 'Suivi en temps réel'],
              ].map(([Icon, label]) => (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                  key={label as string}
                >
                  <Icon className="text-brand-200" size={21} />
                  <span className="text-sm font-bold">{label as string}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Three-N Services · Mobilité simplifiée
          </p>
        </div>
      </section>
      <section className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-8 sm:p-8">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-900/30" />
        <div className="relative w-full max-w-lg">
          <Link className="mb-8 block w-fit lg:hidden" to="/">
            <BrandLogo className="h-16 w-40 rounded-xl shadow-soft" />
          </Link>
          <div className="rounded-[2rem] border bg-white p-6 shadow-2xl shadow-brand-900/10 dark:bg-night-800 sm:p-9">
            <div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-100">
              <LockKeyhole size={22} />
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">
            Connexion protégée · Vos données restent confidentielles
          </p>
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
          <label className="label" htmlFor="login-email">Adresse e-mail</label>
          <input
            id="login-email"
            className="field w-full !py-3"
            type="email"
            placeholder="vous@entreprise.com"
            {...register('email')}
          />
          <p className="mt-1 text-xs text-red-600">{errors.email?.message}</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="label" htmlFor="login-password">Mot de passe</label>
            <Link className="text-sm text-brand-600" to="/forgot-password">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              className="field w-full !py-3 pr-11"
              type={show ? 'text' : 'password'}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-400"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <p className="mt-1 text-xs text-red-600">{errors.password?.message}</p>
        </div>
        <button className="btn-primary w-full !py-3.5" disabled={isSubmitting}>
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
      toast.success(
        v.role === 'AGENCY'
          ? "Compte créé. L'administrateur doit valider votre agence avant toute publication."
          : 'Compte créé. Vous pouvez vous connecter.',
      );
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

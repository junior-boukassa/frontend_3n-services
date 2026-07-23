import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Send } from 'lucide-react';
import { apiError, apiFieldErrors } from '../../api/client';
import { useSeo } from '../../components/public/PublicLayout';
import { contactService } from '../../services';
const schema = z.object({
  name: z.string().trim().min(2, 'Nom requis').max(150),
  email: z.string().email('E-mail invalide'),
  phone: z.string().max(32).optional(),
  subject: z.string().trim().min(3, 'Sujet requis').max(200),
  message: z.string().trim().min(20, '20 caractères minimum').max(5000, '5 000 caractères maximum'),
});
type Form = z.infer<typeof schema>;
export function ContactPage() {
  useSeo('Contactez 3N Services', 'Envoyez un message à l’équipe 3N Services.');
  const [success, setSuccess] = useState<{ message: string; reference: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  const submit = async (data: Form) => {
    setSuccess(null);
    try {
      const result = await contactService.send(data);
      setSuccess(result);
      reset();
    } catch (error) {
      const fields = apiFieldErrors(error);
      for (const [name, message] of Object.entries(fields)) {
        if (name in schema.shape) setError(name as keyof Form, { message });
      }
      setError('root', { message: apiError(error) });
    }
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Contact</p>
        <h1 className="mt-3 text-4xl font-black">Comment pouvons-nous vous aider ?</h1>
        <p className="mt-3 text-slate-500">
          Décrivez votre demande. Notre équipe pourra la suivre grâce à une référence unique.
        </p>
      </header>
      <div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.5fr]">
        <aside className="card h-fit bg-ink text-white">
          <h2 className="text-xl font-bold">Avant d’écrire</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Pour une réservation existante, indiquez sa référence dans le sujet. Ne transmettez
            jamais de mot de passe, token ou information bancaire.
          </p>
        </aside>
        <form className="card grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
          {(
            [
              ['name', 'Nom complet'],
              ['email', 'Adresse e-mail'],
              ['phone', 'Téléphone (facultatif)'],
              ['subject', 'Sujet'],
            ] as const
          ).map(([n, l]) => (
            <label className="label" key={n}>
              {l}
              <input className="field mt-1" {...register(n)} />
              <small className="text-red-600">{errors[n]?.message}</small>
            </label>
          ))}
          <label className="label sm:col-span-2">
            Message
            <textarea className="field mt-1 min-h-40" {...register('message')} />
            <small className="text-red-600">{errors.message?.message}</small>
          </label>
          {errors.root && (
            <p className="text-sm text-red-600 sm:col-span-2">{errors.root.message}</p>
          )}
          {success && (
            <div className="flex gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 sm:col-span-2">
              <CheckCircle2 className="shrink-0" />
              <div>
                <b>{success.message}</b>
                <p className="mt-1 text-sm">Référence : {success.reference}</p>
              </div>
            </div>
          )}
          <button className="btn-primary sm:col-span-2" disabled={isSubmitting}>
            <Send size={17} />
            {isSubmitting ? 'Envoi…' : 'Envoyer le message'}
          </button>
        </form>
      </div>
    </main>
  );
}

import { Link } from 'react-router-dom';
import { Ban, ServerCrash, SearchX } from 'lucide-react';
function Status({
  code,
  title,
  text,
  Icon,
}: {
  code: string;
  title: string;
  text: string;
  Icon: typeof Ban;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-cream p-6 dark:bg-slate-950">
      <div className="max-w-md text-center">
        <Icon className="mx-auto text-brand-600" size={52} />
        <p className="mt-7 text-sm font-bold tracking-[.3em] text-brand-600">ERREUR {code}</p>
        <h1 className="mt-3 text-4xl font-bold">{title}</h1>
        <p className="mt-4 text-slate-500">{text}</p>
        <Link className="btn-primary mt-7" to="/app/dashboard">
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
export const NotFoundPage = () => (
  <Status
    code="404"
    title="Page introuvable"
    text="La page demandée n’existe pas ou a été déplacée."
    Icon={SearchX}
  />
);
export const ForbiddenPage = () => (
  <Status
    code="403"
    title="Accès interdit"
    text="Votre rôle ne vous autorise pas à consulter cette page."
    Icon={Ban}
  />
);
export const ServerErrorPage = () => (
  <Status
    code="500"
    title="Service indisponible"
    text="Le serveur rencontre un problème. Réessayez dans quelques instants."
    Icon={ServerCrash}
  />
);

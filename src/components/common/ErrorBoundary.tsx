import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; chunk: boolean }
> {
  state = { failed: false, chunk: false };
  static getDerivedStateFromError(error: Error) {
    return { failed: true, chunk: /chunk|dynamically imported|module script/i.test(error.message) };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Erreur React non gérée', error, info);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-cream p-6 dark:bg-slate-950">
        <section className="max-w-md text-center">
          <TriangleAlert className="mx-auto text-red-500" size={52} />
          <h1 className="mt-6 text-3xl font-bold">
            {this.state.chunk ? 'Mise à jour disponible' : 'Une erreur est survenue'}
          </h1>
          <p className="mt-3 text-slate-500">
            {this.state.chunk
              ? 'Une nouvelle version a été publiée. Rechargez la page pour continuer.'
              : 'Cette page n’a pas pu être affichée. Vos données ne sont pas affectées.'}
          </p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>
            <RefreshCw size={17} /> Recharger l’application
          </button>
        </section>
      </main>
    );
  }
}

import { LoaderCircle, Inbox, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
export function Spinner() {
  return <LoaderCircle className="animate-spin" size={20} />;
}
export function PageLoader() {
  return (
    <div className="grid min-h-[45vh] place-items-center">
      <Spinner />
    </div>
  );
}
export function EmptyState({
  title = 'Aucune donnée',
  description = 'Les éléments apparaîtront ici dès qu’ils seront disponibles.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="py-14 text-center">
      <Inbox className="mx-auto mb-3 text-slate-300" />
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="card flex items-center gap-3 border-red-200 text-red-700">
      <TriangleAlert />
      {message}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="btn-secondary !px-3" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { apiError } from '../../api/client';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui';
import { contactService } from '../../services';
import type { ContactStatus } from '../../types';
const labels: Record<ContactStatus, string> = {
  NEW: 'Nouveau',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  SPAM: 'Indésirable',
};
const badge = (s: ContactStatus) =>
  s === 'RESOLVED'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'SPAM'
      ? 'bg-red-100 text-red-700'
      : s === 'IN_PROGRESS'
        ? 'bg-brand-100 text-brand-700'
        : 'bg-amber-100 text-amber-700';
export function ContactMessagesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const q = useQuery({ queryKey: ['contact-messages'], queryFn: contactService.list });
  const messages = useMemo(
    () =>
      q.data?.filter(
        (m) =>
          (!status || m.status === status) &&
          `${m.reference} ${m.name} ${m.email} ${m.subject}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ) || [],
    [q.data, search, status],
  );
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className="field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Référence, nom, e-mail ou sujet…"
          />
        </div>
        <select
          className="field sm:w-52"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(labels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {!messages.length ? (
        <EmptyState title="Aucun message" />
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                <tr>
                  {['Référence', 'Demandeur', 'Sujet', 'Statut', 'Reçu le'].map((h) => (
                    <th className="px-5 py-4" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-4">
                      <Link
                        className="font-semibold text-brand-600"
                        to={`/admin/contact-messages/${m.id}`}
                      >
                        {m.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <b>{m.name}</b>
                      <small className="block text-slate-500">{m.email}</small>
                    </td>
                    <td className="px-5 py-4">{m.subject}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${badge(m.status)}`}>{labels[m.status]}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {new Date(m.created_at).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export function ContactMessageDetailPage() {
  const { id } = useParams();
  const messageId = Number(id);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['contact-message', messageId],
    queryFn: () => contactService.detail(messageId),
  });
  const update = useMutation({
    mutationFn: (status: ContactStatus) => contactService.updateStatus(messageId, status),
    onSuccess: () => {
      toast.success('Statut mis à jour');
      void qc.invalidateQueries({ queryKey: ['contact-message', messageId] });
      void qc.invalidateQueries({ queryKey: ['contact-messages'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState message={apiError(q.error)} />;
  const m = q.data!;
  return (
    <div className="mx-auto max-w-4xl">
      <Link className="text-sm text-slate-500" to="/admin/contact-messages">
        ← Messages reçus
      </Link>
      <section className="card mt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <p className="text-sm font-semibold text-brand-600">{m.reference}</p>
            <h2 className="mt-1 text-2xl font-bold">{m.subject}</h2>
          </div>
          <select
            className="field w-auto"
            value={m.status}
            disabled={update.isPending}
            onChange={(e) => update.mutate(e.target.value as ContactStatus)}
          >
            {Object.entries(labels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-7 grid gap-4 border-y py-5 sm:grid-cols-3">
          <Info label="Nom" value={m.name} />
          <Info label="E-mail" value={m.email} />
          <Info label="Téléphone" value={m.phone || 'Non renseigné'} />
        </div>
        <div className="mt-7">
          <h3 className="font-bold">Message</h3>
          <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 leading-7 dark:bg-slate-800">
            {m.message}
          </p>
        </div>
        <p className="mt-5 text-xs text-slate-400">
          Reçu le {new Date(m.created_at).toLocaleString('fr-FR')} · IP{' '}
          {m.ip_address || 'non disponible'}
        </p>
      </section>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small className="text-slate-400">{label}</small>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { apiError } from '../api/client';
import { PageLoader } from '../components/ui';
import { dataService } from '../services';
import type { Payment } from '../types';

export function PaymentResultPage() {
  const [params] = useSearchParams();
  const paymentId = Number(params.get('payment'));
  const result = params.get('result');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paymentId) return;
    dataService.verifyPayment(paymentId).then(setPayment).catch((e) => setError(apiError(e)));
  }, [paymentId]);

  if (!paymentId) return <p className="p-8">Référence de paiement invalide.</p>;
  if (!payment && !error) return <PageLoader />;
  const paid = payment?.status === 'PAID';
  const declined = result === 'declined' || result === 'cancelled' || payment?.status === 'FAILED';

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="card">
        {paid ? (
          <CheckCircle2 className="mx-auto text-emerald-500" size={68} />
        ) : declined ? (
          <XCircle className="mx-auto text-red-500" size={68} />
        ) : (
          <Clock3 className="mx-auto text-amber-500" size={68} />
        )}
        <h1 className="mt-5 text-3xl font-black">
          {paid ? 'Paiement confirmé' : declined ? 'Paiement non effectué' : 'Vérification en cours'}
        </h1>
        <p className="mt-3 text-slate-500">
          {error || (paid
            ? 'FlexPay a confirmé votre transaction et votre réservation.'
            : 'Aucun paiement ne sera validé sans confirmation de FlexPay.')}
        </p>
        {payment && (
          <Link className="btn-primary mt-7 w-full" to={`/bookings/${payment.booking}`}>
            Voir la réservation
          </Link>
        )}
      </div>
    </main>
  );
}

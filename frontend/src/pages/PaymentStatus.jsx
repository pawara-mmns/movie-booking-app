import { AlertTriangle, CheckCircle2, Clock3, Loader, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import CustomerHeader from '../components/CustomerHeader';
import { cinemaApi } from '../lib/cinemaApi';

const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);
const STATUS_CONTENT = {
    PAID: { icon: CheckCircle2, color: 'text-emerald-400', surface: 'border-emerald-400/20 bg-emerald-400/10', title: 'Booking confirmed', description: 'Your payment was verified and your cinema seats are booked.' },
    PENDING: { icon: Clock3, color: 'text-amber-400', surface: 'border-amber-400/20 bg-amber-400/10', title: 'Confirming payment', description: 'PayHere is notifying us about your payment. This usually takes only a few seconds.' },
    CANCELLED: { icon: XCircle, color: 'text-slate-400', surface: 'border-white/10 bg-white/[0.04]', title: 'Payment cancelled', description: 'Your card was not charged. You can return and choose seats again.' },
    FAILED: { icon: XCircle, color: 'text-red-400', surface: 'border-red-400/20 bg-red-400/10', title: 'Payment failed', description: 'PayHere could not complete this payment. Please try again.' },
    CHARGEBACKED: { icon: AlertTriangle, color: 'text-red-400', surface: 'border-red-400/20 bg-red-400/10', title: 'Payment reversed', description: 'This payment was reversed. Please contact support for help.' },
    REVIEW: { icon: AlertTriangle, color: 'text-orange-400', surface: 'border-orange-400/20 bg-orange-400/10', title: 'Payment needs review', description: 'Payment was received, but the booking needs manual review. Please keep your order number.' },
};

const PaymentStatus = () => {
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const loadStatus = useCallback(async () => {
        try { setPayment(await cinemaApi.getPaymentStatus(orderId)); setError(''); }
        catch (requestError) { setError(requestError.message || 'Could not load payment status.'); }
        finally { setLoading(false); }
    }, [orderId]);

    useEffect(() => { loadStatus(); }, [loadStatus]);
    useEffect(() => {
        if (payment?.status !== 'PENDING') return undefined;
        const timer = window.setInterval(loadStatus, 3000);
        return () => window.clearInterval(timer);
    }, [loadStatus, payment?.status]);

    const effectiveStatus = searchParams.get('cancelled') === 'true' && payment?.status === 'PENDING' ? 'CANCELLED' : payment?.status;
    const content = STATUS_CONTENT[effectiveStatus] || STATUS_CONTENT.PENDING;
    const StatusIcon = content.icon;

    return (
        <div className="min-h-dvh bg-[#090d14] text-white"><CustomerHeader /><main className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-3xl place-items-center px-5 py-12">
            {loading ? <div className="text-center"><Loader className="mx-auto animate-spin text-amber-400" size={34} /><p className="mt-4 text-slate-400">Checking your payment…</p></div> : error ? <div className="w-full rounded-3xl border border-red-400/20 bg-[#111824] p-8 text-center"><XCircle className="mx-auto text-red-400" size={44} /><h1 className="mt-5 text-2xl font-black">Could not check payment</h1><p className="mt-3 text-slate-400">{error}</p><button type="button" onClick={loadStatus} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-slate-950"><RefreshCw size={17} /> Try again</button></div> : (
                <section className="w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111824] shadow-2xl shadow-black/25">
                    <div className={`border-b p-8 text-center ${content.surface}`}><span className={`mx-auto grid h-16 w-16 place-items-center rounded-full bg-black/20 ${content.color}`}><StatusIcon size={35} /></span><h1 className="mt-5 text-3xl font-black">{content.title}</h1><p className="mx-auto mt-3 max-w-lg text-slate-300">{content.description}</p>{payment.status === 'PENDING' && !searchParams.get('cancelled') && <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-300"><Loader size={14} className="animate-spin" /> Updating automatically</p>}</div>
                    <div className="p-6 sm:p-8"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-wider text-slate-500">Order number</dt><dd className="mt-1 font-mono font-bold">{payment.order_id}</dd></div><div><dt className="text-xs uppercase tracking-wider text-slate-500">Amount</dt><dd className="mt-1 font-bold">{money(payment.amount)}</dd></div>{payment.booking_reference && <div><dt className="text-xs uppercase tracking-wider text-slate-500">Booking reference</dt><dd className="mt-1 font-mono font-black text-emerald-400">{payment.booking_reference}</dd></div>}{payment.payment_method && <div><dt className="text-xs uppercase tracking-wider text-slate-500">Payment method</dt><dd className="mt-1 font-bold">{payment.payment_method}</dd></div>}</dl>{payment.status_message && <p className="mt-6 rounded-xl bg-black/20 p-4 text-sm text-slate-400">{payment.status_message}</p>}<div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link to="/dashboard" className="flex-1 rounded-xl bg-amber-400 px-5 py-3 text-center font-black text-slate-950 hover:bg-amber-300">Browse movies</Link>{payment.status === 'PENDING' && <button type="button" onClick={loadStatus} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-bold text-slate-200 hover:bg-white/5"><RefreshCw size={17} /> Refresh status</button>}</div></div>
                </section>
            )}
        </main></div>
    );
};

export default PaymentStatus;

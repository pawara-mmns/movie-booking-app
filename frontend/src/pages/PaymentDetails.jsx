import { ArrowLeft, CalendarClock, CreditCard, Loader, LockKeyhole, MapPin, ShieldCheck, Ticket } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CustomerHeader from '../components/CustomerHeader';
import { useAuth } from '../context/AuthContext';
import { cinemaApi } from '../lib/cinemaApi';
import { notify } from '../lib/notifications';

const CHECKOUT_KEY = 'cinesphere_payment_checkout';
const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);
const seatLabel = value => {
    const [row, col] = value.split('-').map(Number);
    return `${String.fromCharCode(65 + row)}${col + 1}`;
};

const PaymentDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const checkout = useMemo(() => {
        if (location.state?.checkout) return location.state.checkout;
        try { return JSON.parse(sessionStorage.getItem(CHECKOUT_KEY)); } catch { return null; }
    }, [location.state]);
    const inferredName = user?.email?.split('@')[0]?.replace(/[._-]+/g, ' ') || '';
    const [details, setDetails] = useState({
        first_name: inferredName,
        last_name: '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (checkout) sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(checkout));
    }, [checkout]);

    const update = event => setDetails(current => ({ ...current, [event.target.name]: event.target.value }));

    const startPayment = async event => {
        event.preventDefault();
        if (!checkout) return;
        setProcessing(true);
        try {
            const payment = await cinemaApi.initiatePayHerePayment({
                showtime_id: Number(checkout.showtimeId),
                seats: checkout.seats,
                customer: details,
            });
            sessionStorage.removeItem(CHECKOUT_KEY);
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = payment.checkout_url;
            Object.entries(payment.form_data).forEach(([name, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = String(value ?? '');
                form.appendChild(input);
            });
            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            notify.error(error, 'Could not open PayHere Sandbox.');
            setProcessing(false);
        }
    };

    const changeSeats = async () => {
        if (!checkout) return;
        setProcessing(true);
        try {
            await Promise.all(checkout.seats.map(seat => {
                const [row, col] = seat.split('-').map(Number);
                return cinemaApi.releaseSeat(checkout.showtimeId, row, col);
            }));
            sessionStorage.removeItem(CHECKOUT_KEY);
            navigate(`/booking/${checkout.showtimeId}`, { replace: true });
        } catch (error) {
            notify.error(error, 'Could not release the selected seats.');
            setProcessing(false);
        }
    };

    if (!checkout) {
        return (
            <main className="grid min-h-dvh place-items-center bg-[#090d14] px-6 text-white">
                <div className="max-w-md text-center"><Ticket className="mx-auto text-amber-400" size={40} /><h1 className="mt-5 text-2xl font-black">No seats ready for payment</h1><p className="mt-3 text-slate-400">Choose a showtime and select your seats before opening payment.</p><Link to="/" className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950">Browse movies</Link></div>
            </main>
        );
    }

    return (
        <div className="min-h-dvh bg-[#090d14] pb-12 text-white">
            <CustomerHeader />
            <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
                <button type="button" onClick={changeSeats} disabled={processing} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white disabled:opacity-50"><ArrowLeft size={17} /> Change seats</button>
                <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">Secure checkout</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Payment details</h1><p className="mt-2 text-slate-400">Review your booking and continue to PayHere Sandbox.</p></div>

                <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_390px]">
                    <form onSubmit={startPayment} className="rounded-3xl border border-white/[0.08] bg-[#111824] p-5 shadow-2xl shadow-black/20 sm:p-7">
                        <div className="mb-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><CreditCard size={20} /></span><div><h2 className="font-black">Billing information</h2><p className="text-xs text-slate-500">Required by the PayHere checkout</p></div></div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">First name</span><input name="first_name" value={details.first_name} onChange={update} required className="input-field h-12 w-full rounded-xl border border-white/10 bg-[#090e16] px-4" /></label>
                            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Last name</span><input name="last_name" value={details.last_name} onChange={update} required className="input-field h-12 w-full rounded-xl border border-white/10 bg-[#090e16] px-4" /></label>
                            <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-300">Email</span><input type="email" name="email" value={details.email} readOnly className="h-12 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.03] px-4 text-slate-400" /></label>
                            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Phone number</span><input type="tel" name="phone" value={details.phone} onChange={update} placeholder="077 123 4567" required className="input-field h-12 w-full rounded-xl border border-white/10 bg-[#090e16] px-4" /></label>
                            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">City</span><input name="city" value={details.city} onChange={update} placeholder="Colombo" required className="input-field h-12 w-full rounded-xl border border-white/10 bg-[#090e16] px-4" /></label>
                            <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-300">Billing address</span><input name="address" value={details.address} onChange={update} required className="input-field h-12 w-full rounded-xl border border-white/10 bg-[#090e16] px-4" /></label>
                        </div>
                        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4 text-sm text-slate-300"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-emerald-400" /><p>Your payment is completed on PayHere. CineSphere never receives or stores your card number.</p></div>
                        <button type="submit" disabled={processing} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">{processing ? <><Loader size={19} className="animate-spin" /> Opening PayHere…</> : <><LockKeyhole size={18} /> Pay {money(checkout.total)} with PayHere</>}</button>
                        <p className="mt-3 text-center text-[11px] text-slate-600">Sandbox mode · No real money will be charged</p>
                    </form>

                    <aside className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111824] lg:sticky lg:top-24">
                        {checkout.posterUrl && <img src={checkout.posterUrl} alt="" className="h-36 w-full object-cover opacity-55" />}
                        <div className="p-6">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">Booking summary</p><h2 className="mt-2 text-2xl font-black">{checkout.movieTitle}</h2>
                            <div className="mt-5 space-y-3 text-sm text-slate-400"><p className="flex items-center gap-2"><MapPin size={16} className="text-amber-400" /> {checkout.screenName}</p><p className="flex items-center gap-2"><CalendarClock size={16} className="text-amber-400" /> {new Date(checkout.startTime).toLocaleString()}</p></div>
                            <div className="my-6 h-px bg-white/[0.08]" />
                            <div className="flex items-start justify-between gap-4"><span className="text-sm text-slate-400">Selected seats</span><span className="text-right font-bold">{checkout.seats.map(seatLabel).join(', ')}</span></div>
                            <div className="mt-3 flex justify-between"><span className="text-sm text-slate-400">Tickets</span><span className="font-bold">{checkout.seats.length}</span></div>
                            <div className="my-6 h-px bg-white/[0.08]" />
                            <div className="flex items-end justify-between"><span className="font-bold">Total</span><span className="text-2xl font-black text-amber-400">{money(checkout.total)}</span></div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default PaymentDetails;

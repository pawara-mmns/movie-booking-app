import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, Loader, LockKeyhole, MapPin, UserPlus, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CustomerHeader from '../components/CustomerHeader';
import SeatSelection from '../components/SeatSelection';
import { useAuth } from '../context/AuthContext';
import { cinemaApi } from '../lib/cinemaApi';

const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);

const BookingPage = () => {
    const { showtimeId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showtime, setShowtime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookingData, setBookingData] = useState({ seats: [], total: 0 });
    const [processing, setProcessing] = useState(false);

    const loadShowtime = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setShowtime(await cinemaApi.getShowtime(showtimeId));
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [showtimeId]);

    useEffect(() => { loadShowtime(); }, [loadShowtime]);

    const normalizedLayout = useMemo(() => showtime?.seat_configuration.map(row => row.map(seat => typeof seat === 'string' ? seat : ({ 0: 'gap', 1: 'standard', 2: 'vip' }[seat] || 'standard'))) || [], [showtime]);
    const unavailableSeats = useMemo(() => [...new Set([...(showtime?.booked_seats || []), ...(showtime?.locked_seats || [])])], [showtime]);

    const requestSeat = (endpoint, row, col) => endpoint === 'lock'
        ? cinemaApi.holdSeat(showtimeId, row, col)
        : cinemaApi.releaseSeat(showtimeId, row, col);

    const handleBooking = async () => {
        if (bookingData.seats.length === 0) return;
        if (!user) {
            navigate(`/register?returnTo=${encodeURIComponent(`/booking/${showtimeId}`)}`);
            return;
        }

        setProcessing(true);
        try {
            const data = await cinemaApi.createBooking(showtimeId, bookingData.seats);
            window.alert(`Booking confirmed! Reference: ${data.reference}`);
            navigate('/dashboard');
        } catch (requestError) {
            window.alert(requestError.message);
            await loadShowtime();
            setBookingData({ seats: [], total: 0 });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-background text-white flex items-center justify-center">Loading seat availability...</div>;
    if (error || !showtime) return <div className="min-h-screen bg-background text-white flex flex-col gap-5 items-center justify-center"><p>{error || 'Showtime not found'}</p><Link to="/" className="btn-secondary">Browse movies</Link></div>;

    return (
        <div className="min-h-screen bg-background text-white pb-32">
            <CustomerHeader />
            <main className="max-w-6xl mx-auto px-6 py-8">
                <Link to={`/movies/${showtime.movie_id}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-7"><ArrowLeft size={18} /> Back to showtimes</Link>
                <section className="glass-panel p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div><p className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">Select your seats</p><h1 className="text-3xl font-bold">{showtime.movie_title}</h1><div className="flex flex-wrap gap-4 text-gray-400 mt-3"><span className="flex items-center gap-2"><MapPin size={17} /> {showtime.screen_name}</span><span className="flex items-center gap-2"><CalendarClock size={17} /> {new Date(showtime.start_time).toLocaleString()}</span></div></div>
                    <div className="flex gap-3"><div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 text-center"><p className="text-2xl font-bold text-emerald-400">{showtime.available_seats}</p><p className="text-xs text-gray-400">Available seats</p></div><div className="rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-center"><p className="text-2xl font-bold">{showtime.total_seats}</p><p className="text-xs text-gray-400">Total seats</p></div></div>
                </section>

                {!user && <section className="mb-8 rounded-xl border border-sky-500/25 bg-sky-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-start gap-3"><Users className="text-sky-400 shrink-0 mt-0.5" /><div><p className="font-semibold">You are browsing as a guest</p><p className="text-sm text-gray-300 mt-1">Preview the live seat map and select up to 6 seats. You will create an account before booking.</p></div></div><Link to={`/login?returnTo=${encodeURIComponent(`/booking/${showtimeId}`)}`} className="btn-secondary whitespace-nowrap">Already have an account?</Link></section>}
                {user && <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-400"><LockKeyhole size={16} className="text-primary" /> Selected seats are held for 5 minutes.</div>}

                <SeatSelection layout={normalizedLayout} unavailableSeats={unavailableSeats} seatPrice={showtime.price} onBookingChange={setBookingData} onSelectSeat={user ? (row, col) => requestSeat('lock', row, col) : undefined} onReleaseSeat={user ? (row, col) => requestSeat('release', row, col) : undefined} />
            </main>

            <footer className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 shadow-2xl z-50">
                <div className="max-w-5xl mx-auto flex justify-between items-center gap-5"><div><p className="text-gray-400 text-sm">Total · {bookingData.seats.length} seat{bookingData.seats.length === 1 ? '' : 's'}</p><p className="text-2xl font-bold text-primary">{money(bookingData.total)}</p></div><div className="flex items-center gap-6"><div className="text-right hidden sm:block"><p className="text-gray-400 text-sm">Selected seats</p><p className="font-medium">{bookingData.seats.length ? bookingData.seats.map(seat => { const [row, col] = seat.split('-').map(Number); return `${String.fromCharCode(65 + row)}${col + 1}`; }).join(', ') : 'None'}</p></div><button onClick={handleBooking} disabled={bookingData.seats.length === 0 || processing} className="btn-primary flex items-center gap-2 px-8 py-3">{processing ? <Loader className="animate-spin" /> : user ? 'Confirm Booking' : <><UserPlus size={18} /> Create Account to Book</>}</button></div></div>
            </footer>
        </div>
    );
};

export default BookingPage;

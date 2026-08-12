import { useEffect, useMemo, useState } from 'react';
import { Armchair, ArrowLeft, CalendarDays, Clock3, Film, MapPin, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import CustomerHeader from '../components/CustomerHeader';
import { formatDuration } from '../lib/formatters';
import { cinemaApi } from '../lib/cinemaApi';

const formatMoney = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);
const localDateKey = value => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const dateLabel = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const longDateLabel = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const timeLabel = value => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const priceRange = showtime => {
    const prices = Object.values(showtime.seat_prices || {}).map(Number).filter(price => price > 0);
    if (!prices.length) return formatMoney(showtime.price);
    const minimum = Math.min(...prices);
    const maximum = Math.max(...prices);
    return minimum === maximum ? formatMoney(minimum) : `${formatMoney(minimum)} – ${formatMoney(maximum)}`;
};

const MovieDetails = () => {
    const { movieId } = useParams();
    const [movie, setMovie] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const loadMovie = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await cinemaApi.getMovie(movieId);
                if (active) setMovie(data);
            } catch (requestError) {
                if (active) setError(requestError.message);
            } finally {
                if (active) setLoading(false);
            }
        };
        loadMovie();
        return () => { active = false; };
    }, [movieId]);

    const dates = useMemo(() => movie ? [...new Set(movie.showtimes.map(show => localDateKey(show.start_time)))].sort() : [], [movie]);
    const activeDate = dates.includes(selectedDate) ? selectedDate : dates[0];
    const visibleShowtimes = useMemo(() => movie?.showtimes
        .filter(show => localDateKey(show.start_time) === activeDate)
        .sort((first, second) => new Date(first.start_time) - new Date(second.start_time)) || [], [activeDate, movie]);

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-background text-white">Loading movie…</div>;
    if (error || !movie) return <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background text-white"><p>{error || 'Movie not found'}</p><Link to="/" className="btn-secondary">Back to movies</Link></div>;

    return (
        <div className="min-h-screen bg-[#090d14] text-white">
            <CustomerHeader />
            <main>
                <section className="relative overflow-hidden border-b border-white/[0.08]">
                    {movie.poster_url && <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url(${movie.poster_url})` }} />}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#090d14]/65 via-[#090d14]/90 to-[#090d14]" />
                    <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
                        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"><ArrowLeft size={18} /> Back to movies</Link>
                        <div className="grid items-start gap-8 sm:grid-cols-[180px_1fr] md:grid-cols-[230px_1fr] md:gap-10">
                            <div className="mx-auto aspect-[2/3] w-full max-w-[230px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl sm:mx-0">
                                {movie.poster_url ? <img src={movie.poster_url} alt={movie.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Film size={52} className="text-gray-700" /></div>}
                            </div>
                            <div className="pt-1">
                                <div className="mb-5 flex flex-wrap gap-2"><span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-300">{movie.genre}</span><span className="flex items-center gap-1 rounded-full bg-white/[0.07] px-3 py-1 text-sm text-gray-200"><Star size={14} /> {movie.rating}</span></div>
                                <h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">{movie.title}</h1>
                                <p className="mt-4 flex items-center gap-2 text-gray-300"><Clock3 size={18} className="text-amber-400" /> {formatDuration(movie.duration_mins)}</p>
                                <p className="mt-6 max-w-3xl text-base leading-7 text-gray-300 md:text-lg md:leading-8">{movie.description || 'Movie details will be available soon.'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
                    <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111824]">
                        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
                            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Book your visit</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Choose a date &amp; time</h2><p className="mt-1 text-sm text-slate-400">Pick a date first, then choose the showtime that suits you.</p></div>
                            {movie.showtimes.length > 0 && <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-400">{movie.showtimes.length} available show{movie.showtimes.length === 1 ? '' : 's'}</span>}
                        </header>

                        {dates.length === 0 ? (
                            <div className="px-6 py-16 text-center"><CalendarDays className="mx-auto text-slate-700" size={42} /><h3 className="mt-4 text-lg font-bold">No showtimes available</h3><p className="mt-2 text-sm text-slate-500">Please check back soon for new dates.</p></div>
                        ) : (
                            <div className="p-5 sm:p-7">
                                <div>
                                    <div className="mb-3 flex items-center gap-2 text-sm font-bold"><CalendarDays size={17} className="text-amber-400" /> Choose date</div>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {dates.map(date => {
                                            const count = movie.showtimes.filter(show => localDateKey(show.start_time) === date).length;
                                            return <button type="button" key={date} onClick={() => setSelectedDate(date)} className={clsx('min-w-max rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300', date === activeDate ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-[0_8px_22px_-12px_rgba(251,191,36,0.9)]' : 'border-white/10 bg-[#0a0f17] text-slate-300 hover:border-amber-400/35')}><strong className="block text-sm">{dateLabel(date)}</strong><span className={clsx('mt-1 block text-[10px] font-bold uppercase tracking-wider', date === activeDate ? 'text-slate-800' : 'text-slate-600')}>{count} show{count === 1 ? '' : 's'}</span></button>;
                                        })}
                                    </div>
                                </div>

                                <div className="mt-7">
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-bold"><Clock3 size={17} className="text-amber-400" /> Times on {longDateLabel(activeDate)}</div><span className="text-xs text-slate-500">Select a time to continue</span></div>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {visibleShowtimes.map(show => (
                                            <article key={show.id} className="rounded-2xl border border-white/[0.08] bg-[#090e16] p-4 transition-colors hover:border-amber-400/30">
                                                <div><strong className="text-xl">{timeLabel(show.start_time)}</strong><span className="mx-2 text-slate-600">–</span><span className="text-sm text-slate-400">{timeLabel(show.end_time)}</span></div>
                                                <div className="mt-3 flex items-center gap-2 text-sm text-slate-400"><MapPin size={15} className="text-amber-400" /><span className="truncate">{show.screen_name}</span></div>
                                                <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-4"><div><span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Seats from</span><strong className="mt-1 block text-xs text-slate-200">{priceRange(show)}</strong></div><Link to={`/booking/${show.id}`} className="flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-400 px-3 py-2.5 text-xs font-black text-slate-950 shadow-[0_8px_22px_-12px_rgba(251,191,36,0.9)] transition-all hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"><Armchair size={15} /> Choose seats</Link></div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MovieDetails;

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, Film, MapPin, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import CustomerHeader from '../components/CustomerHeader';

const formatMoney = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);

const MovieDetails = () => {
    const { movieId } = useParams();
    const [movie, setMovie] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedScreen, setSelectedScreen] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const loadMovie = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`/api/movies/${movieId}`, { signal: controller.signal });
                if (response.status === 404) throw new Error('Movie not found');
                if (!response.ok) throw new Error('Could not load movie details');
                setMovie(await response.json());
            } catch (requestError) {
                if (requestError.name !== 'AbortError') setError(requestError.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        loadMovie();
        return () => controller.abort();
    }, [movieId]);

    const dates = useMemo(() => movie ? [...new Set(movie.showtimes.map(show => show.start_time.slice(0, 10)))] : [], [movie]);
    const screens = useMemo(() => movie ? [...new Map(movie.showtimes.map(show => [show.screen_id, { id: show.screen_id, name: show.screen_name }])).values()] : [], [movie]);
    const visibleShowtimes = useMemo(() => movie?.showtimes.filter(show => (!selectedDate || show.start_time.slice(0, 10) === selectedDate) && (!selectedScreen || String(show.screen_id) === selectedScreen)) || [], [movie, selectedDate, selectedScreen]);

    if (loading) return <div className="min-h-screen bg-background text-white flex items-center justify-center">Loading movie...</div>;
    if (error || !movie) return <div className="min-h-screen bg-background text-white flex flex-col gap-5 items-center justify-center"><p>{error || 'Movie not found'}</p><Link to="/" className="btn-secondary">Back to movies</Link></div>;

    return (
        <div className="min-h-screen bg-background text-white">
            <CustomerHeader />
            <main>
                <section className="relative border-b border-white/10 overflow-hidden">
                    {movie.poster_url && <div className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-20" style={{ backgroundImage: `url(${movie.poster_url})` }} />}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 to-slate-950" />
                    <div className="relative max-w-6xl mx-auto px-6 py-12">
                        <Link to="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8"><ArrowLeft size={18} /> Back to movies</Link>
                        <div className="grid md:grid-cols-[260px_1fr] gap-9 items-start">
                            <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                                {movie.poster_url ? <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center"><Film size={60} className="text-gray-700" /></div>}
                            </div>
                            <div className="pt-2">
                                <div className="flex flex-wrap gap-2 mb-5"><span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-semibold">{movie.genre}</span><span className="px-3 py-1 rounded-full bg-white/10 text-gray-200 text-sm flex items-center gap-1"><Star size={14} /> {movie.rating}</span></div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">{movie.title}</h1>
                                <p className="flex items-center gap-2 text-gray-300 mb-6"><Clock3 size={18} /> {movie.duration_mins} minutes</p>
                                <p className="max-w-3xl text-gray-300 text-lg leading-8">{movie.description || 'Movie details will be available soon.'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-6xl mx-auto px-6 py-12">
                    <div className="mb-7"><h2 className="text-3xl font-bold">Choose a showtime</h2><p className="text-gray-400 mt-2">Select a date and cinema, then continue to seat selection.</p></div>
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <label><span className="flex items-center gap-2 text-sm text-gray-300 mb-2"><CalendarDays size={17} className="text-primary" /> Date</span><select className="input-field" value={selectedDate} onChange={event => setSelectedDate(event.target.value)}><option value="">All available dates</option>{dates.map(value => <option key={value} value={value}>{new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</option>)}</select></label>
                        <label><span className="flex items-center gap-2 text-sm text-gray-300 mb-2"><MapPin size={17} className="text-primary" /> Cinema</span><select className="input-field" value={selectedScreen} onChange={event => setSelectedScreen(event.target.value)}><option value="">All cinemas</option>{screens.map(screen => <option key={screen.id} value={screen.id}>{screen.name}</option>)}</select></label>
                    </div>

                    {visibleShowtimes.length === 0 ? <div className="glass-panel p-10 text-center text-gray-400">No showtimes match your selection.</div> : (
                        <div className="space-y-3">
                            {visibleShowtimes.map(show => (
                                <div key={show.id} className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                    <div><p className="font-semibold text-lg flex items-center gap-2"><MapPin size={18} className="text-primary" /> {show.screen_name}</p><p className="text-gray-400 mt-1">{new Date(show.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p></div>
                                    <div className="sm:text-center"><p className="text-2xl font-bold">{new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><p className="text-sm text-gray-400">Ends {new Date(show.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                                    <div className="flex items-center gap-5"><p><span className="block text-xs text-gray-400">From</span><span className="font-semibold">{formatMoney(show.price)}</span></p><Link to={`/booking/${show.id}`} className="btn-primary">Select seats</Link></div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default MovieDetails;

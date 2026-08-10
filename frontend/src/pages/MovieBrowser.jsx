import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Film, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomerHeader from '../components/CustomerHeader';

const emptyFilters = { genres: [], screens: [], dates: [] };

const MovieBrowser = () => {
    const [movies, setMovies] = useState([]);
    const [filterOptions, setFilterOptions] = useState(emptyFilters);
    const [filters, setFilters] = useState({ search: '', genre: '', showDate: '', screenId: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const loadFilters = async () => {
            try {
                const response = await fetch('/api/movies/filters', { signal: controller.signal });
                if (!response.ok) throw new Error('Could not load movie filters');
                setFilterOptions(await response.json());
            } catch (requestError) {
                if (requestError.name !== 'AbortError') setError(requestError.message);
            }
        };
        loadFilters();
        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setError('');
            const params = new URLSearchParams();
            if (filters.search.trim()) params.set('search', filters.search.trim());
            if (filters.genre) params.set('genre', filters.genre);
            if (filters.showDate) params.set('show_date', filters.showDate);
            if (filters.screenId) params.set('screen_id', filters.screenId);

            try {
                const response = await fetch(`/api/movies?${params}`, { signal: controller.signal });
                if (!response.ok) throw new Error('Could not load movies');
                setMovies(await response.json());
            } catch (requestError) {
                if (requestError.name !== 'AbortError') setError(requestError.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [filters]);

    const updateFilter = (name, value) => setFilters(current => ({ ...current, [name]: value }));
    const clearFilters = () => setFilters({ search: '', genre: '', showDate: '', screenId: '' });

    return (
        <div className="min-h-screen bg-background text-white">
            <CustomerHeader />
            <main className="max-w-7xl mx-auto px-6 py-10">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 mb-10 p-8 md:p-12">
                    <div className="absolute inset-0 opacity-25 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
                    <div className="relative max-w-2xl">
                        <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-[0.2em] mb-4"><Film size={18} /> Now Showing</span>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">Find your next big-screen experience</h1>
                        <p className="text-gray-300 text-lg">Search current movies and choose a date, cinema hall, and showtime.</p>
                    </div>
                </section>

                <section className="glass-panel p-5 mb-9">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4"><SlidersHorizontal size={18} className="text-primary" /> Find a show</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <label className="relative">
                            <Search size={18} className="absolute left-3 top-3.5 text-gray-500" />
                            <input className="input-field pl-10" placeholder="Search movies..." value={filters.search} onChange={event => updateFilter('search', event.target.value)} />
                        </label>
                        <select className="input-field" value={filters.genre} onChange={event => updateFilter('genre', event.target.value)}>
                            <option value="">All genres</option>
                            {filterOptions.genres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                        </select>
                        <select className="input-field" value={filters.showDate} onChange={event => updateFilter('showDate', event.target.value)}>
                            <option value="">All dates</option>
                            {filterOptions.dates.map(value => <option key={value} value={value}>{new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</option>)}
                        </select>
                        <select className="input-field" value={filters.screenId} onChange={event => updateFilter('screenId', event.target.value)}>
                            <option value="">All cinemas</option>
                            {filterOptions.screens.map(screen => <option key={screen.id} value={screen.id}>{screen.name}</option>)}
                        </select>
                    </div>
                </section>

                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Movies available now</h2>
                        <p className="text-gray-400 mt-1">{loading ? 'Checking showtimes...' : `${movies.length} movie${movies.length === 1 ? '' : 's'} found`}</p>
                    </div>
                    {(filters.search || filters.genre || filters.showDate || filters.screenId) && <button onClick={clearFilters} className="text-sm text-primary hover:text-amber-300">Clear filters</button>}
                </div>

                {error && <div className="p-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200">{error}</div>}
                {!error && loading && <div className="py-24 text-center text-gray-400">Loading movies...</div>}
                {!error && !loading && movies.length === 0 && (
                    <div className="py-20 text-center glass-panel">
                        <CalendarDays size={42} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold">No matching showtimes</h3>
                        <p className="text-gray-400 mt-2">Try another date, cinema, or search term.</p>
                        <button onClick={clearFilters} className="btn-secondary mt-5">Reset filters</button>
                    </div>
                )}
                {!error && !loading && movies.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {movies.map(movie => (
                            <Link key={movie.id} to={`/movies/${movie.id}`} className="group rounded-2xl overflow-hidden border border-white/10 bg-slate-800/60 hover:border-primary/50 hover:-translate-y-1 transition-all">
                                <div className="aspect-[2/3] bg-slate-900 overflow-hidden">
                                    {movie.poster_url ? <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Film size={50} className="text-gray-700" /></div>}
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between gap-3 mb-2"><span className="text-xs uppercase tracking-wider font-semibold text-primary">{movie.genre || 'Movie'}</span><span className="text-xs text-gray-400">{movie.rating}</span></div>
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{movie.title}</h3>
                                    <p className="flex items-center gap-2 text-sm text-gray-400 mt-2"><Clock3 size={15} /> {movie.duration_mins} min</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MovieBrowser;

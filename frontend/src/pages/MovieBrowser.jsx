import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Film, MapPin, Search, Sparkles, Star, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomerHeader from '../components/CustomerHeader';
import { cinemaApi } from '../lib/cinemaApi';

const emptyFilters = { genres: [], screens: [], dates: [] };
const defaultFilterState = { search: '', genre: '', showDate: '', screenId: '' };

const MovieCard = ({ movie }) => (
    <Link to={`/movies/${movie.id}`} className="group block min-w-0">
        <article className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#111722] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-400/35 group-hover:shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
            <div className="relative aspect-[2/3] overflow-hidden bg-[#161d29]">
                {movie.poster_url ? <img src={movie.poster_url} alt={movie.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /> : <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.14),transparent_45%)]"><Film size={50} className="text-slate-700" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d14] via-transparent to-transparent opacity-70" />
                <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">{movie.rating}</span>
                <span className="absolute bottom-3 left-3 rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-950">{movie.genre || 'Movie'}</span>
            </div>
            <div className="p-5">
                <h3 className="truncate text-lg font-bold tracking-[-0.02em] text-white transition-colors group-hover:text-amber-300">{movie.title}</h3>
                <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-sm text-slate-400"><Clock3 size={15} /> {movie.duration_mins} min</p>
                    <span className="flex items-center gap-1 text-sm font-semibold text-slate-200">Showtimes <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" /></span>
                </div>
            </div>
        </article>
    </Link>
);

const MovieBrowser = () => {
    const [movies, setMovies] = useState([]);
    const [heroMovies, setHeroMovies] = useState([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [sliderPaused, setSliderPaused] = useState(false);
    const [filterOptions, setFilterOptions] = useState(emptyFilters);
    const [filters, setFilters] = useState(defaultFilterState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([cinemaApi.getCatalogFilters(), cinemaApi.listAdminMovies()])
            .then(([filterData, movieData]) => {
                if (!active) return;
                setFilterOptions(filterData);
                setHeroMovies(movieData.filter(movie => movie.poster_url));
            })
            .catch(requestError => { if (active) setError(requestError.message); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        const timer = setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const data = await cinemaApi.listNowShowing(filters);
                if (active) setMovies(data);
            } catch (requestError) {
                if (active) setError(requestError.message);
            } finally {
                if (active) setLoading(false);
            }
        }, 250);
        return () => { clearTimeout(timer); active = false; };
    }, [filters]);

    useEffect(() => {
        if (heroMovies.length < 2 || sliderPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
        const interval = window.setInterval(() => {
            setActiveSlide(current => (current + 1) % heroMovies.length);
        }, 5000);
        return () => window.clearInterval(interval);
    }, [heroMovies.length, sliderPaused]);

    useEffect(() => {
        if (activeSlide >= heroMovies.length) setActiveSlide(0);
    }, [activeSlide, heroMovies.length]);

    const featuredMovie = heroMovies[activeSlide] || movies[0];
    const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);
    const updateFilter = (name, value) => setFilters(current => ({ ...current, [name]: value }));
    const clearFilters = () => setFilters(defaultFilterState);
    const showPreviousSlide = () => setActiveSlide(current => (current - 1 + heroMovies.length) % heroMovies.length);
    const showNextSlide = () => setActiveSlide(current => (current + 1) % heroMovies.length);

    return (
        <div className="min-h-screen bg-[#090d14] text-white">
            <CustomerHeader />

            <main>
                <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
                    {heroMovies.map((movie, index) => <img key={movie.id} src={movie.poster_url} alt="" className={`absolute inset-0 -z-30 h-full w-full object-cover blur-2xl transition-all duration-1000 ease-in-out ${index === activeSlide ? 'scale-110 opacity-20' : 'scale-125 opacity-0'}`} />)}
                    <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_35%,rgba(245,158,11,0.14),transparent_34%),linear-gradient(90deg,#090d14_0%,rgba(9,13,20,0.96)_52%,rgba(9,13,20,0.75)_100%)]" />
                    <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:py-20">
                        <div className="max-w-3xl">
                            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300"><Sparkles size={14} /> Your seat. Your story.</span>
                            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">Big-screen moments, <span className="text-amber-400">made effortless.</span></h1>
                            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Discover what’s playing, choose the perfect showtime, and reserve your favourite seats in just a few taps.</p>
                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#movies" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 font-bold text-slate-950 transition-all hover:bg-amber-300 hover:shadow-[0_12px_35px_rgba(245,158,11,0.22)]"><Ticket size={18} /> Explore movies</a>
                                {featuredMovie && <Link to={`/movies/${featuredMovie.id}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.09]">Featured show <ArrowRight size={18} /></Link>}
                            </div>
                            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/[0.08] pt-7 text-sm text-slate-400">
                                <span className="flex items-center gap-2"><Film size={16} className="text-amber-400" /> {loading ? '—' : movies.length} movies showing</span>
                                <span className="flex items-center gap-2"><MapPin size={16} className="text-amber-400" /> {filterOptions.screens.length} cinema screens</span>
                                <span className="flex items-center gap-2"><CalendarDays size={16} className="text-amber-400" /> Live schedules</span>
                            </div>
                        </div>

                        <div className="group relative mx-auto w-full max-w-[430px] lg:mx-0 lg:ml-auto" onMouseEnter={() => setSliderPaused(true)} onMouseLeave={() => setSliderPaused(false)}>
                            <div className="absolute -inset-8 -z-10 rounded-full bg-amber-400/10 blur-3xl" />
                            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#111722]/90 p-3 shadow-[0_35px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                                <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#161d29]">
                                    {heroMovies.length ? heroMovies.map((movie, index) => <img key={movie.id} src={movie.poster_url} alt={index === activeSlide ? movie.title : ''} className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${index === activeSlide ? 'translate-x-0 scale-100 opacity-100' : index < activeSlide ? '-translate-x-6 scale-105 opacity-0' : 'translate-x-6 scale-105 opacity-0'}`} />) : <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.18),transparent_48%)]"><Film size={72} className="text-slate-700" /></div>}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                                    <div key={featuredMovie?.id || 'empty'} className="featured-caption absolute inset-x-0 bottom-0 p-6">
                                        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-300"><Star size={14} fill="currentColor" /> Featured now</p>
                                        <h2 className="text-2xl font-black tracking-[-0.03em]">{featuredMovie?.title || (loading ? 'Loading the spotlight…' : 'Your next favourite movie')}</h2>
                                        {featuredMovie && <p className="mt-2 flex items-center gap-3 text-sm text-slate-300"><span>{featuredMovie.genre}</span><span className="h-1 w-1 rounded-full bg-slate-500" /><span>{featuredMovie.duration_mins} min</span></p>}
                                    </div>
                                    {heroMovies.length > 1 && <><button type="button" onClick={showPreviousSlide} className="absolute left-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white opacity-100 backdrop-blur-md transition-all hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Previous featured movie"><ChevronLeft size={20} /></button><button type="button" onClick={showNextSlide} className="absolute right-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white opacity-100 backdrop-blur-md transition-all hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Next featured movie"><ChevronRight size={20} /></button></>}
                                </div>
                            </div>
                            {heroMovies.length > 1 && <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Featured movies">{heroMovies.map((movie, index) => <button key={movie.id} type="button" onClick={() => setActiveSlide(index)} className={`h-1.5 rounded-full transition-all duration-500 ${index === activeSlide ? 'w-8 bg-amber-400' : 'w-2 bg-slate-600 hover:bg-slate-400'}`} aria-label={`Show ${movie.title}`} aria-selected={index === activeSlide} role="tab" />)}</div>}
                        </div>
                    </div>
                </section>

                <section id="movies" className="scroll-mt-24">
                    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
                        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Now showing</p><h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Find a film worth leaving home for.</h2></div>
                            <p className="max-w-md text-sm leading-6 text-slate-400">Browse live cinema schedules and narrow the list by date, genre, or screen.</p>
                        </div>

                        <div className="mb-10 rounded-[24px] border border-white/[0.08] bg-[#111722] p-3 shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:p-4">
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
                                <label className="relative">
                                    <span className="sr-only">Search movies</span><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0b1018] pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/50" placeholder="Search a movie" value={filters.search} onChange={event => updateFilter('search', event.target.value)} />
                                </label>
                                <select aria-label="Filter by genre" className="h-12 rounded-xl border border-white/[0.08] bg-[#0b1018] px-4 text-sm text-slate-200 outline-none focus:border-amber-400/50" value={filters.genre} onChange={event => updateFilter('genre', event.target.value)}><option value="">All genres</option>{filterOptions.genres.map(genre => <option key={genre} value={genre}>{genre}</option>)}</select>
                                <select aria-label="Filter by date" className="h-12 rounded-xl border border-white/[0.08] bg-[#0b1018] px-4 text-sm text-slate-200 outline-none focus:border-amber-400/50" value={filters.showDate} onChange={event => updateFilter('showDate', event.target.value)}><option value="">Any date</option>{filterOptions.dates.map(value => <option key={value} value={value}>{new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</option>)}</select>
                                <select aria-label="Filter by cinema" className="h-12 rounded-xl border border-white/[0.08] bg-[#0b1018] px-4 text-sm text-slate-200 outline-none focus:border-amber-400/50" value={filters.screenId} onChange={event => updateFilter('screenId', event.target.value)}><option value="">Any cinema</option>{filterOptions.screens.map(screen => <option key={screen.id} value={screen.id}>{screen.name}</option>)}</select>
                                <button onClick={clearFilters} disabled={!activeFilterCount} className="h-12 rounded-xl px-5 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-300/10 disabled:cursor-default disabled:text-slate-600">Clear{activeFilterCount ? ` (${activeFilterCount})` : ''}</button>
                            </div>
                        </div>

                        <div className="mb-6 flex items-center justify-between"><p className="text-sm text-slate-400">{loading ? 'Updating the programme…' : `${movies.length} movie${movies.length === 1 ? '' : 's'} available`}</p></div>

                        {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">{error}</div>}
                        {!error && loading && <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="animate-pulse"><div className="aspect-[2/3] rounded-[22px] bg-white/[0.06]" /><div className="mt-4 h-5 w-3/4 rounded bg-white/[0.06]" /><div className="mt-2 h-4 w-1/2 rounded bg-white/[0.04]" /></div>)}</div>}
                        {!error && !loading && movies.length === 0 && <div className="rounded-[28px] border border-dashed border-white/10 bg-[#111722]/70 px-6 py-20 text-center"><CalendarDays size={42} className="mx-auto mb-5 text-slate-600" /><h3 className="text-xl font-bold">Nothing matches those filters</h3><p className="mt-2 text-slate-400">Try another date, screen, or movie title.</p><button onClick={clearFilters} className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950">Reset filters</button></div>}
                        {!error && !loading && movies.length > 0 && <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">{movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}</div>}
                    </div>
                </section>

                <section className="border-y border-white/[0.06] bg-[#0c111a]">
                    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 md:grid-cols-3">
                        {[['01', 'Pick a movie', 'Explore what is showing across every CineSphere screen.'], ['02', 'Choose your seats', 'See live availability and reserve the seats you actually want.'], ['03', 'Enjoy the show', 'Your booking reference is ready the moment you confirm.']].map(([number, title, copy]) => <div key={number} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6"><span className="text-xs font-black tracking-[0.2em] text-amber-400">{number}</span><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p></div>)}
                    </div>
                </section>
            </main>

            <footer className="bg-[#090d14]">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between"><p className="font-bold text-slate-300">Cine<span className="text-amber-400">Sphere</span></p><p>Simple booking. Better cinema nights.</p><p>© {new Date().getFullYear()} CineSphere</p></div>
            </footer>
        </div>
    );
};

export default MovieBrowser;

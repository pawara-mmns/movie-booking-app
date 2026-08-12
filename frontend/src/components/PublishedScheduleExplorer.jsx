import { useMemo, useState } from 'react';
import { Armchair, CalendarDays, Clock3, Film, Monitor, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);
const dateKey = value => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const dateLabel = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const timeLabel = value => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const priceRange = showtime => {
    const values = Object.values(showtime.seat_prices || {}).map(Number).filter(value => value > 0);
    if (!values.length) return money(showtime.price);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return minimum === maximum ? money(minimum) : `${money(minimum)} – ${money(maximum)}`;
};

const PublishedScheduleExplorer = ({ showtimes, onViewSeats, onDelete }) => {
    const [selectedMovieId, setSelectedMovieId] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');

    const movieGroups = useMemo(() => {
        const activeShows = showtimes
            .filter(showtime => new Date(showtime.end_time) >= new Date())
            .sort((first, second) => new Date(first.start_time) - new Date(second.start_time));
        const groups = new Map();
        activeShows.forEach(showtime => {
            const group = groups.get(showtime.movie_id) || {
                id: showtime.movie_id,
                title: showtime.movie_title,
                posterUrl: showtime.poster_url,
                showtimes: [],
            };
            group.showtimes.push(showtime);
            groups.set(showtime.movie_id, group);
        });
        return [...groups.values()];
    }, [showtimes]);

    const activeMovie = movieGroups.find(movie => movie.id === selectedMovieId) || movieGroups[0];
    const dates = useMemo(() => activeMovie ? [...new Set(activeMovie.showtimes.map(showtime => dateKey(showtime.start_time)))] : [], [activeMovie]);
    const activeDate = dates.includes(selectedDate) ? selectedDate : dates[0];
    const visibleSlots = activeMovie?.showtimes.filter(showtime => dateKey(showtime.start_time) === activeDate) || [];

    const chooseMovie = movieId => {
        setSelectedMovieId(movieId);
        setSelectedDate('');
    };

    if (!movieGroups.length) {
        return <section className="rounded-2xl border border-dashed border-white/10 bg-[#111824]/60 px-6 py-16 text-center"><CalendarDays className="mx-auto text-slate-700" size={42} /><h2 className="mt-4 text-xl font-bold">No upcoming schedule</h2><p className="mt-2 text-sm text-slate-500">Published movies, dates and times will appear here.</p></section>;
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111824]">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-6">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Live schedule</p><h2 className="mt-2 text-xl font-black">Movies, dates &amp; occupancy</h2><p className="mt-1 text-sm text-slate-400">Choose a movie, then a date, then open the time slot you need.</p></div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-400">{movieGroups.length} showing movie{movieGroups.length === 1 ? '' : 's'}</span>
            </header>

            <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="border-b border-white/[0.08] p-3 lg:border-b-0 lg:border-r">
                    <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Now showing</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                        {movieGroups.map(movie => {
                            const isActive = movie.id === activeMovie.id;
                            const movieDates = new Set(movie.showtimes.map(showtime => dateKey(showtime.start_time))).size;
                            return <button type="button" key={movie.id} onClick={() => chooseMovie(movie.id)} className={clsx('flex min-w-64 items-center gap-3 rounded-xl border p-3 text-left transition-all lg:min-w-0 lg:w-full', isActive ? 'border-amber-400/45 bg-amber-400/[0.09]' : 'border-transparent hover:border-white/10 hover:bg-white/[0.035]')}>
                                <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900">{movie.posterUrl ? <img src={movie.posterUrl} alt="" className="h-full w-full object-cover" /> : <Film size={18} className="text-slate-600" />}</span>
                                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{movie.title}</strong><span className="mt-1 block text-xs text-slate-500">{movieDates} date{movieDates === 1 ? '' : 's'} · {movie.showtimes.length} show{movie.showtimes.length === 1 ? '' : 's'}</span></span>
                            </button>;
                        })}
                    </div>
                </aside>

                <div className="min-w-0 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">Selected movie</p><h3 className="mt-1 text-2xl font-black">{activeMovie.title}</h3></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">Upcoming</span></div>

                    <div className="mt-6">
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold"><CalendarDays size={17} className="text-primary" /> Choose date</div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {dates.map(date => {
                                const count = activeMovie.showtimes.filter(showtime => dateKey(showtime.start_time) === date).length;
                                return <button type="button" key={date} onClick={() => setSelectedDate(date)} className={clsx('min-w-max rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300', date === activeDate ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-[0_8px_22px_-12px_rgba(251,191,36,0.9)]' : 'border-white/10 bg-black/15 text-slate-300 hover:border-amber-400/30')}><strong className="block text-sm">{dateLabel(date)}</strong><span className={clsx('mt-1 block text-[10px] font-bold uppercase tracking-wider', date === activeDate ? 'text-slate-800' : 'text-slate-600')}>{count} time slot{count === 1 ? '' : 's'}</span></button>;
                            })}
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-bold"><Clock3 size={17} className="text-primary" /> Times on {dateLabel(activeDate)}</div><span className="text-xs text-slate-500">Click a time to view seats</span></div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleSlots.map(showtime => (
                                <article key={showtime.id} className="group rounded-xl border border-white/[0.08] bg-[#0a0f17] p-4 transition-colors hover:border-primary/30">
                                    <div className="flex items-start justify-between gap-3"><div><strong className="text-lg">{timeLabel(showtime.start_time)}</strong><span className="mx-2 text-slate-600">–</span><span className="text-sm text-slate-400">{timeLabel(showtime.end_time)}</span></div><button type="button" onClick={() => onDelete(showtime)} title="Delete showtime" aria-label={`Delete ${timeLabel(showtime.start_time)} showtime`} className="rounded-lg p-1.5 text-slate-600 hover:bg-red-400/10 hover:text-red-400"><Trash2 size={15} /></button></div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Monitor size={14} /> <span className="truncate">{showtime.screen_name}</span></div>
                                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.06] pt-3"><div><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Seat prices</span><strong className="mt-1 block text-xs text-slate-300">{priceRange(showtime)}</strong></div><button type="button" onClick={() => onViewSeats(showtime.id)} className="flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 shadow-[0_8px_22px_-12px_rgba(251,191,36,0.9)] transition-all hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"><Armchair size={15} /> View seats</button></div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PublishedScheduleExplorer;

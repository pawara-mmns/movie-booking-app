import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarDays, Clock3, Link2, Plus, Tags, Trash2, Unlink2, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { cinemaApi } from '../lib/cinemaApi';
import { formatDuration } from '../lib/formatters';

const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);
const emptyDay = () => ({ date: '', times: [''], syncWithFirst: false, excludedTemplateTimes: [] });
const PRICE_TYPES = [
    { id: 'standard', label: 'Standard', color: 'bg-sky-500', hint: 'per seat' },
    { id: 'vip', label: 'VIP', color: 'bg-amber-400', hint: 'per seat' },
    { id: 'couple', label: 'Couple', color: 'bg-pink-500', hint: 'per person · pair × 2' },
    { id: 'accessible', label: 'Accessible', color: 'bg-emerald-500', hint: 'per seat' },
];
const DEFAULT_PRICES = { standard: 1500, vip: 2200, couple: 2000, accessible: 1500 };

const priceRange = showtime => {
    const values = Object.values(showtime.seat_prices || {}).map(Number).filter(value => value > 0);
    if (!values.length) return money(showtime.price);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return minimum === maximum ? money(minimum) : `${money(minimum)} – ${money(maximum)}`;
};

const localDateValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AdminShowtimes = () => {
    const [movies, setMovies] = useState([]);
    const [screens, setScreens] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [movieId, setMovieId] = useState('');
    const [screenId, setScreenId] = useState('');
    const [seatPrices, setSeatPrices] = useState(DEFAULT_PRICES);
    const [scheduleDays, setScheduleDays] = useState([emptyDay()]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const minimumDate = useMemo(() => localDateValue(new Date()), []);

    const loadData = useCallback(async () => {
        try {
            const [movieData, screenData, showtimeData] = await Promise.all([
                cinemaApi.listAdminMovies(),
                cinemaApi.listScreens(),
                cinemaApi.listShowtimes(),
            ]);
            setMovies(movieData);
            setScreens(screenData);
            setShowtimes(showtimeData);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const updateDate = (dayIndex, date) => setScheduleDays(days => days.map((day, index) => index === dayIndex ? { ...day, date } : day));
    const updateDayTimes = (dayIndex, transform) => setScheduleDays(days => {
        const nextTimes = transform(days[dayIndex].times);
        if (dayIndex !== 0) return days.map((day, index) => index === dayIndex ? { ...day, times: nextTimes } : day);
        return days.map((day, index) => {
            if (index === 0) return { ...day, times: nextTimes };
            if (!day.syncWithFirst) return day;
            const exclusions = new Set(day.excludedTemplateTimes || []);
            return { ...day, times: nextTimes.filter(time => !exclusions.has(time)) };
        });
    });
    const updateTime = (dayIndex, timeIndex, time) => updateDayTimes(dayIndex, times => times.map((value, slot) => slot === timeIndex ? time : value));
    const addTime = dayIndex => updateDayTimes(dayIndex, times => [...times, '']);
    const removeTime = (dayIndex, timeIndex) => setScheduleDays(days => {
        const targetDay = days[dayIndex];
        if (dayIndex > 0 && targetDay.syncWithFirst) {
            const removedTime = targetDay.times[timeIndex];
            return days.map((day, index) => index === dayIndex ? {
                ...day,
                times: day.times.filter((_, slot) => slot !== timeIndex),
                excludedTemplateTimes: [...new Set([...(day.excludedTemplateTimes || []), removedTime])],
            } : day);
        }

        const nextTimes = targetDay.times.filter((_, slot) => slot !== timeIndex);
        if (dayIndex !== 0) return days.map((day, index) => index === dayIndex ? { ...day, times: nextTimes } : day);
        return days.map((day, index) => {
            if (index === 0) return { ...day, times: nextTimes };
            if (!day.syncWithFirst) return day;
            const exclusions = new Set(day.excludedTemplateTimes || []);
            return { ...day, times: nextTimes.filter(time => !exclusions.has(time)) };
        });
    });
    const addDate = () => setScheduleDays(days => [...days, emptyDay()]);
    const removeDate = dayIndex => setScheduleDays(days => days.filter((_, index) => index !== dayIndex));
    const toggleFirstDateSync = dayIndex => setScheduleDays(days => days.map((day, index) => {
        if (index !== dayIndex) return day;
        if (day.syncWithFirst) return { ...day, syncWithFirst: false };
        return { ...day, times: [...days[0].times], syncWithFirst: true, excludedTemplateTimes: [] };
    }));
    const syncAllDates = () => setScheduleDays(days => days.map((day, index) => index === 0 ? day : { ...day, times: [...days[0].times], syncWithFirst: true, excludedTemplateTimes: [] }));
    const updateSeatPrice = (type, value) => setSeatPrices(current => ({ ...current, [type]: value }));

    const slotCount = scheduleDays.reduce((total, day) => total + day.times.length, 0);

    const handleSubmit = async event => {
        event.preventDefault();
        const movie = movies.find(item => item.id === Number(movieId));
        if (!movie) return;
        const invalidPrice = PRICE_TYPES.some(type => !Number.isFinite(Number(seatPrices[type.id])) || Number(seatPrices[type.id]) <= 0);
        if (invalidPrice) {
            setMessage({ type: 'error', text: 'Enter a valid price greater than zero for every seat type.' });
            return;
        }

        const rawSlots = scheduleDays.flatMap(day => day.times.map(time => `${day.date}T${time}`));
        if (new Set(rawSlots).size !== rawSlots.length) {
            setMessage({ type: 'error', text: 'The same date and time was added more than once.' });
            return;
        }

        const slots = rawSlots.map(value => {
            const start = new Date(value);
            const end = new Date(start.getTime() + movie.duration_mins * 60000);
            return { start_time: start.toISOString(), end_time: end.toISOString() };
        });

        setSaving(true);
        setMessage(null);
        try {
            const createdCount = await cinemaApi.createShowtimes({
                movieId: Number(movieId),
                screenId: Number(screenId),
                price: Math.round(Number(seatPrices.standard) * 100),
                seatPrices: Object.fromEntries(PRICE_TYPES.map(type => [type.id, Math.round(Number(seatPrices[type.id]) * 100)])),
                slots,
            });
            setMessage({ type: 'success', text: `${createdCount} showtime${createdCount === 1 ? '' : 's'} published successfully. Customers can now see them.` });
            setScheduleDays([emptyDay()]);
            await loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const deleteShowtime = async showtime => {
        if (!window.confirm(`Delete the ${showtime.movie_title} showtime?`)) return;
        try {
            await cinemaApi.deleteShowtime(showtime.id);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Could not delete showtime' });
            return;
        }
        setMessage({ type: 'success', text: 'Showtime deleted.' });
        loadData();
    };

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <main className="flex-1 p-8 min-w-0">
                <header className="mb-7"><h1 className="text-3xl font-bold">Showtime Management</h1><p className="text-gray-400 mt-1">Schedule different times across multiple dates in one step.</p></header>
                {message && <div className={`p-4 rounded-xl border mb-6 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'}`}>{message.text}</div>}

                <section className="glass-panel p-6 mb-8">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6"><div><h2 className="text-xl font-bold flex items-center gap-2"><CalendarClock className="text-primary" size={21} /> Build a movie schedule</h2><p className="text-sm text-gray-400 mt-1">Choose the movie and screen once, then add every date and time below.</p></div><span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">{slotCount} time slot{slotCount === 1 ? '' : 's'}</span></div>
                    {(movies.length === 0 || screens.length === 0) && <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg mb-5">Add at least one movie and one cinema screen before scheduling showtimes.</div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <label><span className="text-sm text-gray-300 block mb-2">Movie *</span><select className="input-field" value={movieId} onChange={event => setMovieId(event.target.value)} required><option value="">Select movie</option>{movies.map(movie => <option key={movie.id} value={movie.id}>{movie.title} ({formatDuration(movie.duration_mins)})</option>)}</select></label>
                            <label><span className="text-sm text-gray-300 block mb-2">Cinema / screen *</span><select className="input-field" value={screenId} onChange={event => setScreenId(event.target.value)} required><option value="">Select screen</option>{screens.map(screen => <option key={screen.id} value={screen.id}>{screen.name}</option>)}</select></label>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/15 p-5">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 font-bold"><Tags size={18} className="text-primary" /> Seat-type prices</h3><p className="mt-1 text-xs text-slate-400">Set the LKR price for one person. A joined Couple seat automatically charges for two people.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Live booking prices</span></div>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {PRICE_TYPES.map(type => <label key={type.id} className="rounded-xl border border-white/[0.08] bg-[#0b1018] p-3 transition-colors focus-within:border-primary/40"><span className="mb-2 flex items-center gap-2"><i className={`h-4 w-4 rounded-t ${type.color}`} /><strong className="text-sm">{type.label}</strong></span><span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs font-bold text-slate-500">LKR</span><input aria-label={`${type.label} seat price in LKR`} type="number" inputMode="decimal" min="1" step="0.01" className="input-field input-prefix" value={seatPrices[type.id]} onChange={event => updateSeatPrice(type.id, event.target.value)} required /></span><span className="mt-1.5 block text-[10px] uppercase tracking-wider text-slate-600">{type.hint}</span></label>)}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {scheduleDays.map((day, dayIndex) => (
                                <div key={dayIndex} className="rounded-xl border border-white/10 bg-black/15 p-5">
                                    <div className="flex flex-wrap items-end gap-4">
                                        <label className="min-w-[220px]"><span className="flex items-center gap-2 text-sm text-gray-300 mb-2"><CalendarDays size={16} className="text-primary" /> Show date {dayIndex + 1}</span><input type="date" min={minimumDate} className="input-field" value={day.date} onChange={event => updateDate(dayIndex, event.target.value)} required /></label>
                                        <div className="min-w-[180px]">
                                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Time template</span>
                                            {dayIndex === 0 ? (
                                                <button type="button" onClick={syncAllDates} disabled={scheduleDays.length === 1} className="flex h-12 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-300 transition-colors hover:border-primary/35 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"><Link2 size={16} /> Sync all dates</button>
                                            ) : (
                                                <button type="button" onClick={() => toggleFirstDateSync(dayIndex)} className={`flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${day.syncWithFirst ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-slate-300 hover:border-primary/35 hover:bg-primary/10 hover:text-primary'}`}>{day.syncWithFirst ? <><Unlink2 size={16} /> Stop sync</> : <><Link2 size={16} /> Use date 1 times</>}</button>
                                            )}
                                        </div>
                                        <div className="flex-1"><span className="mb-2 flex items-center gap-2 text-sm text-gray-300"><Clock3 size={16} className="text-primary" /> Times on this date {day.syncWithFirst && <small className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-300">Live synced{day.excludedTemplateTimes?.length ? ' · customized' : ''}</small>}</span><div className="flex flex-wrap gap-2">{day.times.map((time, timeIndex) => <div key={timeIndex} className="flex items-center gap-1"><input type="time" className="input-field w-36" value={time} onChange={event => updateTime(dayIndex, timeIndex, event.target.value)} disabled={day.syncWithFirst} required />{day.times.length > 1 && <button type="button" onClick={() => removeTime(dayIndex, timeIndex)} className="p-2 text-gray-500 hover:text-red-400" title={day.syncWithFirst ? 'Exclude this time from this date' : 'Remove time'}><X size={17} /></button>}</div>)}{!day.syncWithFirst && <button type="button" onClick={() => addTime(dayIndex)} className="btn-secondary flex items-center gap-1 px-3"><Plus size={16} /> Add time</button>}</div></div>
                                        {dayIndex > 0 && <button type="button" onClick={() => removeDate(dayIndex)} className="p-3 text-gray-500 hover:text-red-400" title="Remove date"><Trash2 size={18} /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-between gap-3"><button type="button" onClick={addDate} className="btn-secondary flex items-center gap-2"><Plus size={17} /> Add another date</button><button disabled={saving || movies.length === 0 || screens.length === 0} className="btn-primary px-8">{saving ? 'Publishing schedule...' : `Publish ${slotCount} Showtime${slotCount === 1 ? '' : 's'}`}</button></div>
                    </form>
                </section>

                <section><h2 className="text-xl font-bold mb-4">Published showtimes</h2>{showtimes.length === 0 ? <div className="glass-panel p-12 text-center text-gray-400"><CalendarClock size={42} className="mx-auto mb-3 text-gray-600" />No showtimes scheduled.</div> : <div className="overflow-x-auto glass-panel"><table className="w-full text-left"><thead className="text-xs uppercase tracking-wider text-gray-400 border-b border-white/10"><tr><th className="p-4">Movie</th><th className="p-4">Cinema</th><th className="p-4">Date</th><th className="p-4">Start–end</th><th className="p-4">Seat prices</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{showtimes.map(showtime => { const start = new Date(showtime.start_time); const end = new Date(showtime.end_time); const upcoming = start >= new Date(); return <tr key={showtime.id} className="border-b border-white/5 last:border-0"><td className="p-4 font-semibold">{showtime.movie_title}</td><td className="p-4 text-gray-300">{showtime.screen_name}</td><td className="p-4 text-gray-300">{start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td><td className="p-4 text-gray-300">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td className="p-4"><span className="font-semibold">{priceRange(showtime)}</span><span className="mt-1 block text-xs text-slate-500">per seat</span></td><td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${upcoming ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-500/15 text-gray-400'}`}>{upcoming ? 'Upcoming' : 'Ended'}</span></td><td className="p-4 text-right"><button onClick={() => deleteShowtime(showtime)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={17} /></button></td></tr>; })}</tbody></table></div>}</section>
            </main>
        </div>
    );
};

export default AdminShowtimes;

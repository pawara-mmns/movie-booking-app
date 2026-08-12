import { useCallback, useEffect, useState } from 'react';
import { Clock3, Film, ImagePlus, Link2, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { cinemaApi } from '../lib/cinemaApi';
import { formatDuration } from '../lib/formatters';
import { notify } from '../lib/notifications';

const emptyMovie = { title: '', description: '', duration_mins: 120, poster_url: '', genre: '', rating: 'PG-13' };

const FieldLabel = ({ children, optional = false }) => (
    <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-300">
        {children}{optional && <small className="font-normal text-slate-600">Optional</small>}
    </span>
);

const AdminMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(emptyMovie);
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [durationInputs, setDurationInputs] = useState({ hours: '2', minutes: '0' });

    const fetchMovies = useCallback(async () => {
        setLoading(true);
        try {
            setMovies(await cinemaApi.listAdminMovies());
        } catch (error) {
            notify.error(error, 'Could not load movies.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMovies(); }, [fetchMovies]);
    useEffect(() => () => {
        if (posterPreview.startsWith('blob:')) URL.revokeObjectURL(posterPreview);
    }, [posterPreview]);

    const resetPosterUpload = () => {
        setPosterFile(null);
        setPosterPreview('');
    };

    const openNew = () => {
        setEditingId(null);
        setFormData(emptyMovie);
        setDurationInputs({ hours: '2', minutes: '0' });
        resetPosterUpload();
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openEdit = movie => {
        setEditingId(movie.id);
        setFormData({ title: movie.title, description: movie.description || '', duration_mins: movie.duration_mins, poster_url: movie.poster_url || '', genre: movie.genre, rating: movie.rating });
        setDurationInputs({ hours: String(Math.floor(movie.duration_mins / 60)), minutes: String(movie.duration_mins % 60) });
        setPosterFile(null);
        setPosterPreview(movie.poster_url || '');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async event => {
        event.preventDefault();
        if (formData.duration_mins < 1) {
            notify.warning('Movie duration must be at least 1 minute.');
            return;
        }
        setSaving(true);
        try {
            const posterUrl = posterFile ? await cinemaApi.uploadMoviePoster(posterFile) : formData.poster_url;
            await cinemaApi.saveMovie({ ...formData, poster_url: posterUrl }, editingId);
            notify.success(editingId ? 'Movie updated successfully.' : 'Movie published successfully.');
            setShowForm(false);
            setEditingId(null);
            setFormData(emptyMovie);
            setDurationInputs({ hours: '2', minutes: '0' });
            resetPosterUpload();
            await fetchMovies();
        } catch (error) {
            notify.error(error, 'Could not save the movie.');
        } finally {
            setSaving(false);
        }
    };

    const selectPoster = event => {
        const file = event.target.files?.[0] || null;
        setPosterFile(file);
        setPosterPreview(file ? URL.createObjectURL(file) : formData.poster_url);
    };

    const clearPosterSelection = () => {
        setPosterFile(null);
        setPosterPreview(formData.poster_url);
    };

    const updateDuration = (part, value) => {
        if (value !== '' && !/^\d+$/.test(value)) return;
        const nextInputs = { ...durationInputs, [part]: value };
        setDurationInputs(nextInputs);
        const hours = Math.max(0, Number(nextInputs.hours) || 0);
        const minutes = Math.min(59, Math.max(0, Number(nextInputs.minutes) || 0));
        setFormData({ ...formData, duration_mins: Math.min(600, (hours * 60) + minutes) });
    };

    const normalizeDuration = part => {
        const maximum = part === 'hours' ? 10 : 59;
        const normalized = String(Math.min(maximum, Math.max(0, Number(durationInputs[part]) || 0)));
        updateDuration(part, normalized);
    };

    const deleteMovie = async movie => {
        if (!window.confirm(`Delete “${movie.title}”?`)) return;
        try {
            await cinemaApi.deleteMovie(movie.id);
            notify.success('Movie deleted.');
            await fetchMovies();
        } catch (error) {
            notify.error(error, 'Could not delete movie.');
        }
    };

    return (
        <div className="flex min-h-screen bg-[#090d14] text-white">
            <AdminSidebar />
            <main className="min-w-0 flex-1 px-5 py-7 sm:px-7 lg:px-10">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
                    <div><p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-amber-400">Content library</p><h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Movies</h1><p className="mt-2 text-sm text-slate-400">Add a movie once and use it across every cinema schedule.</p></div>
                    <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300"><Plus size={18} /> Add movie</button>
                </header>

                {showForm && (
                    <section className="mb-10 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#111722] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
                        <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-7">
                            <div><h2 className="text-xl font-black tracking-[-0.02em]">{editingId ? 'Edit movie' : 'Add a new movie'}</h2><p className="mt-1 text-sm text-slate-400">Complete the essentials, add a poster, and publish.</p></div>
                            <button type="button" onClick={() => setShowForm(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label="Close movie form"><X size={19} /></button>
                        </header>

                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px] xl:gap-10">
                                <div className="space-y-6">
                                    <section>
                                        <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Movie details</h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <label className="md:col-span-2"><FieldLabel>Movie title *</FieldLabel><input autoFocus className="input-field" value={formData.title} onChange={event => setFormData({ ...formData, title: event.target.value })} placeholder="e.g. The Odyssey" required /></label>
                                            <label><FieldLabel>Genre *</FieldLabel><input className="input-field" value={formData.genre} onChange={event => setFormData({ ...formData, genre: event.target.value })} placeholder="e.g. Action, Adventure" required /></label>
                                            <label><FieldLabel>Age rating *</FieldLabel><select className="input-field" value={formData.rating} onChange={event => setFormData({ ...formData, rating: event.target.value })}><option>G</option><option>PG</option><option>PG-13</option><option>R</option><option>18+</option></select></label>
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-white/[0.07] bg-[#0c121b] p-4 sm:p-5">
                                        <div className="mb-4 flex items-center justify-between gap-4"><div><h3 className="flex items-center gap-2 font-bold"><Clock3 size={17} className="text-amber-400" /> Runtime</h3><p className="mt-1 text-xs text-slate-500">Enter hours and remaining minutes.</p></div><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">{formatDuration(formData.duration_mins)}</span></div>
                                        <fieldset className="grid grid-cols-2 gap-3"><legend className="sr-only">Movie duration</legend><label><span className="mb-1.5 block text-xs font-semibold text-slate-400">Hours</span><div className="relative"><input type="number" inputMode="numeric" min="0" max="10" className="input-field input-suffix" value={durationInputs.hours} onChange={event => updateDuration('hours', event.target.value)} onBlur={() => normalizeDuration('hours')} aria-label="Duration hours" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">hrs</span></div></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-400">Minutes</span><div className="relative"><input type="number" inputMode="numeric" min="0" max="59" className="input-field input-suffix" value={durationInputs.minutes} onChange={event => updateDuration('minutes', event.target.value)} onBlur={() => normalizeDuration('minutes')} aria-label="Duration minutes" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">min</span></div></label></fieldset>
                                    </section>

                                    <label className="block"><FieldLabel optional>Description</FieldLabel><textarea rows="5" className="input-field resize-y" value={formData.description} onChange={event => setFormData({ ...formData, description: event.target.value })} placeholder="Write a short synopsis customers can scan quickly…" /></label>
                                </div>

                                <aside className="lg:border-l lg:border-white/[0.07] lg:pl-7 xl:pl-10">
                                    <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Movie poster</h3>
                                    <div className="mx-auto aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c121b] shadow-xl">
                                        {posterPreview ? <img src={posterPreview} alt="Poster preview" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center text-slate-600"><ImagePlus size={38} /><div><p className="text-sm font-semibold text-slate-500">Poster preview</p><p className="mt-1 text-xs">2:3 artwork works best</p></div></div>}
                                    </div>
                                    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300"><Upload size={17} /> {posterFile ? 'Change image' : 'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={selectPoster} className="sr-only" /></label>
                                    {posterFile && <div className="mt-3 flex items-center justify-between gap-2 text-xs"><span className="truncate text-emerald-300">{posterFile.name}</span><button type="button" onClick={clearPosterSelection} className="shrink-0 text-red-300 hover:text-red-200">Remove</button></div>}
                                    <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-600"><span className="h-px flex-1 bg-white/[0.07]" />or use URL<span className="h-px flex-1 bg-white/[0.07]" /></div>
                                    <label><FieldLabel optional>Poster URL</FieldLabel><span className="relative block"><Link2 size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-600" /><input type="url" className="input-field input-icon-prefix text-sm" value={formData.poster_url} onChange={event => { setFormData({ ...formData, poster_url: event.target.value }); if (!posterFile) setPosterPreview(event.target.value); }} placeholder="https://…" /></span></label>
                                    <p className="mt-3 text-xs leading-5 text-slate-600">JPG, PNG, WebP or AVIF. Maximum 5 MB.</p>
                                </aside>
                            </div>

                            <footer className="flex flex-col-reverse gap-3 border-t border-white/[0.07] bg-[#0d131d] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
                                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 py-3 text-sm font-bold text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white">Cancel</button>
                                <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">{saving ? posterFile ? 'Uploading poster…' : 'Saving…' : <><Save size={17} /> {editingId ? 'Save changes' : 'Publish movie'}</>}</button>
                            </footer>
                        </form>
                    </section>
                )}

                <section>
                    <div className="mb-5 flex items-end justify-between gap-4"><div><h2 className="text-xl font-black tracking-[-0.02em]">Movie library</h2><p className="mt-1 text-sm text-slate-500">{movies.length} movie{movies.length === 1 ? '' : 's'} ready to schedule</p></div>{!showForm && <button onClick={openNew} className="hidden items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 sm:flex"><Plus size={16} /> Add another</button>}</div>
                    {loading ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-white/[0.05]" />)}</div> : movies.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center"><Film className="mx-auto mb-3 text-slate-700" size={40} /><h3 className="font-bold">No movies yet</h3><p className="mt-2 text-sm text-slate-500">Add your first movie to start building showtimes.</p><button onClick={openNew} className="mt-5 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950">Add first movie</button></div> : (
                        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                            {movies.map(movie => <article key={movie.id} className="group flex min-w-0 gap-4 rounded-2xl border border-white/[0.07] bg-[#111722] p-3 transition-colors hover:border-white/[0.14]"><div className="h-32 w-[86px] shrink-0 overflow-hidden rounded-xl bg-[#0c121b]">{movie.poster_url ? <img src={movie.poster_url} className="h-full w-full object-cover" alt={movie.title} /> : <div className="grid h-full place-items-center"><Film className="text-slate-700" /></div>}</div><div className="flex min-w-0 flex-1 flex-col py-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate font-black text-white">{movie.title}</h3><p className="mt-1 truncate text-xs font-semibold text-amber-400">{movie.genre}</p></div><div className="flex shrink-0"><button onClick={() => openEdit(movie)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-amber-300" title="Edit movie"><Pencil size={15} /></button><button onClick={() => deleteMovie(movie)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-400/10 hover:text-red-300" title="Delete movie"><Trash2 size={15} /></button></div></div><p className="mt-3 text-xs text-slate-400">{formatDuration(movie.duration_mins)} <span className="mx-1 text-slate-700">•</span> {movie.rating}</p><p className="mt-auto line-clamp-2 text-xs leading-5 text-slate-500">{movie.description || 'No description provided.'}</p></div></article>)}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminMovies;

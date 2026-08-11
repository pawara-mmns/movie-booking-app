import { useCallback, useEffect, useState } from 'react';
import { Film, Pencil, Plus, Trash2, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { cinemaApi } from '../lib/cinemaApi';

const emptyMovie = { title: '', description: '', duration_mins: 120, poster_url: '', genre: '', rating: 'PG-13' };

const AdminMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(emptyMovie);
    const [message, setMessage] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchMovies = useCallback(async () => {
        setLoading(true);
        try {
            setMovies(await cinemaApi.listAdminMovies());
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMovies(); }, [fetchMovies]);

    const openNew = () => {
        setEditingId(null);
        setFormData(emptyMovie);
        setShowForm(true);
        setMessage(null);
    };

    const openEdit = movie => {
        setEditingId(movie.id);
        setFormData({ title: movie.title, description: movie.description || '', duration_mins: movie.duration_mins, poster_url: movie.poster_url || '', genre: movie.genre, rating: movie.rating });
        setShowForm(true);
        setMessage(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await cinemaApi.saveMovie(formData, editingId);
            setMessage({ type: 'success', text: editingId ? 'Movie updated successfully.' : 'Movie added successfully.' });
            setShowForm(false);
            setEditingId(null);
            setFormData(emptyMovie);
            await fetchMovies();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const deleteMovie = async movie => {
        if (!window.confirm(`Delete “${movie.title}”?`)) return;
        setMessage(null);
        try {
            await cinemaApi.deleteMovie(movie.id);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Could not delete movie' });
            return;
        }
        setMessage({ type: 'success', text: 'Movie deleted.' });
        fetchMovies();
    };

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex flex-wrap justify-between items-center gap-4 mb-7">
                    <div><h1 className="text-3xl font-bold">Movie Management</h1><p className="text-gray-400 mt-1">These details appear directly in the customer movie catalog.</p></div>
                    <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={19} /> Add Movie</button>
                </header>

                {message && <div className={`p-4 rounded-xl border mb-6 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'}`}>{message.text}</div>}

                {showForm && (
                    <section className="glass-panel p-6 mb-8">
                        <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold">{editingId ? 'Edit Movie' : 'Add New Movie'}</h2><button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X /></button></div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label><span className="text-sm text-gray-300 block mb-2">Movie title *</span><input className="input-field" value={formData.title} onChange={event => setFormData({ ...formData, title: event.target.value })} required /></label>
                            <label><span className="text-sm text-gray-300 block mb-2">Poster image URL</span><input type="url" className="input-field" value={formData.poster_url} onChange={event => setFormData({ ...formData, poster_url: event.target.value })} placeholder="https://..." /></label>
                            <label><span className="text-sm text-gray-300 block mb-2">Genre *</span><input className="input-field" value={formData.genre} onChange={event => setFormData({ ...formData, genre: event.target.value })} placeholder="Action, Drama" required /></label>
                            <label><span className="text-sm text-gray-300 block mb-2">Duration (minutes) *</span><input type="number" min="1" max="600" className="input-field" value={formData.duration_mins} onChange={event => setFormData({ ...formData, duration_mins: Number(event.target.value) })} required /></label>
                            <label><span className="text-sm text-gray-300 block mb-2">Age rating *</span><select className="input-field" value={formData.rating} onChange={event => setFormData({ ...formData, rating: event.target.value })}><option>G</option><option>PG</option><option>PG-13</option><option>R</option><option>18+</option></select></label>
                            <label className="md:col-span-2"><span className="text-sm text-gray-300 block mb-2">Description</span><textarea rows="4" className="input-field resize-y" value={formData.description} onChange={event => setFormData({ ...formData, description: event.target.value })} /></label>
                            <div className="md:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary">{saving ? 'Saving...' : editingId ? 'Update Movie' : 'Publish Movie'}</button></div>
                        </form>
                    </section>
                )}

                {loading ? <div className="py-20 text-center text-gray-400">Loading movies...</div> : movies.length === 0 ? <div className="glass-panel py-20 text-center"><Film className="mx-auto text-gray-600 mb-3" size={42} /><p className="text-gray-400">No movies added yet.</p></div> : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {movies.map(movie => (
                            <article key={movie.id} className="glass-panel p-4 flex gap-5">
                                <div className="w-28 h-40 rounded-lg bg-slate-900 overflow-hidden shrink-0">{movie.poster_url ? <img src={movie.poster_url} className="w-full h-full object-cover" alt={movie.title} /> : <div className="h-full flex items-center justify-center"><Film className="text-gray-700" /></div>}</div>
                                <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-xl truncate">{movie.title}</h3><p className="text-sm text-primary mt-1">{movie.genre} · {movie.duration_mins} min · {movie.rating}</p></div><div className="flex gap-2"><button onClick={() => openEdit(movie)} className="p-2 text-gray-400 hover:text-primary" title="Edit"><Pencil size={18} /></button><button onClick={() => deleteMovie(movie)} className="p-2 text-gray-400 hover:text-red-400" title="Delete"><Trash2 size={18} /></button></div></div><p className="text-gray-400 text-sm mt-4 line-clamp-3">{movie.description || 'No description provided.'}</p></div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminMovies;

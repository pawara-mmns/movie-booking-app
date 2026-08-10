import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';

const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);

const AdminShowtimes = () => {
    const { user } = useAuth();
    const [movies, setMovies] = useState([]);
    const [screens, setScreens] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [movieId, setMovieId] = useState('');
    const [screenId, setScreenId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [price, setPrice] = useState(1500);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const headers = useCallback(() => ({ Authorization: `Bearer ${user.token}` }), [user.token]);

    const loadData = useCallback(async () => {
        try {
            const [movieResponse, screenResponse, showtimeResponse] = await Promise.all([
                fetch('/api/admin/movies', { headers: headers() }),
                fetch('/api/admin/screens', { headers: headers() }),
                fetch('/api/admin/showtimes', { headers: headers() }),
            ]);
            if (!movieResponse.ok || !screenResponse.ok || !showtimeResponse.ok) throw new Error('Could not load showtime data');
            setMovies(await movieResponse.json());
            setScreens(await screenResponse.json());
            setShowtimes(await showtimeResponse.json());
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    }, [headers]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSubmit = async event => {
        event.preventDefault();
        const movie = movies.find(item => item.id === Number(movieId));
        const start = new Date(startTime);
        const end = new Date(start.getTime() + (movie?.duration_mins || 120) * 60000);
        setSaving(true);
        setMessage(null);
        try {
            const response = await fetch('/api/admin/showtimes', { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ movie_id: Number(movieId), screen_id: Number(screenId), start_time: start.toISOString(), end_time: end.toISOString(), price: Math.round(Number(price) * 100) }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Could not schedule showtime');
            setMessage({ type: 'success', text: 'Showtime published. Customers can now see it.' });
            setStartTime('');
            await loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const deleteShowtime = async showtime => {
        if (!window.confirm(`Delete the ${showtime.movie_title} showtime?`)) return;
        const response = await fetch(`/api/admin/showtimes/${showtime.id}`, { method: 'DELETE', headers: headers() });
        if (!response.ok) {
            const data = await response.json();
            setMessage({ type: 'error', text: data.detail || 'Could not delete showtime' });
            return;
        }
        setMessage({ type: 'success', text: 'Showtime deleted.' });
        loadData();
    };

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <main className="flex-1 p-8 min-w-0">
                <header className="mb-7"><h1 className="text-3xl font-bold">Showtime Management</h1><p className="text-gray-400 mt-1">A movie appears to customers only after it has a future showtime.</p></header>
                {message && <div className={`p-4 rounded-xl border mb-6 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'}`}>{message.text}</div>}
                <section className="glass-panel p-6 mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-5"><Plus className="text-primary" size={20} /> Schedule a showtime</h2>
                    {(movies.length === 0 || screens.length === 0) && <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg mb-5">Add at least one movie and one cinema screen before scheduling a showtime.</div>}
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
                        <label><span className="text-sm text-gray-300 block mb-2">Movie *</span><select className="input-field" value={movieId} onChange={event => setMovieId(event.target.value)} required><option value="">Select movie</option>{movies.map(movie => <option key={movie.id} value={movie.id}>{movie.title}</option>)}</select></label>
                        <label><span className="text-sm text-gray-300 block mb-2">Cinema / screen *</span><select className="input-field" value={screenId} onChange={event => setScreenId(event.target.value)} required><option value="">Select screen</option>{screens.map(screen => <option key={screen.id} value={screen.id}>{screen.name}</option>)}</select></label>
                        <label><span className="text-sm text-gray-300 block mb-2">Start date & time *</span><input type="datetime-local" className="input-field" value={startTime} onChange={event => setStartTime(event.target.value)} required /></label>
                        <label><span className="text-sm text-gray-300 block mb-2">Ticket price (LKR) *</span><input type="number" min="1" step="0.01" className="input-field" value={price} onChange={event => setPrice(event.target.value)} required /></label>
                        <button disabled={saving || movies.length === 0 || screens.length === 0} className="btn-primary md:col-span-2 xl:col-span-4 justify-self-end">{saving ? 'Publishing...' : 'Publish Showtime'}</button>
                    </form>
                </section>

                <section><h2 className="text-xl font-bold mb-4">All showtimes</h2>{showtimes.length === 0 ? <div className="glass-panel p-12 text-center text-gray-400"><CalendarClock size={42} className="mx-auto mb-3 text-gray-600" />No showtimes scheduled.</div> : <div className="overflow-x-auto glass-panel"><table className="w-full text-left"><thead className="text-xs uppercase tracking-wider text-gray-400 border-b border-white/10"><tr><th className="p-4">Movie</th><th className="p-4">Cinema</th><th className="p-4">Date & time</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{showtimes.map(showtime => { const upcoming = new Date(showtime.start_time) >= new Date(); return <tr key={showtime.id} className="border-b border-white/5 last:border-0"><td className="p-4 font-semibold">{showtime.movie_title}</td><td className="p-4 text-gray-300">{showtime.screen_name}</td><td className="p-4 text-gray-300">{new Date(showtime.start_time).toLocaleString()}</td><td className="p-4">{money(showtime.price)}</td><td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${upcoming ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-500/15 text-gray-400'}`}>{upcoming ? 'Upcoming' : 'Ended'}</span></td><td className="p-4 text-right"><button onClick={() => deleteShowtime(showtime)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={17} /></button></td></tr>; })}</tbody></table></div>}</section>
            </main>
        </div>
    );
};

export default AdminShowtimes;

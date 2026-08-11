import { createElement, useCallback, useEffect, useState } from 'react';
import { CalendarClock, DollarSign, Film, Monitor, Plus, RefreshCw, Ticket, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { cinemaApi } from '../lib/cinemaApi';

const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);
const initialStats = { customers: 0, movies: 0, active_showtimes: 0, confirmed_bookings: 0, tickets_sold: 0, revenue: 0, recent_bookings: [] };

const StatCard = ({ title, value, icon, color = 'text-primary' }) => (
    <div className="glass-panel p-6 relative overflow-hidden">{createElement(icon, { size: 58, className: `absolute -right-2 -bottom-2 opacity-10 ${color}` })}<div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${color}`}>{createElement(icon, { size: 21 })}</div><p className="text-sm text-gray-400 uppercase tracking-wider">{title}</p><p className="text-3xl font-bold mt-2">{value}</p></div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setStats(await cinemaApi.getDashboard());
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-y-auto min-w-0">
                <header className="flex flex-wrap justify-between items-center gap-4 mb-8"><div><h1 className="text-3xl font-bold">Admin Overview</h1><p className="text-gray-400 mt-1">Manage everything customers see and track booking activity.</p></div><button onClick={loadDashboard} disabled={loading} className="btn-secondary flex items-center gap-2"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh</button></header>
                {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 mb-6">{error}</div>}
                <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                    <StatCard title="Total Revenue" value={money(stats.revenue)} icon={DollarSign} />
                    <StatCard title="Tickets Sold" value={stats.tickets_sold} icon={Ticket} color="text-emerald-400" />
                    <StatCard title="Customers" value={stats.customers} icon={Users} color="text-sky-400" />
                    <StatCard title="Movies" value={stats.movies} icon={Film} color="text-violet-400" />
                    <StatCard title="Upcoming Shows" value={stats.active_showtimes} icon={CalendarClock} color="text-amber-400" />
                    <StatCard title="Confirmed Bookings" value={stats.confirmed_bookings} icon={Ticket} color="text-pink-400" />
                </section>

                <section className="grid md:grid-cols-3 gap-4 mb-8">
                    <Link to="/admin/movies" className="glass-panel p-5 hover:border-primary/40 transition-colors flex items-center gap-4"><span className="p-3 rounded-xl bg-primary/10 text-primary"><Film /></span><div><h3 className="font-semibold">Add Movie</h3><p className="text-sm text-gray-400">Title, poster, genre and details</p></div><Plus className="ml-auto text-gray-500" /></Link>
                    <Link to="/admin/screens" className="glass-panel p-5 hover:border-primary/40 transition-colors flex items-center gap-4"><span className="p-3 rounded-xl bg-sky-500/10 text-sky-400"><Monitor /></span><div><h3 className="font-semibold">Add Cinema Screen</h3><p className="text-sm text-gray-400">Create the customer seat map</p></div><Plus className="ml-auto text-gray-500" /></Link>
                    <Link to="/admin/showtimes" className="glass-panel p-5 hover:border-primary/40 transition-colors flex items-center gap-4"><span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400"><CalendarClock /></span><div><h3 className="font-semibold">Publish Showtime</h3><p className="text-sm text-gray-400">Date, cinema and ticket price</p></div><Plus className="ml-auto text-gray-500" /></Link>
                </section>

                <section className="glass-panel overflow-hidden"><div className="p-6 border-b border-white/10"><h2 className="text-xl font-bold flex items-center gap-2"><Ticket className="text-primary" /> Recent Bookings</h2></div>{stats.recent_bookings.length === 0 ? <div className="p-12 text-center text-gray-400">No bookings recorded yet.</div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-xs uppercase text-gray-400 border-b border-white/10"><tr><th className="p-4">Reference</th><th className="p-4">Customer</th><th className="p-4">Movie</th><th className="p-4">Showtime</th><th className="p-4">Total</th><th className="p-4">Status</th></tr></thead><tbody>{stats.recent_bookings.map(booking => <tr key={booking.id} className="border-b border-white/5 last:border-0"><td className="p-4 font-mono text-primary">{booking.reference}</td><td className="p-4 text-gray-300">{booking.customer_email}</td><td className="p-4 font-medium">{booking.movie_title}</td><td className="p-4 text-gray-400">{new Date(booking.showtime).toLocaleString()}</td><td className="p-4">{money(booking.total_price)}</td><td className="p-4"><span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300">{booking.status}</span></td></tr>)}</tbody></table></div>}</section>
            </main>
        </div>
    );
};

export default AdminDashboard;

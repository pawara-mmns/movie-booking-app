import { DollarSign, Ticket, Film, TrendingUp } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

const StatCard = ({ title, value, change, icon: Icon, colorClass }) => (
    <div className="glass-panel p-6 hover:bg-surfaceHighlight/30 transition-colors group relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <h3 className="text-textMuted text-sm font-medium uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-white mt-3">{value}</p>
            {change && (
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-emerald-500">
                    <TrendingUp size={14} />
                    <span>{change}</span>
                </div>
            )}
        </div>
    </div>
);

const AdminDashboard = () => {
    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />
            <div className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
                        <p className="text-textMuted">Welcome back, Admin. Here's what's happening today.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn-secondary">Download Report</button>
                        <button className="btn-primary">New Movie</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Revenue"
                        value="$12,450"
                        change="+15% from last week"
                        icon={DollarSign}
                        colorClass="text-primary"
                    />
                    <StatCard
                        title="Tickets Sold"
                        value="845"
                        change="+8% from yesterday"
                        icon={Ticket}
                        colorClass="text-secondary"
                    />
                    <StatCard
                        title="Active Movies"
                        value="12"
                        icon={Film}
                        colorClass="text-white"
                    />
                </div>

                <div className="glass-panel p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Ticket className="text-primary" size={24} />
                        Recent Bookings
                    </h3>
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                        <p className="text-gray-400">No bookings recorded yet.</p>
                        <button className="text-primary text-sm mt-2 hover:underline">Refresh Data</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

import { createElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Film, Monitor, LogOut, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const SidebarItem = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border border-transparent",
            isActive
                ? "bg-surfaceHighlight text-white font-medium border-primary/20 shadow-sm"
                : "text-textMuted hover:bg-surfaceHighlight/50 hover:text-white"
        )}>
            {createElement(icon, { size: 20 })}
            <span>{label}</span>
        </Link>
    );
};

const AdminSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="w-64 bg-surface border-r border-white/5 h-screen flex flex-col p-6 sticky top-0">
            <div className="flex items-center gap-3 px-2 mb-10">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Film className="text-primary w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white tracking-tight">CineSphere</h1>
                    <span className="text-xs font-semibold text-textMuted tracking-wider uppercase">Admin Panel</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                <SidebarItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
                <SidebarItem to="/admin/movies" icon={Film} label="Movies" />
                <SidebarItem to="/admin/screens" icon={Monitor} label="Screens" />
                <SidebarItem to="/admin/showtimes" icon={CalendarClock} label="Showtimes" />
            </nav>

            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/5 hover:text-red-400 rounded-lg transition-all duration-200 mt-auto group">
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Logout</span>
            </button>
        </div>
    );
};

export default AdminSidebar;

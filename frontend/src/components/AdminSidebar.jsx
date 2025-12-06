import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Film, Monitor, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const SidebarItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
            isActive
                ? "bg-primary text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
        )}>
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

const AdminSidebar = () => {
    const { logout } = useAuth();

    return (
        <div className="w-64 glass-panel border-r-0 rounded-none h-screen flex flex-col p-6 sticky top-0">
            <div className="flex items-center gap-3 px-2 mb-10">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Film className="text-primary w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">CineSphere</h1>
                    <span className="text-xs font-semibold text-secondary tracking-widest uppercase">Admin Panel</span>
                </div>
            </div>

            <nav className="flex-1 space-y-3">
                <SidebarItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
                <SidebarItem to="/admin/movies" icon={Film} label="Movies" />
                <SidebarItem to="/admin/screens" icon={Monitor} label="Screens" />
                <SidebarItem to="/admin/showtimes" icon={Film} label="Showtimes" />
            </nav>

            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-300 mt-auto group">
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Logout</span>
            </button>
        </div>
    );
};

export default AdminSidebar;

import { Film, LogOut, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerHeader = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
                <Link to="/dashboard" className="flex items-center gap-3 text-white">
                    <span className="p-2 rounded-xl bg-primary/15 text-primary"><Film size={24} /></span>
                    <span className="text-xl font-bold tracking-tight">CineSphere</span>
                </Link>
                <nav className="flex items-center gap-5 text-sm">
                    <Link to="/dashboard" className="text-white flex items-center gap-2 hover:text-primary transition-colors">
                        <Search size={17} /> Browse Movies
                    </Link>
                    <button onClick={handleLogout} className="text-gray-400 flex items-center gap-2 hover:text-red-400 transition-colors">
                        <LogOut size={17} /> Logout
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default CustomerHeader;

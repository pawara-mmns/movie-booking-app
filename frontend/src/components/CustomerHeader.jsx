import { Film, LogIn, LogOut, Search, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerHeader = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
                <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 text-white">
                    <span className="p-2 rounded-xl bg-primary/15 text-primary"><Film size={24} /></span>
                    <span className="text-xl font-bold tracking-tight">CineSphere</span>
                </Link>
                <nav className="flex items-center gap-5 text-sm">
                    <Link to={user ? '/dashboard' : '/'} className="text-white flex items-center gap-2 hover:text-primary transition-colors">
                        <Search size={17} /> Browse Movies
                    </Link>
                    {user ? <button onClick={handleLogout} className="text-gray-400 flex items-center gap-2 hover:text-red-400 transition-colors"><LogOut size={17} /> Logout</button> : <><Link to="/login" className="text-gray-300 flex items-center gap-2 hover:text-white"><LogIn size={17} /> Login</Link><Link to="/register" className="btn-primary flex items-center gap-2 px-4 py-2"><UserPlus size={16} /> Sign up</Link></>}
                </nav>
            </div>
        </header>
    );
};

export default CustomerHeader;

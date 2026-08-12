import { LogIn, LogOut, Menu, Search, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notify } from '../lib/notifications';

const CustomerHeader = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            setMenuOpen(false);
            notify.success('You have been signed out.');
            navigate('/', { replace: true });
        } catch (error) {
            notify.error(error, 'Could not sign out.');
        }
    };

    const homePath = user ? '/dashboard' : '/';

    return (
        <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#090d14]/85 backdrop-blur-2xl">
            <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
                <Link to={homePath} className="group relative h-12 w-[172px] shrink-0 overflow-hidden sm:w-[188px]" aria-label="CineSphere home">
                    <img
                        src="/Logo Seq - BackGround Remove.png"
                        alt="CineSphere"
                        className="pointer-events-none absolute left-1/2 top-1/2 w-[255px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:w-[275px]"
                    />
                </Link>

                <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
                    <Link to={homePath} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white">
                        <Search size={16} /> Movies
                    </Link>
                    <span className="mx-2 h-5 w-px bg-white/10" />
                    {user ? (
                        <>
                            <span className="max-w-48 truncate px-2 text-sm text-slate-400">{user.email}</span>
                            <button onClick={handleLogout} className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300">
                                <LogOut size={16} /> Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"><LogIn size={16} /> Sign in</Link>
                            <Link to="/register" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition-all hover:bg-amber-300"><UserPlus size={16} /> Join free</Link>
                        </>
                    )}
                </nav>

                <button onClick={() => setMenuOpen(open => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-200 md:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {menuOpen && (
                <nav className="border-t border-white/[0.07] bg-[#090d14] px-5 py-4 md:hidden" aria-label="Mobile navigation">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2">
                        <Link to={homePath} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:bg-white/[0.06]"><Search size={17} /> Browse movies</Link>
                        {user ? <button onClick={handleLogout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-red-300 hover:bg-red-400/10"><LogOut size={17} /> Sign out</button> : <><Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 hover:bg-white/[0.06]"><LogIn size={17} /> Sign in</Link><Link to="/register" onClick={() => setMenuOpen(false)} className="mt-1 rounded-xl bg-amber-400 px-4 py-3 text-center font-bold text-slate-950">Create account</Link></>}
                    </div>
                </nav>
            )}
        </header>
    );
};

export default CustomerHeader;

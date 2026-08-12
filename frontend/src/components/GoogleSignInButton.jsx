import { Loader } from 'lucide-react';

const GoogleSignInButton = ({ onClick, loading, label = 'Continue with Google' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/12 bg-white px-5 font-bold text-slate-900 transition-all hover:border-white hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
        {loading ? (
            <Loader size={19} className="animate-spin" />
        ) : (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[17px] font-black leading-none shadow-sm" aria-hidden="true">
                <span className="bg-gradient-to-br from-blue-500 via-red-500 to-amber-400 bg-clip-text text-transparent">G</span>
            </span>
        )}
        {loading ? 'Opening Google…' : label}
    </button>
);

export default GoogleSignInButton;

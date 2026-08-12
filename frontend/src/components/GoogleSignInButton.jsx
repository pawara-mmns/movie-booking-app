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
            <img
                src="/google-icon-logo-svgrepo-com.svg"
                alt=""
                className="h-5 w-5 shrink-0 object-contain"
                aria-hidden="true"
            />
        )}
        {loading ? 'Opening Google…' : label}
    </button>
);

export default GoogleSignInButton;

import { ArrowRight, Loader, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthDivider from '../components/AuthDivider';
import AuthLayout from '../components/AuthLayout';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import { notify } from '../lib/notifications';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedPath = searchParams.get('returnTo');
    const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard';

    const handleSubmit = async event => {
        event.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            notify.success('Welcome back! You are now signed in.');
            navigate(destination, { replace: true });
        } catch (requestError) {
            notify.error(requestError, 'Failed to sign in. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            await loginWithGoogle(destination);
        } catch (requestError) {
            notify.error(requestError, 'Could not start Google sign-in.');
            setGoogleLoading(false);
        }
    };

    return (
        <AuthLayout image="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop" eyebrow="Welcome back" title="Your next great movie night starts here." description="Sign in to choose live seats, confirm bookings, and keep every cinema plan in one place.">
            <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">Member access</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Sign in to CineSphere</h2><p className="mt-3 text-sm leading-6 text-slate-400">Choose Google for a faster sign-in, or use your email and password.</p></div>

            <GoogleSignInButton onClick={handleGoogleLogin} loading={googleLoading} label="Sign in with Google" />
            <AuthDivider />

            <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Email address</span><span className="relative block"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="email" autoComplete="email" className="h-13 w-full rounded-xl border border-white/10 bg-[#0d131d] pl-11 pr-4 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/60" placeholder="name@example.com" value={email} onChange={event => setEmail(event.target.value)} required /></span></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Password</span><span className="relative block"><LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="password" autoComplete="current-password" className="h-13 w-full rounded-xl border border-white/10 bg-[#0d131d] pl-11 pr-4 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/60" placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required /></span></label>
                <button type="submit" disabled={loading || googleLoading} className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 font-black text-slate-950 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader size={19} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" /></>}</button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-400">New to CineSphere? <Link to={`/register?returnTo=${encodeURIComponent(destination)}`} className="font-bold text-amber-400 hover:text-amber-300">Create an account</Link></p>
        </AuthLayout>
    );
};

export default Login;

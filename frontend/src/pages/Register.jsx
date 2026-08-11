import { ArrowRight, Check, Loader, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedPath = searchParams.get('returnTo');
    const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard';

    const handleSubmit = async event => {
        event.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await register(email, password);
            navigate(destination, { replace: true });
        } catch (requestError) {
            setError(requestError.message || 'Failed to create your account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout image="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1800&auto=format&fit=crop" eyebrow="Join CineSphere" title="Great seats should never be complicated." description="Create your free account and move from browsing to a confirmed cinema booking in just a few taps.">
            <div className="mb-7"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">Free membership</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Create your account</h2><p className="mt-3 text-sm leading-6 text-slate-400">Use an email you can access and choose a secure password.</p></div>

            {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Email address</span><span className="relative block"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="email" autoComplete="email" className="h-12 w-full rounded-xl border border-white/10 bg-[#0d131d] pl-11 pr-4 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/60" placeholder="name@example.com" value={email} onChange={event => setEmail(event.target.value)} required /></span></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Password</span><span className="relative block"><LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="password" autoComplete="new-password" minLength="6" className="h-12 w-full rounded-xl border border-white/10 bg-[#0d131d] pl-11 pr-4 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/60" placeholder="At least 6 characters" value={password} onChange={event => setPassword(event.target.value)} required /></span></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Confirm password</span><span className="relative block"><Check size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="password" autoComplete="new-password" minLength="6" className="h-12 w-full rounded-xl border border-white/10 bg-[#0d131d] pl-11 pr-4 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/60" placeholder="Repeat your password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required /></span></label>
                <button type="submit" disabled={loading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 font-black text-slate-950 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader size={19} className="animate-spin" /> Creating account…</> : <>Create account <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" /></>}</button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <Link to={`/login?returnTo=${encodeURIComponent(destination)}`} className="font-bold text-amber-400 hover:text-amber-300">Sign in instead</Link></p>
        </AuthLayout>
    );
};

export default Register;

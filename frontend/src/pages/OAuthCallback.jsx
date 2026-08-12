import { Loader } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notify } from '../lib/notifications';

const safeReturnTo = value => (
    typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
        ? value
        : '/dashboard'
);

const OAuthCallback = () => {
    const { user, loading, oauthReturnToKey } = useAuth();
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;

        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const oauthError = query.get('error_description') || hash.get('error_description');
        if (oauthError) {
            handled.current = true;
            sessionStorage.removeItem(oauthReturnToKey);
            notify.error(oauthError, 'Google sign-in was not completed.');
            navigate('/login', { replace: true });
            return;
        }

        if (loading) return;
        handled.current = true;
        const destination = safeReturnTo(sessionStorage.getItem(oauthReturnToKey));
        sessionStorage.removeItem(oauthReturnToKey);

        if (user) {
            notify.success('Signed in with Google successfully.');
            navigate(destination, { replace: true });
        } else {
            notify.error('Google sign-in could not be completed. Please try again.');
            navigate('/login', { replace: true });
        }
    }, [loading, navigate, oauthReturnToKey, user]);

    return (
        <main className="flex min-h-dvh items-center justify-center bg-[#090d14] px-6 text-white">
            <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300"><Loader className="animate-spin" /></span>
                <h1 className="mt-5 text-xl font-black">Completing Google sign-in</h1>
                <p className="mt-2 text-sm text-slate-400">Please wait while we securely open your CineSphere account.</p>
            </div>
        </main>
    );
};

export default OAuthCallback;

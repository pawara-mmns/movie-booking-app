import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const profileForSession = async session => {
    if (!session?.user) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
    if (error) throw error;
    return {
        id: session.user.id,
        email: session.user.email,
        token: session.access_token,
        role: data.role,
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const syncSession = async session => {
            try {
                const nextUser = await profileForSession(session);
                if (active) setUser(nextUser);
            } catch (error) {
                console.error('Could not load Supabase profile:', error);
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        supabase.auth.getSession().then(({ data }) => syncSession(data.session));
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setTimeout(() => syncSession(session), 0);
        });

        return () => {
            active = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        setUser(await profileForSession(data.session));
    };

    const register = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
        if (!data.session) {
            throw new Error('Account created. Confirm your email, then sign in.');
        }
        setUser(await profileForSession(data.session));
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

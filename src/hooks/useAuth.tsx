import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type MonitoringStatus = 'PENDING' | 'ACTIVE' | 'DISABLED' | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  monitoringStatus: MonitoringStatus;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_INIT_TIMEOUT = 8000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [monitoringStatus, setMonitoringStatus] =
    useState<MonitoringStatus>(null);
  const [loading, setLoading] = useState(true);

  const loadMonitoringStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('monitoring_users')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erreur récupération statut monitoring:', error);
      setMonitoringStatus(null);
      return;
    }

    setMonitoringStatus(
      (data?.status as MonitoringStatus) ?? null
    );
  };

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const finishInitialization = () => {
      if (!mounted || initialized) return;

      initialized = true;
      setLoading(false);
    };

    const timeout = window.setTimeout(() => {
      if (!mounted || initialized) return;

      console.warn(
        'Initialisation Supabase Auth trop longue.'
      );

      // Ne jamais déconnecter automatiquement l'utilisateur.
      // On termine uniquement l'initialisation de l'interface.
      finishInitialization();
    }, AUTH_INIT_TIMEOUT);

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted || initialized) return;

        if (error) {
          console.error(
            'Erreur récupération session:',
            error
          );

          setSession(null);
          setMonitoringStatus(null);
          window.clearTimeout(timeout);
          finishInitialization();
          return;
        }

        // La session Supabase est prioritaire.
        setSession(currentSession);

        // L'interface ne doit pas attendre la BDD
        // pour considérer l'authentification comme initialisée.
        window.clearTimeout(timeout);
        finishInitialization();

        // Le statut monitoring est chargé séparément.
        if (currentSession?.user) {
          void loadMonitoringStatus(currentSession.user.id);
        } else {
          setMonitoringStatus(null);
        }
      } catch (error) {
        if (!mounted || initialized) return;

        console.error(
          'Erreur inattendue lors de l’initialisation Auth:',
          error
        );

        setSession(null);
        setMonitoringStatus(null);

        window.clearTimeout(timeout);
        finishInitialization();
      }
    };

    void initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user) {
          // Ne pas bloquer le changement de session
          // sur la requête monitoring_users.
          void loadMonitoringStatus(newSession.user.id);
        } else {
          setMonitoringStatus(null);
        }
      }
    );

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        monitoringStatus,
        signIn,
        signUp,
        resetPassword,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}
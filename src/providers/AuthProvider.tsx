import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getCurrentRole, type CurrentUserRole } from '@/lib/auth/role';

type Status = 'loading' | 'ready';

type AuthContextValue = {
  status: Status;
  session: Session | null;
  role: CurrentUserRole;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<CurrentUserRole>({ kind: 'anonymous' });

  const refresh = async () => {
    const r = await getCurrentRole();
    setRole(r);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      const r = await getCurrentRole();
      if (!mounted) return;
      setRole(r);
      setStatus('ready');
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      const r = await getCurrentRole();
      setRole(r);
      setStatus('ready');
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, role, refresh }),
    [status, session, role],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}

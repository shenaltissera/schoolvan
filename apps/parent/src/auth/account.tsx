import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';

/** A parent's profile row (public.parents). */
export interface ParentProfile {
  id: string;
  name: string;
  phone: string | null;
}

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; needsConfirmation: true; error: string };

interface AccountContextValue {
  session: Session | null;
  profile: ParentProfile | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<ParentProfile | null> {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, name: data.name, phone: data.phone ?? null };
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    let active = true;
    fetchProfile(userId).then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, [session?.user.id, reloadKey]);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      try {
        let userId = session?.user.id;
        if (!userId) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
          });
          if (error) return { ok: false, error: error.message };
          userId = data.user?.id;
          if (!userId) return { ok: false, error: 'Could not create the account.' };
          if (!data.session) {
            return {
              ok: false,
              needsConfirmation: true,
              error: 'Check your email to confirm your account, then log in.',
            };
          }
        }
        const { error: upsertError } = await supabase
          .from('parents')
          .upsert({ id: userId, name: name.trim() });
        if (upsertError) return { ok: false, error: upsertError.message };
        setReloadKey((k) => k + 1);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' };
      }
    },
    [session?.user.id],
  );

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, signUp, signIn, signOut }),
    [session, profile, loading, signUp, signIn, signOut],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
}

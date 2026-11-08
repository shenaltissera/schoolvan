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

/** A driver's profile, as stored in the `drivers` table (camelCased). */
export interface DriverProfile {
  id: string;
  driverName: string;
  vehicleNumber: string;
  driverPhotoUrl: string | null;
  associationRegNo: string;
  assistantName: string | null;
  assistantPhotoUrl: string | null;
}

/** Fields collected at sign-up. */
export interface SignUpInput {
  email: string;
  password: string;
  driverName: string;
  vehicleNumber: string;
  associationRegNo: string;
  driverPhotoUri: string;
  assistantName?: string;
  assistantPhotoUri?: string;
}

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string }
  // Sign-up succeeded but the email needs confirming before first login.
  | { ok: false; needsConfirmation: true; error: string };

interface AccountContextValue {
  session: Session | null;
  profile: DriverProfile | null;
  /** True until the stored session has been resolved on launch. */
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

const BUCKET = 'driver-photos';

function rowToProfile(row: Record<string, any>): DriverProfile {
  return {
    id: row.id,
    driverName: row.driver_name,
    vehicleNumber: row.vehicle_number,
    driverPhotoUrl: row.driver_photo_url ?? null,
    associationRegNo: row.association_reg_no,
    assistantName: row.assistant_name ?? null,
    assistantPhotoUrl: row.assistant_photo_url ?? null,
  };
}

async function fetchProfile(userId: string): Promise<DriverProfile | null> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data);
}

/** Uploads a local image to the driver's folder and returns its public URL. */
async function uploadPhoto(userId: string, uri: string, name: string): Promise<string> {
  const arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());
  const path = `${userId}/${name}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arraybuffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Resolve the stored session on launch and keep it in sync.
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

  // Load the profile row whenever the signed-in user changes.
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

  const signUp = useCallback(async (input: SignUpInput): Promise<AuthResult> => {
    try {
      // Reuse an existing session (e.g. retrying after a failed profile save).
      let userId = session?.user.id;
      if (!userId) {
        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim(),
          password: input.password,
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

      const driverPhotoUrl = await uploadPhoto(userId, input.driverPhotoUri, 'driver');
      const assistantPhotoUrl = input.assistantPhotoUri
        ? await uploadPhoto(userId, input.assistantPhotoUri, 'assistant')
        : null;

      const { error: upsertError } = await supabase.from('drivers').upsert({
        id: userId,
        driver_name: input.driverName.trim(),
        vehicle_number: input.vehicleNumber.trim(),
        association_reg_no: input.associationRegNo.trim(),
        driver_photo_url: driverPhotoUrl,
        assistant_name: input.assistantName?.trim() || null,
        assistant_photo_url: assistantPhotoUrl,
      });
      if (upsertError) return { ok: false, error: upsertError.message };

      setReloadKey((k) => k + 1);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' };
    }
  }, [session?.user.id]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
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

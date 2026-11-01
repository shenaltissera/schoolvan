import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'schoolvan.driver.account';

/** A registered driver account, stored locally on the device for now. */
export interface DriverAccount {
  driverName: string;
  vehicleNumber: string;
  driverPhotoUri: string;
  /** School driver association registration number. */
  associationRegNo: string;
  assistantName?: string;
  assistantPhotoUri?: string;
  createdAt: string;
}

/** The fields collected at sign-up (everything but the timestamp). */
export type DriverAccountInput = Omit<DriverAccount, 'createdAt'>;

interface AccountContextValue {
  account: DriverAccount | null;
  loading: boolean;
  saveAccount: (input: DriverAccountInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<DriverAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active && raw) setAccount(JSON.parse(raw) as DriverAccount);
      })
      .catch(() => {
        // Ignore read failures — treat as "no account yet".
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const saveAccount = useCallback(async (input: DriverAccountInput) => {
    const next: DriverAccount = { ...input, createdAt: new Date().toISOString() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAccount(next);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAccount(null);
  }, []);

  const value = useMemo(
    () => ({ account, loading, saveAccount, signOut }),
    [account, loading, saveAccount, signOut],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
}

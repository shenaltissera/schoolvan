import { Redirect } from 'expo-router';

import { useAccount } from '@/auth/account';
import AppTabs from '@/components/app-tabs';
import { useRegisterPush } from '@/lib/push';

export default function TabsLayout() {
  const { session, profile, loading } = useAccount();

  // Register this device for push once the parent is signed in.
  useRegisterPush(!!session && !!profile);

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  if (!profile) return null;

  return <AppTabs />;
}

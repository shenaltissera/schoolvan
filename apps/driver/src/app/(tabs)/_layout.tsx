import { Redirect } from 'expo-router';

import { useAccount } from '@/auth/account';
import AppTabs from '@/components/app-tabs';

export default function TabsLayout() {
  const { session, profile, loading } = useAccount();

  // Wait for the stored session to resolve before deciding where to go.
  if (loading) return null;
  // Not signed in → go to login.
  if (!session) return <Redirect href="/login" />;
  // Signed in but profile still loading (or missing) → hold briefly.
  if (!profile) return null;

  return <AppTabs />;
}

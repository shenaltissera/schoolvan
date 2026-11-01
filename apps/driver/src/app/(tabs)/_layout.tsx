import { Redirect } from 'expo-router';

import { useAccount } from '@/auth/account';
import AppTabs from '@/components/app-tabs';

export default function TabsLayout() {
  const { account, loading } = useAccount();

  // Wait for the stored account to load before deciding where to go.
  if (loading) return null;
  if (!account) return <Redirect href="/sign-up" />;

  return <AppTabs />;
}

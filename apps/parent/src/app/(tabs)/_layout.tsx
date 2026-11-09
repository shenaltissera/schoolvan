import { Redirect } from 'expo-router';

import { useAccount } from '@/auth/account';
import AppTabs from '@/components/app-tabs';

export default function TabsLayout() {
  const { session, profile, loading } = useAccount();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  if (!profile) return null;

  return <AppTabs />;
}

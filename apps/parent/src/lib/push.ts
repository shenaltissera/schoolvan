import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Show incoming notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPush(): Promise<void> {
  // Push tokens are only available on a physical device with a dev build
  // (not simulators, not Expo Go on SDK 53+).
  if (!Device.isDevice) return;

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Requires an EAS projectId (run `eas init`); without it we can't get a token.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  if (!projectId) return;

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid && token) {
      await supabase
        .from('push_tokens')
        .upsert({ user_id: uid, token }, { onConflict: 'user_id,token' });
    }
  } catch {
    // Push just won't work until a dev build + projectId exist; ignore.
  }
}

/** Registers this device for push once the parent is signed in. */
export function useRegisterPush(enabled: boolean): void {
  useEffect(() => {
    if (enabled) registerForPush();
  }, [enabled]);
}

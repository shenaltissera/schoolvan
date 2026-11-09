import AsyncStorage from '@react-native-async-storage/async-storage';

// When a parent opens an invite link while signed out, we stash the token here
// so we can resume acceptance after they log in or sign up.
const KEY = 'sv.pendingInvite';

export async function savePendingInvite(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, token);
  } catch {
    // ignore
  }
}

export async function getPendingInvite(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function clearPendingInvite(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

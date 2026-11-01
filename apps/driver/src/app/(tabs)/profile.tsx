import { Image } from 'expo-image';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@schoolvan/shared';

import { useAccount } from '@/auth/account';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="default" style={styles.semibold}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function ProfileScreen() {
  const { account, signOut } = useAccount();

  if (!account) return null;

  function confirmSignOut() {
    Alert.alert('Sign out', 'This removes your account from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: account.driverPhotoUri }} style={styles.avatar} />
            <ThemedText type="subtitle">{account.driverName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Driver
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <Row label="Vehicle number" value={account.vehicleNumber} />
            <Row label="Association reg. no." value={account.associationRegNo} />
          </ThemedView>

          {account.assistantName ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                Assistant
              </ThemedText>
              <View style={styles.assistantRow}>
                {account.assistantPhotoUri ? (
                  <Image source={{ uri: account.assistantPhotoUri }} style={styles.assistantPhoto} />
                ) : (
                  <View style={[styles.assistantPhoto, styles.assistantPlaceholder]}>
                    <ThemedText type="smallBold" style={{ color: '#000' }}>
                      {account.assistantName.charAt(0)}
                    </ThemedText>
                  </View>
                )}
                <ThemedText type="default" style={styles.semibold}>
                  {account.assistantName}
                </ThemedText>
              </View>
            </ThemedView>
          ) : null}

          <Pressable style={styles.signOut} onPress={confirmSignOut}>
            <ThemedText type="smallBold" style={{ color: Brand.danger }}>
              Sign out
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  avatarWrap: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Brand.primary,
  },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  cardTitle: { marginBottom: Spacing.one },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assistantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  assistantPhoto: { width: 48, height: 48, borderRadius: 24, backgroundColor: Brand.primary },
  assistantPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  semibold: { fontWeight: '600' },
  signOut: { alignItems: 'center', paddingVertical: Spacing.three },
});

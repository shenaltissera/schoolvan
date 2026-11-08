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
  const { profile, signOut } = useAccount();

  if (!profile) return null;

  function confirmSignOut() {
    Alert.alert('Sign out', 'You will need to log in again to run routes.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarWrap}>
            {profile.driverPhotoUrl ? (
              <Image source={{ uri: profile.driverPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ThemedText type="title" style={{ color: '#000' }}>
                  {profile.driverName.charAt(0)}
                </ThemedText>
              </View>
            )}
            <ThemedText type="subtitle">{profile.driverName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Driver
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <Row label="Vehicle number" value={profile.vehicleNumber} />
            <Row label="Association reg. no." value={profile.associationRegNo} />
          </ThemedView>

          {profile.assistantName ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                Assistant
              </ThemedText>
              <View style={styles.assistantRow}>
                {profile.assistantPhotoUrl ? (
                  <Image source={{ uri: profile.assistantPhotoUrl }} style={styles.assistantPhoto} />
                ) : (
                  <View style={[styles.assistantPhoto, styles.assistantPlaceholder]}>
                    <ThemedText type="smallBold" style={{ color: '#000' }}>
                      {profile.assistantName.charAt(0)}
                    </ThemedText>
                  </View>
                )}
                <ThemedText type="default" style={styles.semibold}>
                  {profile.assistantName}
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
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  cardTitle: { marginBottom: Spacing.one },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assistantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  assistantPhoto: { width: 48, height: 48, borderRadius: 24, backgroundColor: Brand.primary },
  assistantPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  semibold: { fontWeight: '600' },
  signOut: { alignItems: 'center', paddingVertical: Spacing.three },
});

import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, drivers, vans } from '@schoolvan/shared';

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
  const driver = drivers[0];
  const van = vans.find((v) => v.id === driver.vanId);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <ThemedText type="title" style={{ color: '#000' }}>
                {driver.name.charAt(0)}
              </ThemedText>
            </View>
            <ThemedText type="subtitle">{driver.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Driver
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <Row label="Phone" value={driver.phone} />
            <Row label="License" value={driver.licenseNo} />
          </ThemedView>

          {van && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                Assigned van
              </ThemedText>
              <Row label="Plate" value={van.plateNo} />
              <Row label="Model" value={van.model} />
              <Row label="Capacity" value={`${van.capacity} seats`} />
            </ThemedView>
          )}

          <Pressable
            style={styles.signOut}
            onPress={() => Alert.alert('Sign out', 'Auth is not wired up yet.')}>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  cardTitle: { marginBottom: Spacing.one },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  semibold: { fontWeight: '600' },
  signOut: { alignItems: 'center', paddingVertical: Spacing.three },
});

import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@schoolvan/shared';

import { useAccount } from '@/auth/account';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listMyChildren, summarizeDays, type Child } from '@/lib/children';
import { useDriver } from '@/lib/driver';
import { useVanLocation } from '@/lib/van-location';

function updatedAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  return `${Math.round(secs / 3600)}h ago`;
}

export default function TrackScreen() {
  const { profile, signOut } = useAccount();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const van = useVanLocation(children[0]?.driverId);
  const online = van?.online && van.lat != null && van.lng != null;
  const driver = useDriver(children[0]?.driverId);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listMyChildren()
        .then((c) => active && setChildren(c))
        .catch((e) => Alert.alert('Could not load children', e.message))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, []),
  );

  const greeting = new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';

  function confirmSignOut() {
    Alert.alert('Sign out', 'You will need to log in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">{greeting}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {profile?.name ?? ''}
              </ThemedText>
            </View>
            <Pressable onPress={confirmSignOut} hitSlop={10}>
              <ThemedText type="smallBold" style={{ color: Brand.danger }}>
                Sign out
              </ThemedText>
            </Pressable>
          </View>

          {/* Live van — updates in realtime while the driver is online. */}
          <ThemedView type="backgroundElement" style={[styles.map, online && styles.mapOnline]}>
            {online && van ? (
              <>
                <ThemedText type="smallBold" style={{ color: '#000' }}>
                  🚐 Van en route
                </ThemedText>
                <ThemedText type="small" style={{ color: '#000' }}>
                  {van.lat!.toFixed(4)}, {van.lng!.toFixed(4)}
                  {van.speedKmh ? ` · ${van.speedKmh} km/h` : ''}
                </ThemedText>
                <ThemedText type="small" style={styles.mapHint}>
                  updated {updatedAgo(van.updatedAt)} · live map coming soon
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="smallBold" themeColor="text">
                  Van is offline
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  You&apos;ll see the van here the moment your driver goes online.
                </ThemedText>
              </>
            )}
          </ThemedView>

          {driver && (
            <>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Your driver
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.driverCard}>
                {driver.photoUrl ? (
                  <Image source={{ uri: driver.photoUrl }} style={styles.driverPhoto} />
                ) : (
                  <View style={[styles.driverPhoto, styles.driverPhotoPlaceholder]}>
                    <ThemedText type="smallBold" style={{ color: '#000' }}>
                      {driver.name.charAt(0)}
                    </ThemedText>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText type="default" style={styles.semibold}>
                    {driver.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Van {driver.vehicleNumber}
                    {driver.assistantName ? ` · Assistant: ${driver.assistantName}` : ''}
                  </ThemedText>
                </View>
              </ThemedView>
            </>
          )}

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            My children
          </ThemedText>

          {loading ? (
            <ThemedText type="small" themeColor="textSecondary">
              Loading…
            </ThemedText>
          ) : children.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default" style={styles.semibold}>
                No children linked yet
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Open the invite link your van driver sent you to link your child here.
              </ThemedText>
            </ThemedView>
          ) : (
            children.map((child) => (
              <Pressable key={child.id} onPress={() => router.push(`/schedule/${child.id}`)}>
                <ThemedView type="backgroundElement" style={styles.childCard}>
                  <View style={styles.avatar}>
                    <ThemedText type="smallBold" style={{ color: '#000' }}>
                      {child.name.charAt(0)}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="default" style={styles.semibold}>
                      {child.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {child.grade ?? 'Linked to your van'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.sched}>
                      Pickup {summarizeDays(child.pickupDays)} · Drop-off{' '}
                      {summarizeDays(child.dropoffDays)}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ color: Brand.accent }}>
                    ›
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))
          )}
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  map: {
    height: 180,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  mapOnline: { backgroundColor: Brand.primary },
  mapHint: { color: '#00000099', textAlign: 'center' },
  sectionTitle: { marginTop: Spacing.one },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  driverPhoto: { width: 48, height: 48, borderRadius: 24, backgroundColor: Brand.primary },
  driverPhotoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  empty: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.one },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semibold: { fontWeight: '600' },
  sched: { marginTop: 2 },
});

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Brand,
  api,
  parents,
  studentById,
  subscribe,
  type Student,
  type Trip,
} from '@schoolvan/shared';

import { StatusChip } from '@/components/status-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

// Demo: the signed-in parent. Replace with the authenticated user.
const CURRENT_PARENT = parents[0];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TrackScreen() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [, force] = useState(0);

  const children: Student[] = CURRENT_PARENT.childIds
    .map((id) => studentById(id))
    .filter((s): s is Student => Boolean(s));

  useEffect(() => {
    api.getTodayTrip().then(setTrip);
    return subscribe(() => force((n) => n + 1));
  }, []);

  const firstChild = children[0];
  const myStop = trip?.stops.find((s) => s.id === firstChild?.stopId);
  const vanMoving = trip?.status === 'in_progress';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Good morning</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {CURRENT_PARENT.name}
            </ThemedText>
          </View>

          {/* Map placeholder — drop in react-native-maps here. */}
          <View style={styles.map}>
            <ThemedText type="smallBold" style={{ color: '#000' }}>
              {vanMoving ? '🚐 Van en route' : 'Van not started yet'}
            </ThemedText>
            {myStop && (
              <ThemedText type="small" style={{ color: '#000' }}>
                Arriving {myStop.label} ~ {formatTime(myStop.scheduledAt)}
              </ThemedText>
            )}
            <ThemedText type="small" style={styles.mapHint}>
              Live map goes here
            </ThemedText>
          </View>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            My children
          </ThemedText>

          {children.map((child) => (
            <ThemedView key={child.id} type="backgroundElement" style={styles.childCard}>
              <View style={styles.childAvatar}>
                <ThemedText type="smallBold" style={{ color: '#000' }}>
                  {child.name.charAt(0)}
                </ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="default" style={styles.semibold}>
                  {child.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {child.grade}
                </ThemedText>
              </View>
              <StatusChip status={api.getRideStatus(child.id)} />
            </ThemedView>
          ))}
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
  header: { gap: Spacing.one },
  map: {
    height: 220,
    borderRadius: Spacing.four,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  mapHint: { color: '#00000099', marginTop: Spacing.one },
  sectionTitle: { marginTop: Spacing.one },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semibold: { fontWeight: '600' },
});

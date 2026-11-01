import { useEffect, useMemo, useState } from 'react';
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
  type TripWindow,
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

/** The stop nearest home for a child in a trip (pickup in the morning,
 *  drop-off in the afternoon). */
function homeStop(trip: Trip, studentId: string) {
  const wantKind = trip.window === 'morning' ? 'pickup' : 'dropoff';
  return trip.stops.find((s) => s.kind === wantKind && s.studentIds.includes(studentId));
}

function WindowStatus({ trip, studentId }: { trip: Trip; studentId: string }) {
  const stop = homeStop(trip, studentId);
  const label = trip.window === 'morning' ? 'Morning' : 'Afternoon';
  return (
    <View style={styles.windowRow}>
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {trip.window === 'morning' ? 'Home → School' : 'School → Home'}
          {stop ? ` · ${stop.label} ~ ${formatTime(stop.scheduledAt)}` : ''}
        </ThemedText>
      </View>
      <StatusChip status={api.getRideStatus(trip.id, studentId)} />
    </View>
  );
}

export default function TrackScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [, force] = useState(0);

  const children: Student[] = CURRENT_PARENT.childIds
    .map((id) => studentById(id))
    .filter((s): s is Student => Boolean(s));

  useEffect(() => {
    api.getTrips().then(setTrips);
    return subscribe(() => force((n) => n + 1));
  }, []);

  const activeWindow: TripWindow = new Date().getHours() < 12 ? 'morning' : 'afternoon';
  const activeTrip = useMemo(
    () => trips.find((t) => t.window === activeWindow),
    [trips, activeWindow],
  );
  const firstChild = children[0];
  const myStop = activeTrip && firstChild ? homeStop(activeTrip, firstChild.id) : undefined;
  const vanMoving = activeTrip?.status === 'in_progress';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">
              {activeWindow === 'morning' ? 'Good morning' : 'Good afternoon'}
            </ThemedText>
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
                {activeWindow === 'morning' ? 'Pickup' : 'Drop-off'} at {myStop.label} ~{' '}
                {formatTime(myStop.scheduledAt)}
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
              <View style={styles.childHeader}>
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
              </View>
              {trips.map((trip) => (
                <WindowStatus key={trip.id} trip={trip} studentId={child.id} />
              ))}
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
    height: 200,
    borderRadius: Spacing.four,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  mapHint: { color: '#00000099', marginTop: Spacing.one },
  sectionTitle: { marginTop: Spacing.one },
  childCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000018',
  },
  semibold: { fontWeight: '600' },
});

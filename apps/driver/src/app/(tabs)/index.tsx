import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Brand,
  api,
  studentsAtStop,
  subscribe,
  type RideStatus,
  type Stop,
  type Trip,
  type TripWindow,
} from '@schoolvan/shared';

import { useAccount } from '@/auth/account';
import { StatusChip } from '@/components/status-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLocationSharing } from '@/location/use-location-sharing';

/** Tapping a student toggles the action appropriate to the stop. */
function nextStatus(kind: Stop['kind'], current: RideStatus): RideStatus {
  if (kind === 'pickup') return current === 'onboard' ? 'waiting' : 'onboard';
  return current === 'dropped' ? 'onboard' : 'dropped';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const WINDOWS: TripWindow[] = ['morning', 'afternoon'];
const WINDOW_LABEL: Record<TripWindow, string> = { morning: 'Morning', afternoon: 'Afternoon' };

export default function RouteScreen() {
  const { profile } = useAccount();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [window, setWindow] = useState<TripWindow>('morning');
  const [, force] = useState(0);

  useEffect(() => {
    api.getTrips().then(setTrips);
    return subscribe(() => force((n) => n + 1));
  }, []);

  const trip = trips.find((t) => t.window === window);

  const cycle = useCallback(
    (tripId: string, kind: Stop['kind'], studentId: string) => {
      const current = api.getRideStatus(tripId, studentId);
      api.setRideStatus(tripId, studentId, nextStatus(kind, current));
    },
    [],
  );

  const online = trip?.status === 'in_progress';
  const startedAt = trip ? api.getShiftStartedAt(trip.id) : undefined;
  const share = useLocationSharing(online, profile?.id);

  function onlineSubtitle(): string {
    const since = startedAt ? ` · since ${formatTime(startedAt)}` : '';
    if (share.state === 'denied') return 'Location permission needed to share';
    if (share.state === 'error') return "Couldn't read your location";
    if (share.last) {
      return `Sharing location · ${share.last.lat.toFixed(4)}, ${share.last.lng.toFixed(4)}${since}`;
    }
    return `Starting location sharing…${since}`;
  }

  const goOnline = useCallback(() => {
    if (trip) api.startShift(trip.id);
  }, [trip]);

  const confirmEndShift = useCallback(() => {
    if (!trip) return;
    Alert.alert('End shift', 'This stops sharing your location and notifies parents.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End shift', style: 'destructive', onPress: () => api.endShift(trip.id) },
    ]);
  }, [trip]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <ThemedText type="subtitle">{trip?.routeName ?? 'Route'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {window === 'morning' ? 'Home → School' : 'School → Home'}
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push('/students')} hitSlop={10}>
              <ThemedText type="smallBold" style={{ color: Brand.accent }}>
                Students ›
              </ThemedText>
            </Pressable>
          </View>

          {/* Window switch */}
          <ThemedView type="backgroundElement" style={styles.segment}>
            {WINDOWS.map((w) => {
              const active = w === window;
              return (
                <Pressable
                  key={w}
                  onPress={() => setWindow(w)}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                  <ThemedText
                    type="smallBold"
                    style={{ color: active ? '#000' : undefined }}
                    themeColor={active ? undefined : 'textSecondary'}>
                    {WINDOW_LABEL[w]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.shiftCard}>
            <View style={styles.shiftTop}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: online ? Brand.success : Brand.neutral },
                ]}
              />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{online ? 'Online' : "You're offline"}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {online
                    ? onlineSubtitle()
                    : `Go online to start your ${WINDOW_LABEL[window].toLowerCase()} shift`}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={online ? confirmEndShift : goOnline}
              style={[styles.shiftBtn, { backgroundColor: online ? Brand.danger : Brand.success }]}>
              <ThemedText type="smallBold" style={styles.shiftBtnText}>
                {online ? 'End shift' : 'Go Online'}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {trip?.stops.map((stop, i) => (
            <ThemedView key={stop.id} type="backgroundElement" style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <View style={styles.stopIndex}>
                  <ThemedText type="smallBold" style={{ color: '#000' }}>
                    {i + 1}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.stopTitleRow}>
                    <ThemedText type="default" style={styles.semibold}>
                      {stop.label}
                    </ThemedText>
                    <View
                      style={[
                        styles.kindTag,
                        { backgroundColor: stop.kind === 'pickup' ? Brand.accent : Brand.success },
                      ]}>
                      <ThemedText type="smallBold" style={styles.kindTagText}>
                        {stop.kind === 'pickup' ? 'Pick up' : 'Drop off'}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {stop.address}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {formatTime(stop.scheduledAt)}
                </ThemedText>
              </View>

              {studentsAtStop(stop.studentIds).map((student) => (
                <Pressable
                  key={student.id}
                  onPress={() => cycle(trip.id, stop.kind, student.id)}
                  style={styles.studentRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="default">{student.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {student.grade}
                    </ThemedText>
                  </View>
                  <StatusChip status={api.getRideStatus(trip.id, student.id)} />
                </Pressable>
              ))}
            </ThemedView>
          ))}

          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Tap a student to mark {window === 'morning' ? 'pick up / drop at school' : 'pick up / drop off'}.
            Parents are notified automatically.
          </ThemedText>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  header: { gap: Spacing.one },
  semibold: { fontWeight: '600' },
  segment: {
    flexDirection: 'row',
    padding: Spacing.half,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  segmentBtnActive: { backgroundColor: Brand.primary },
  shiftCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  shiftTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  shiftBtn: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  shiftBtnText: { color: '#fff', fontSize: 16 },
  stopCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stopTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stopIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  kindTagText: { color: '#fff', fontSize: 11 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000018',
  },
  hint: { textAlign: 'center', marginTop: Spacing.one },
});

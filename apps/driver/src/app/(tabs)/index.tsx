import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
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

import { StatusChip } from '@/components/status-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [window, setWindow] = useState<TripWindow>('morning');
  const [sharing, setSharing] = useState(false);
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

  const toggleSharing = useCallback((on: boolean) => {
    setSharing(on);
    api.updateVanLocation({ speedKmh: on ? 32 : 0 });
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">{trip?.routeName ?? 'Route'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {window === 'morning' ? 'Home → School' : 'School → Home'}
            </ThemedText>
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

          <ThemedView type="backgroundElement" style={styles.shareCard}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">Share live location</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {sharing ? 'Parents can see the van' : 'Off — van hidden from parents'}
              </ThemedText>
            </View>
            <Switch value={sharing} onValueChange={toggleSharing} trackColor={{ true: Brand.success }} />
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
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
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

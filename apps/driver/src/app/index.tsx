import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Brand,
  api,
  studentsForStop,
  subscribe,
  type RideStatus,
  type Trip,
} from '@schoolvan/shared';

import { StatusChip } from '@/components/status-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

/** Tapping a student cycles their ride status forward. */
const NEXT_STATUS: Record<RideStatus, RideStatus> = {
  waiting: 'onboard',
  onboard: 'dropped',
  dropped: 'waiting',
  absent: 'waiting',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function RouteScreen() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [sharing, setSharing] = useState(false);
  // Bumped on every ride-state change so chips re-render.
  const [, force] = useState(0);

  useEffect(() => {
    api.getTodayTrip().then(setTrip);
    return subscribe(() => force((n) => n + 1));
  }, []);

  const cycle = useCallback((studentId: string) => {
    const current = api.getRideStatus(studentId);
    api.setRideStatus(studentId, NEXT_STATUS[current]);
  }, []);

  const toggleSharing = useCallback((on: boolean) => {
    setSharing(on);
    api.updateVanLocation({ speedKmh: on ? 32 : 0 });
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {trip && (
            <>
              <View style={styles.header}>
                <ThemedText type="subtitle">{trip.routeName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {trip.direction === 'to_school' ? 'To school' : 'From school'} ·{' '}
                  {trip.stops.length} stops
                </ThemedText>
              </View>

              <ThemedView type="backgroundElement" style={styles.shareCard}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold">Share live location</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {sharing ? 'Parents can see the van' : 'Off — van hidden from parents'}
                  </ThemedText>
                </View>
                <Switch
                  value={sharing}
                  onValueChange={toggleSharing}
                  trackColor={{ true: Brand.success }}
                />
              </ThemedView>

              {trip.stops.map((stop, i) => (
                <ThemedView key={stop.id} type="backgroundElement" style={styles.stopCard}>
                  <View style={styles.stopHeader}>
                    <View style={styles.stopIndex}>
                      <ThemedText type="smallBold" style={{ color: '#000' }}>
                        {i + 1}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="default" style={styles.semibold}>
                        {stop.label}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {stop.address}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      {formatTime(stop.scheduledAt)}
                    </ThemedText>
                  </View>

                  {studentsForStop(stop.id).map((student) => {
                    const status = api.getRideStatus(student.id);
                    return (
                      <Pressable
                        key={student.id}
                        onPress={() => cycle(student.id)}
                        style={styles.studentRow}>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="default">{student.name}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {student.grade}
                          </ThemedText>
                        </View>
                        <StatusChip status={status} />
                      </Pressable>
                    );
                  })}
                </ThemedView>
              ))}

              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                Tap a student to update their status.
              </ThemedText>
            </>
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
  header: { gap: Spacing.one },
  semibold: { fontWeight: '600' },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  stopCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stopIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

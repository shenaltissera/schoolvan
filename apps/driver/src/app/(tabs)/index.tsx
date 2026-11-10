import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, type RideStatus } from '@schoolvan/shared';

import { useAccount } from '@/auth/account';
import { StatusChip } from '@/components/status-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLocationSharing } from '@/location/use-location-sharing';
import { getRideStatuses, setRideStatus, type RideWindow } from '@/lib/ride';
import { listStudents, type Student } from '@/lib/students';

const WINDOWS: RideWindow[] = ['morning', 'afternoon'];
const WINDOW_LABEL: Record<RideWindow, string> = { morning: 'Morning', afternoon: 'Afternoon' };

/** Tapping a student advances their ride status. */
function nextStatus(current: RideStatus): RideStatus {
  if (current === 'waiting') return 'onboard';
  if (current === 'onboard') return 'dropped';
  return 'waiting';
}

function formatTime(iso?: string) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

export default function RouteScreen() {
  const { profile } = useAccount();
  const driverId = profile?.id;

  const [window, setWindow] = useState<RideWindow>('morning');
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RideStatus>>({});
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [startedAt, setStartedAt] = useState<string>();

  const share = useLocationSharing(online, driverId);

  useFocusEffect(
    useCallback(() => {
      if (!driverId) return;
      let active = true;
      setLoading(true);
      Promise.all([listStudents(), getRideStatuses(driverId, window)])
        .then(([s, st]) => {
          if (!active) return;
          setStudents(s);
          setStatuses(st);
        })
        .catch((e) => Alert.alert('Could not load route', e.message))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [driverId, window]),
  );

  const cycle = useCallback(
    (student: Student) => {
      if (!driverId) return;
      const current = statuses[student.id] ?? 'waiting';
      const next = nextStatus(current);
      setStatuses((prev) => ({ ...prev, [student.id]: next }));
      setRideStatus(driverId, { id: student.id, name: student.name }, window, next).catch((e) =>
        Alert.alert('Could not update', e.message),
      );
    },
    [driverId, statuses, window],
  );

  function goOnline() {
    setOnline(true);
    setStartedAt(new Date().toISOString());
  }

  function confirmEndShift() {
    Alert.alert('End shift', 'This stops sharing your live location.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End shift', style: 'destructive', onPress: () => { setOnline(false); setStartedAt(undefined); } },
    ]);
  }

  function onlineSubtitle(): string {
    const since = startedAt ? ` · since ${formatTime(startedAt)}` : '';
    if (share.state === 'denied') return 'Location permission needed to share';
    if (share.state === 'error') return "Couldn't read your location";
    if (share.last) return `Sharing location · ${share.last.lat.toFixed(4)}, ${share.last.lng.toFixed(4)}${since}`;
    return `Starting location sharing…${since}`;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">Today&apos;s route</ThemedText>
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

          {/* Go Online / End shift */}
          <ThemedView type="backgroundElement" style={styles.shiftCard}>
            <View style={styles.shiftTop}>
              <View style={[styles.statusDot, { backgroundColor: online ? Brand.success : Brand.neutral }]} />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{online ? 'Online' : "You're offline"}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {online ? onlineSubtitle() : `Go online to start your ${WINDOW_LABEL[window].toLowerCase()} shift`}
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

          {loading ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Loading…
            </ThemedText>
          ) : students.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default" style={styles.semibold}>
                No students yet
              </ThemedText>
              <Pressable onPress={() => router.push('/students')}>
                <ThemedText type="small" style={{ color: Brand.accent }}>
                  Add the children on your van →
                </ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <>
              {students.map((student) => (
                <Pressable key={student.id} onPress={() => cycle(student)}>
                  <ThemedView type="backgroundElement" style={styles.studentRow}>
                    <View style={styles.avatar}>
                      <ThemedText type="smallBold" style={{ color: '#000' }}>
                        {student.name.charAt(0)}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="default" style={styles.semibold}>
                        {student.name}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {[student.grade, student.homeAddress].filter(Boolean).join(' · ') || 'On your van'}
                      </ThemedText>
                    </View>
                    <StatusChip status={statuses[student.id] ?? 'waiting'} />
                  </ThemedView>
                </Pressable>
              ))}
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                Tap a student to mark {window === 'morning' ? 'pick up / drop at school' : 'pick up / drop at home'}.
                Parents are notified automatically.
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
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.five },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end' },
  semibold: { fontWeight: '600' },
  note: { marginTop: Spacing.three },
  segment: { flexDirection: 'row', padding: Spacing.half, borderRadius: Spacing.three, gap: Spacing.half },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Spacing.two },
  segmentBtnActive: { backgroundColor: Brand.primary },
  shiftCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three },
  shiftTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  shiftBtn: { borderRadius: Spacing.three, paddingVertical: Spacing.three, alignItems: 'center' },
  shiftBtnText: { color: '#fff', fontSize: 16 },
  empty: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.one },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { textAlign: 'center', marginTop: Spacing.one },
});

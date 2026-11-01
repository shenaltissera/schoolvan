import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, api, studentById, subscribe, type Alert, type AlertKind } from '@schoolvan/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

const ALERT_ICON: Record<AlertKind, string> = {
  trip_started: '🚐',
  approaching_stop: '📍',
  picked_up: '✅',
  dropped_off: '🏫',
  trip_completed: '🏁',
  delay: '⏰',
};

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = () => api.getAlerts().then((a) => setAlerts([...a]));
    load();
    return subscribe(load);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.title}>
            Alerts
          </ThemedText>

          {alerts.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              No notifications yet.
            </ThemedText>
          )}

          {alerts.map((alert) => {
            const child = studentById(alert.studentId);
            return (
              <Pressable key={alert.id} onPress={() => api.markAlertRead(alert.id)}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  {!alert.read && <View style={styles.unreadDot} />}
                  <ThemedText type="title" style={styles.icon}>
                    {ALERT_ICON[alert.kind]}
                  </ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="default" style={styles.semibold}>
                      {alert.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {alert.body}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
                      {child ? child.name + ' · ' : ''}
                      {timeAgo(alert.createdAt)}
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            );
          })}
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
  title: { marginBottom: Spacing.one },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'flex-start',
  },
  icon: { fontSize: 28, lineHeight: 34 },
  semibold: { fontWeight: '600' },
  meta: { marginTop: Spacing.one },
  unreadDot: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.accent,
  },
});

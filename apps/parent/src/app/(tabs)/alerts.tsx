import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@schoolvan/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { markAlertRead, useAlerts } from '@/lib/alerts';

const ICON: Record<string, string> = {
  picked_up: '✅',
  dropped_off: '🏫',
  trip_started: '🚐',
  trip_completed: '🏁',
  approaching_stop: '📍',
  delay: '⏰',
};

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default function AlertsScreen() {
  const { alerts, loading } = useAlerts();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.title}>
            Alerts
          </ThemedText>

          {loading ? (
            <ThemedText type="small" themeColor="textSecondary">
              Loading…
            </ThemedText>
          ) : alerts.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default" style={styles.semibold}>
                No alerts yet
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                You&apos;ll get a notification here each time your child is picked up or dropped off.
              </ThemedText>
            </ThemedView>
          ) : (
            alerts.map((alert) => (
              <Pressable key={alert.id} onPress={() => markAlertRead(alert.id)}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  {!alert.read && <View style={styles.unreadDot} />}
                  <ThemedText type="title" style={styles.icon}>
                    {ICON[alert.kind] ?? '🔔'}
                  </ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="default" style={styles.semibold}>
                      {alert.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {alert.body}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
                      {timeAgo(alert.createdAt)}
                    </ThemedText>
                  </View>
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
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.five },
  title: { marginBottom: Spacing.one },
  semibold: { fontWeight: '600' },
  empty: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.one },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'flex-start',
  },
  icon: { fontSize: 28, lineHeight: 34 },
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

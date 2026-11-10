import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@schoolvan/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getChild, setSchedule, WEEKDAYS, WEEKDAY_LABEL } from '@/lib/children';

function DayPicker({
  label,
  hint,
  days,
  onToggle,
}: {
  label: string;
  hint: string;
  days: string[];
  onToggle: (d: string) => void;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {hint}
      </ThemedText>
      <View style={styles.chips}>
        {WEEKDAYS.map((d) => {
          const on = days.includes(d);
          return (
            <Pressable
              key={d}
              onPress={() => onToggle(d)}
              style={[styles.chip, on && styles.chipOn]}>
              <ThemedText type="smallBold" style={on ? { color: '#000' } : undefined}>
                {WEEKDAY_LABEL[d]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [pickup, setPickup] = useState<string[]>([]);
  const [dropoff, setDropoff] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getChild(id)
      .then((c) => {
        if (!c) return;
        setName(c.name);
        setPickup(c.pickupDays);
        setDropoff(c.dropoffDays);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function toggle(list: string[], setList: (v: string[]) => void, d: string) {
    setList(list.includes(d) ? list.filter((x) => x !== d) : [...list, d]);
  }

  async function onSave() {
    if (!id) return;
    setSaving(true);
    try {
      await setSchedule(id, pickup, dropoff);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="default" style={{ color: Brand.accent }}>
              ‹ Back
            </ThemedText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Pickup schedule
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Choose which days {name || 'your child'} needs the van.
            </ThemedText>
          </View>

          {loading ? (
            <ThemedText type="small" themeColor="textSecondary">
              Loading…
            </ThemedText>
          ) : (
            <>
              <DayPicker
                label="Pickup (morning)"
                hint="Days the van collects from home."
                days={pickup}
                onToggle={(d) => toggle(pickup, setPickup, d)}
              />
              <DayPicker
                label="Drop-off (afternoon)"
                hint="Days the van brings home from school."
                days={dropoff}
                onToggle={(d) => toggle(dropoff, setDropoff, d)}
              />

              <Pressable
                onPress={onSave}
                disabled={saving}
                style={[styles.save, saving && { opacity: 0.6 }]}>
                <ThemedText type="smallBold" style={styles.saveText}>
                  {saving ? 'Saving…' : 'Save schedule'}
                </ThemedText>
              </Pressable>
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
  header: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  content: { padding: Spacing.four, gap: Spacing.four },
  title: { fontSize: 30, lineHeight: 36 },
  section: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Brand.neutral,
  },
  chipOn: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  save: {
    backgroundColor: Brand.primary,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveText: { color: '#000', fontSize: 16 },
});

import { StyleSheet, View } from 'react-native';

import { RideStatusColor, RideStatusLabel, type RideStatus } from '@schoolvan/shared';

import { ThemedText } from '@/components/themed-text';

export function StatusChip({ status }: { status: RideStatus }) {
  const color = RideStatusColor[status];
  return (
    <View style={[styles.chip, { backgroundColor: color + '22', borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="smallBold" style={{ color }}>
        {RideStatusLabel[status]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@schoolvan/shared';

import { useAccount } from '@/auth/account';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listMyChildren, type Child } from '@/lib/children';

export default function TrackScreen() {
  const { profile, signOut } = useAccount();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listMyChildren()
        .then((c) => active && setChildren(c))
        .catch((e) => Alert.alert('Could not load children', e.message))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, []),
  );

  const greeting = new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';

  function confirmSignOut() {
    Alert.alert('Sign out', 'You will need to log in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">{greeting}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {profile?.name ?? ''}
              </ThemedText>
            </View>
            <Pressable onPress={confirmSignOut} hitSlop={10}>
              <ThemedText type="smallBold" style={{ color: Brand.danger }}>
                Sign out
              </ThemedText>
            </Pressable>
          </View>

          {/* Live map placeholder — shows the van when the driver is online. */}
          <View style={styles.map}>
            <ThemedText type="smallBold" style={{ color: '#000' }}>
              Live tracking
            </ThemedText>
            <ThemedText type="small" style={styles.mapHint}>
              The van appears here when your driver goes online.
            </ThemedText>
          </View>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            My children
          </ThemedText>

          {loading ? (
            <ThemedText type="small" themeColor="textSecondary">
              Loading…
            </ThemedText>
          ) : children.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default" style={styles.semibold}>
                No children linked yet
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Open the invite link your van driver sent you to link your child here.
              </ThemedText>
            </ThemedView>
          ) : (
            children.map((child) => (
              <ThemedView key={child.id} type="backgroundElement" style={styles.childCard}>
                <View style={styles.avatar}>
                  <ThemedText type="smallBold" style={{ color: '#000' }}>
                    {child.name.charAt(0)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="default" style={styles.semibold}>
                    {child.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {[child.grade, child.homeAddress].filter(Boolean).join(' · ') || 'Linked to your van'}
                  </ThemedText>
                </View>
              </ThemedView>
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
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  map: {
    height: 180,
    borderRadius: Spacing.four,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  mapHint: { color: '#00000099', textAlign: 'center' },
  sectionTitle: { marginTop: Spacing.one },
  empty: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.one },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semibold: { fontWeight: '600' },
});

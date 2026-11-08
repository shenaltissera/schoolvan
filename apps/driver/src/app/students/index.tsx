import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@schoolvan/shared';

import { useAccount } from '@/auth/account';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  getOrCreateInvite,
  inviteUrl,
  listInvites,
  listStudents,
  type Invite,
  type Student,
} from '@/lib/students';

export default function StudentsScreen() {
  const { profile } = useAccount();
  const [students, setStudents] = useState<Student[]>([]);
  const [invites, setInvites] = useState<Record<string, Invite>>({});
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    Promise.all([listStudents(), listInvites()])
      .then(([s, inv]) => {
        if (!active) return;
        setStudents(s);
        const byStudent: Record<string, Invite> = {};
        for (const i of inv) if (i.status === 'pending' || i.status === 'accepted') byStudent[i.studentId] = i;
        setInvites(byStudent);
      })
      .catch((e) => Alert.alert('Could not load students', e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  async function shareInvite(student: Student) {
    if (!profile) return;
    setSharingId(student.id);
    try {
      const invite = await getOrCreateInvite(profile.id, student.id);
      setInvites((prev) => ({ ...prev, [student.id]: invite }));
      const url = inviteUrl(invite.token);
      await Share.share({
        message: `Join ${student.name}'s school van on SchoolVan.\n\nOpen this link in the SchoolVan Parent app:\n${url}`,
      });
    } catch (e) {
      Alert.alert('Could not create invite', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSharingId(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="default" style={{ color: Brand.accent }}>
              ‹ Back
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => router.push('/students/new')} hitSlop={12}>
            <ThemedText type="smallBold" style={{ color: Brand.accent }}>
              + Add
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Students</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            The children on your van. Share an invite so each parent can track their child.
          </ThemedText>

          {loading ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Loading…
            </ThemedText>
          ) : students.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="default" style={styles.semibold}>
                No students yet
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Tap “+ Add” to add the first child on your van.
              </ThemedText>
            </ThemedView>
          ) : (
            students.map((student) => {
              const invite = invites[student.id];
              const accepted = invite?.status === 'accepted';
              return (
                <ThemedView key={student.id} type="backgroundElement" style={styles.card}>
                  <View style={styles.cardTop}>
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
                        {[student.grade, student.homeAddress].filter(Boolean).join(' · ') || 'No details'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: (accepted ? Brand.success : Brand.neutral) + '22' },
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: accepted ? Brand.success : Brand.neutral }}>
                        {accepted ? 'Parent linked' : invite ? 'Invite pending' : 'Not invited'}
                      </ThemedText>
                    </View>
                    {!accepted && (
                      <Pressable
                        onPress={() => shareInvite(student)}
                        disabled={sharingId === student.id}
                        style={[styles.shareBtn, sharingId === student.id && { opacity: 0.6 }]}>
                        <ThemedText type="smallBold" style={styles.shareBtnText}>
                          {sharingId === student.id ? '…' : invite ? 'Share invite' : 'Invite parent'}
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                </ThemedView>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  semibold: { fontWeight: '600' },
  note: { marginTop: Spacing.three },
  empty: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.one, marginTop: Spacing.two },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three, marginTop: Spacing.one },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  shareBtn: {
    backgroundColor: Brand.accent,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  shareBtnText: { color: '#fff' },
});

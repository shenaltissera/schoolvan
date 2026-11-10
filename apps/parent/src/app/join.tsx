import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@schoolvan/shared';

import { useAccount } from '@/auth/account';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { acceptInvite } from '@/lib/children';
import { clearPendingInvite, getPendingInvite, savePendingInvite } from '@/lib/pending-invite';

type Status = 'resolving' | 'need-auth' | 'accepting' | 'done' | 'error';

export default function JoinScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { session, profile, loading } = useAccount();

  const [token, setToken] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [status, setStatus] = useState<Status>('resolving');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const acceptedRef = useRef(false);

  // Resolve the token from the link, or from a previously-saved pending invite.
  useEffect(() => {
    let active = true;
    (async () => {
      let t = typeof params.token === 'string' && params.token ? params.token : null;
      if (t) await savePendingInvite(t);
      else t = await getPendingInvite();
      if (!active) return;
      setToken(t);
      setResolved(true);
    })();
    return () => {
      active = false;
    };
  }, [params.token]);

  // Drive acceptance once the session + token are known.
  useEffect(() => {
    if (!resolved || loading) return;
    if (!token) {
      setStatus('error');
      setError('This invite link is missing its code.');
      return;
    }
    if (!session || !profile) {
      setStatus('need-auth');
      return;
    }
    if (acceptedRef.current) return;
    acceptedRef.current = true;
    setStatus('accepting');
    acceptInvite(token)
      .then(async (student) => {
        setStudentName(student.name);
        setStudentId(student.id);
        await clearPendingInvite();
        setStatus('done');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Could not accept the invite.');
        setStatus('error');
      });
  }, [resolved, loading, token, session, profile]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          {(status === 'resolving' || status === 'accepting') && (
            <>
              <ActivityIndicator color={Brand.primary} size="large" />
              <ThemedText type="small" themeColor="textSecondary">
                {status === 'accepting' ? 'Linking you to the van…' : 'Opening invite…'}
              </ThemedText>
            </>
          )}

          {status === 'need-auth' && (
            <View style={styles.card}>
              <ThemedText type="title" style={styles.emoji}>
                🚐
              </ThemedText>
              <ThemedText type="subtitle" style={styles.heading}>
                You&apos;ve been invited
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
                Log in or create a parent account to start tracking your child&apos;s van.
              </ThemedText>
              <Pressable style={styles.primary} onPress={() => router.push('/sign-up')}>
                <ThemedText type="smallBold" style={styles.primaryText}>
                  Create an account
                </ThemedText>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => router.push('/login')}>
                <ThemedText type="smallBold" style={{ color: Brand.accent }}>
                  I already have an account
                </ThemedText>
              </Pressable>
            </View>
          )}

          {status === 'done' && (
            <View style={styles.card}>
              <ThemedText type="title" style={styles.emoji}>
                ✅
              </ThemedText>
              <ThemedText type="subtitle" style={styles.heading}>
                You&apos;re all set
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
                You&apos;re now tracking {studentName}&apos;s school van. Next, pick which days
                they need the van.
              </ThemedText>
              <Pressable
                style={styles.primary}
                onPress={() => router.replace(`/schedule/${studentId}`)}>
                <ThemedText type="smallBold" style={styles.primaryText}>
                  Set pickup days
                </ThemedText>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => router.replace('/')}>
                <ThemedText type="smallBold" style={{ color: Brand.accent }}>
                  Skip for now
                </ThemedText>
              </Pressable>
            </View>
          )}

          {status === 'error' && (
            <View style={styles.card}>
              <ThemedText type="title" style={styles.emoji}>
                ⚠️
              </ThemedText>
              <ThemedText type="subtitle" style={styles.heading}>
                Couldn&apos;t accept invite
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
                {error}
              </ThemedText>
              <Pressable style={styles.primary} onPress={() => router.replace('/')}>
                <ThemedText type="smallBold" style={styles.primaryText}>
                  Go to app
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  card: { alignItems: 'center', gap: Spacing.two, alignSelf: 'stretch' },
  emoji: { fontSize: 56, lineHeight: 64 },
  heading: { textAlign: 'center' },
  sub: { textAlign: 'center', marginBottom: Spacing.two },
  primary: {
    backgroundColor: Brand.primary,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryText: { color: '#000', fontSize: 16 },
  secondary: { paddingVertical: Spacing.three, alignItems: 'center', alignSelf: 'stretch' },
});

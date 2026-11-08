import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@schoolvan/shared';

import { useAccount } from '@/auth/account';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { session, profile, loading, signIn } = useAccount();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already signed in — go to the app.
  if (!loading && session && profile) return <Redirect href="/" />;

  async function onSubmit() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.ok) {
      router.replace('/');
    } else {
      Alert.alert('Could not log in', result.error);
    }
  }

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Welcome back
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Log in to run your routes.
              </ThemedText>
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Email</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={inputStyle}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Password</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                secureTextEntry
                style={inputStyle}
              />
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={[styles.submit, submitting && { opacity: 0.6 }]}>
              <ThemedText type="smallBold" style={styles.submitText}>
                {submitting ? 'Logging in…' : 'Log in'}
              </ThemedText>
            </Pressable>

            <View style={styles.signUpRow}>
              <ThemedText type="small" themeColor="textSecondary">
                New driver?{' '}
              </ThemedText>
              <Link href="/sign-up" replace>
                <ThemedText type="smallBold" style={{ color: Brand.accent }}>
                  Create an account
                </ThemedText>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three, flexGrow: 1, justifyContent: 'center' },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  title: { fontSize: 32, lineHeight: 38 },
  field: { gap: 6 },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  submit: {
    backgroundColor: Brand.primary,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitText: { color: '#000', fontSize: 16 },
  signUpRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});

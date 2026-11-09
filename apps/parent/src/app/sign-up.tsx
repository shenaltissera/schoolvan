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
import { getPendingInvite } from '@/lib/pending-invite';

export default function SignUpScreen() {
  const theme = useTheme();
  const { session, profile, loading, signUp } = useAccount();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session && profile) return <Redirect href="/" />;

  async function onSubmit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Your name is required';
    if (!email.trim()) next.email = 'Email is required';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const result = await signUp(name, email, password);
    setSubmitting(false);

    if (result.ok) {
      const pending = await getPendingInvite();
      router.replace(pending ? '/join' : '/');
    } else if ('needsConfirmation' in result) {
      Alert.alert('Confirm your email', result.error, [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } else {
      Alert.alert('Could not create account', result.error);
    }
  }

  function field(
    label: string,
    value: string,
    onChangeText: (t: string) => void,
    opts: { key: string; placeholder: string; secure?: boolean; email?: boolean },
  ) {
    return (
      <View style={styles.field}>
        <ThemedText type="smallBold">{label} *</ThemedText>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={opts.placeholder}
          placeholderTextColor={theme.textSecondary}
          autoCapitalize={opts.email || opts.secure ? 'none' : 'words'}
          autoCorrect={false}
          keyboardType={opts.email ? 'email-address' : 'default'}
          secureTextEntry={opts.secure}
          style={[
            styles.input,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderColor: errors[opts.key] ? Brand.danger : 'transparent',
            },
          ]}
        />
        {errors[opts.key] ? (
          <ThemedText type="small" style={{ color: Brand.danger }}>
            {errors[opts.key]}
          </ThemedText>
        ) : null}
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Create your account
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Sign up as a parent to track your child&apos;s van.
              </ThemedText>
            </View>

            {field('Your name', name, setName, { key: 'name', placeholder: 'e.g. Shenali Fernando' })}
            {field('Email', email, setEmail, {
              key: 'email',
              placeholder: 'you@example.com',
              email: true,
            })}
            {field('Password', password, setPassword, {
              key: 'password',
              placeholder: 'At least 6 characters',
              secure: true,
            })}

            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={[styles.submit, submitting && { opacity: 0.6 }]}>
              <ThemedText type="smallBold" style={styles.submitText}>
                {submitting ? 'Creating…' : 'Create account'}
              </ThemedText>
            </Pressable>

            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">
                Already have an account?{' '}
              </ThemedText>
              <Link href="/login" replace>
                <ThemedText type="smallBold" style={{ color: Brand.accent }}>
                  Log in
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
    borderWidth: 1.5,
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
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});

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
import { PhotoPicker } from '@/components/photo-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  error,
  autoCapitalize = 'words',
  keyboardType = 'default',
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">
        {label}
        {required ? ' *' : ''}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: error ? Brand.danger : 'transparent',
          },
        ]}
      />
      {error ? (
        <ThemedText type="small" style={{ color: Brand.danger }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function SignUpScreen() {
  const { session, profile, loading, signUp } = useAccount();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [associationRegNo, setAssociationRegNo] = useState('');
  const [driverPhotoUri, setDriverPhotoUri] = useState<string>();
  const [assistantName, setAssistantName] = useState('');
  const [assistantPhotoUri, setAssistantPhotoUri] = useState<string>();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Already registered — go straight to the app.
  if (!loading && session && profile) return <Redirect href="/" />;

  async function onSubmit() {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Email is required';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (!driverName.trim()) next.driverName = 'Driver name is required';
    if (!vehicleNumber.trim()) next.vehicleNumber = 'Vehicle number is required';
    if (!associationRegNo.trim()) next.associationRegNo = 'Registration number is required';
    if (!driverPhotoUri) next.driverPhoto = 'A driver photo is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const result = await signUp({
      email,
      password,
      driverName,
      vehicleNumber,
      associationRegNo,
      driverPhotoUri: driverPhotoUri!,
      assistantName: assistantName.trim() || undefined,
      assistantPhotoUri,
    });
    setSubmitting(false);

    if (result.ok) {
      router.replace('/');
    } else if ('needsConfirmation' in result) {
      Alert.alert('Confirm your email', result.error, [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } else {
      Alert.alert('Could not create account', result.error);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Create your account
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Register as a school van driver to start running routes.
              </ThemedText>
            </View>

            <View style={styles.photos}>
              <PhotoPicker
                label="Driver photo"
                required
                uri={driverPhotoUri}
                onChange={setDriverPhotoUri}
              />
              <PhotoPicker
                label="Assistant photo"
                size={80}
                uri={assistantPhotoUri}
                onChange={setAssistantPhotoUri}
              />
            </View>
            {errors.driverPhoto ? (
              <ThemedText type="small" style={{ color: Brand.danger, textAlign: 'center' }}>
                {errors.driverPhoto}
              </ThemedText>
            ) : null}

            <LabeledInput
              label="Email"
              required
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />
            <LabeledInput
              label="Password"
              required
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              autoCapitalize="none"
              secureTextEntry
              error={errors.password}
            />
            <LabeledInput
              label="Driver name"
              required
              value={driverName}
              onChangeText={setDriverName}
              placeholder="e.g. Nuwan Perera"
              error={errors.driverName}
            />
            <LabeledInput
              label="Vehicle number"
              required
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g. WP CAB-4471"
              autoCapitalize="characters"
              error={errors.vehicleNumber}
            />
            <LabeledInput
              label="School driver association reg. no."
              required
              value={associationRegNo}
              onChangeText={setAssociationRegNo}
              placeholder="e.g. SDA-2024-0192"
              autoCapitalize="characters"
              error={errors.associationRegNo}
            />
            <LabeledInput
              label="Assistant name"
              value={assistantName}
              onChangeText={setAssistantName}
              placeholder="Optional"
            />

            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={[styles.submit, submitting && { opacity: 0.6 }]}>
              <ThemedText type="smallBold" style={styles.submitText}>
                {submitting ? 'Creating…' : 'Create account'}
              </ThemedText>
            </Pressable>

            <View style={styles.loginRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Already have an account?{' '}
              </ThemedText>
              <Link href="/login" replace>
                <ThemedText type="smallBold" style={{ color: Brand.accent }}>
                  Log in
                </ThemedText>
              </Link>
            </View>

            <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
              * required.
            </ThemedText>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  header: { gap: Spacing.one, marginBottom: Spacing.one },
  title: { fontSize: 32, lineHeight: 38 },
  photos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.five,
    marginVertical: Spacing.two,
  },
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
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footnote: { textAlign: 'center' },
});

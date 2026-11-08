import { router } from 'expo-router';
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
import { addStudent } from '@/lib/students';

export default function NewStudentScreen() {
  const theme = useTheme();
  const { profile } = useAccount();

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!profile) return;
    setSaving(true);
    try {
      await addStudent(profile.id, { name, grade, homeAddress });
      router.back();
    } catch (e) {
      Alert.alert('Could not add student', e instanceof Error ? e.message : 'Try again.');
      setSaving(false);
    }
  }

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="default" style={{ color: Brand.accent }}>
              ‹ Cancel
            </ThemedText>
          </Pressable>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.title}>
              Add a student
            </ThemedText>

            <View style={styles.field}>
              <ThemedText type="smallBold">Name *</ThemedText>
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (error) setError('');
                }}
                placeholder="e.g. Amaya Fernando"
                placeholderTextColor={theme.textSecondary}
                style={[inputStyle, error ? { borderColor: Brand.danger, borderWidth: 1.5 } : null]}
              />
              {error ? (
                <ThemedText type="small" style={{ color: Brand.danger }}>
                  {error}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Grade</ThemedText>
              <TextInput
                value={grade}
                onChangeText={setGrade}
                placeholder="e.g. Grade 4"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Home address</ThemedText>
              <TextInput
                value={homeAddress}
                onChangeText={setHomeAddress}
                placeholder="Pickup / drop-off address"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
              />
            </View>

            <Pressable
              onPress={onSave}
              disabled={saving}
              style={[styles.save, saving && { opacity: 0.6 }]}>
              <ThemedText type="smallBold" style={styles.saveText}>
                {saving ? 'Saving…' : 'Add student'}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  content: { padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 32, lineHeight: 38, marginBottom: Spacing.one },
  field: { gap: 6 },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  save: {
    backgroundColor: Brand.primary,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveText: { color: '#000', fontSize: 16 },
});

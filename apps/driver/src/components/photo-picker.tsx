import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@schoolvan/shared';

type Props = {
  uri?: string;
  onChange: (uri: string) => void;
  label: string;
  size?: number;
  /** Shows a red ring + asterisk until a photo is picked. */
  required?: boolean;
};

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

export function PhotoPicker({ uri, onChange, label, size = 96, required }: Props) {
  async function fromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to pick a photo.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
    if (!res.canceled) onChange(res.assets[0].uri);
  }

  async function fromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync(PICK_OPTIONS);
    if (!res.canceled) onChange(res.assets[0].uri);
  }

  function choose() {
    Alert.alert(label, 'Add a photo', [
      { text: 'Take photo', onPress: fromCamera },
      { text: 'Choose from library', onPress: fromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const showRing = required && !uri;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={choose} style={[styles.ringBase, showRing && styles.ring]}>
        {uri ? (
          <Image source={{ uri }} style={[styles.photo, { width: size, height: size, borderRadius: size / 2 }]} />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: size, height: size, borderRadius: size / 2 },
            ]}>
            <ThemedText type="title" style={styles.plus}>
              +
            </ThemedText>
          </View>
        )}
      </Pressable>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
        {required ? ' *' : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  ringBase: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  ring: { borderColor: Brand.danger },
  photo: { backgroundColor: '#00000010' },
  placeholder: {
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { color: '#000', fontSize: 36, lineHeight: 40 },
});

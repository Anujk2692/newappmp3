import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, SPACING} from '../config';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Search songs or videos...',
  loading,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <Icon name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Icon name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSearch}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.text} size="small" />
        ) : (
          <Text style={styles.buttonText}>Search</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
});

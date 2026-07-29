import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

interface InputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({ icon, isPassword, containerStyle, style, ...rest }: InputProps) {
  const [hidden, setHidden] = useState(isPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.icon} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={hidden}
        autoCapitalize="none"
        {...rest}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setHidden((prev) => !prev)} hitSlop={10}>
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
});

import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { colors, spacing, typography } from '@/theme';

interface InputProps extends TextInputProps {
  icon: IconName;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({ icon, isPassword, containerStyle, style, onFocus, onBlur, ...rest }: InputProps) {
  const [hidden, setHidden] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, containerStyle]}>
      <Icon name={icon} size={20} color={colors.textSecondary} style={styles.icon} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={hidden}
        autoCapitalize="none"
        {...rest}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setHidden((prev) => !prev)} hitSlop={10}>
          <Icon
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
  containerFocused: {
    borderColor: colors.primary,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});

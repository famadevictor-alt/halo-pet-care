import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

interface HaloButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const HaloButton: React.FC<HaloButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  icon 
}) => {
  const isGradient = variant === 'gradient';

  const content = (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.base,
        !isGradient && styles[variant],
        style
      ]}
    >
      {icon && <React.Fragment>{icon}</React.Fragment>}
      <Text style={[
        styles.textBase,
        variant === 'outline' ? styles.textOutline : styles.textSolid,
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (isGradient) {
    return (
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, style]}
      >
        {content}
      </LinearGradient>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius['2xl'],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 56,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  gradient: {
    // Gradient is handled by the wrapper
  },
  textBase: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  textSolid: {
    color: theme.colors.white,
  },
  textOutline: {
    color: theme.colors.primary,
  }
});

export default HaloButton;

import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

interface HaloCardProps extends ViewProps {
  variant?: 'flat' | 'elevated' | 'outline';
  children: React.ReactNode;
}

const HaloCard: React.FC<HaloCardProps> = ({ variant = 'elevated', children, style, ...props }) => {
  const { isDark } = useTheme();

  return (
    <View 
      style={[
        styles.base, 
        isDark && { backgroundColor: theme.colors.dark.card, borderColor: theme.colors.dark.border },
        variant === 'elevated' && styles.elevated,
        variant === 'outline' && styles.outline,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius['3xl'],
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  elevated: {
    ...theme.shadows.soft,
  },
  outline: {
    borderWidth: 1,
    borderColor: theme.colors.slate[200],
  }
});

export default HaloCard;

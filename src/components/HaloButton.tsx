import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

interface HaloButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const HaloButton: React.FC<HaloButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  icon,
  isLoading = false
}) => {
  const isGradient = variant === 'gradient';

  const content = (
    <View style={styles.contentContainer}>
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.colors.primary : theme.colors.white} />
      ) : (
        <>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={[
            styles.textBase,
            variant === 'outline' ? styles.textOutline : styles.textSolid,
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
      style={[
        styles.base,
        !isGradient && styles[variant],
        style,
        isLoading && styles.loadingState
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius['2xl'],
    minHeight: 56,
    overflow: 'hidden', // Required for gradient absoluteFill
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
    height: '100%',
  },
  iconWrapper: {
    marginRight: 8,
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
  loadingState: {
    opacity: 0.7,
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

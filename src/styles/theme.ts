export const theme = {
  colors: {
    primary: '#4A8EB2', // Deep Blue
    secondary: '#76B9B3', // Soft Teal
    accent: '#E0F2FE', // Light Sky Blue
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    white: '#FFFFFF',
    dark: {
      bg: '#0F172A', // Slate 900
      card: '#1E293B', // Slate 800
      text: '#F8FAFC', // Slate 50
      border: '#334155', // Slate 700
    }
  },
  gradients: {
    brand: ['#76B9B3', '#4A8EB2'], // Teal to Blue
    soothe: ['#F8FAFC', '#F1F5F9'], // Very light slate
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  shadows: {
    soft: {
      shadowColor: '#4A8EB2',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    strong: {
      shadowColor: '#1E293B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    }
  }
};

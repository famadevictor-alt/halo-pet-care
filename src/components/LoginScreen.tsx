import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions } from 'react-native';
import { Mail, Lock, LogIn, ArrowRight, User, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import Logo from './Logo';
import HaloButton from './HaloButton';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth() {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });
        if (error) throw error;
        Alert.alert('Success', 'Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient 
      colors={[theme.colors.dark.bg, '#0F172A', theme.colors.primary + '20']} 
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.logoWrapper}
            >
              <Logo size={70} />
            </LinearGradient>
            <Text style={styles.title}>Halo Pro Max</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Establish your clinical care profile' : 'Access your professional health registry'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.glassCard}>
              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <View style={styles.inputWrapper}>
                    <User size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Dr. Jane Smith"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="clinical@halopet.care"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              {!isSignUp && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Recover Registry Access</Text>
                </TouchableOpacity>
              )}

              <HaloButton
                variant="gradient"
                title={loading ? 'SYNCHRONIZING...' : (isSignUp ? 'CREATE PROFILE' : 'AUTHORIZE ACCESS')}
                onPress={handleAuth}
                isLoading={loading}
                icon={!loading && <ShieldCheck size={20} color="#FFF" style={{ marginRight: 8 }} />}
                style={styles.authButton}
              />
            </View>

            <TouchableOpacity 
              style={styles.switchMode}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchModeText}>
                {isSignUp ? 'Already registered? AUTHORIZE SIGN IN' : 'New to Halo? ESTABLISH CARE PROFILE'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>CLINICAL GRADE DATA PROTECTION ACTIVE</Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity><Text style={styles.linkText}>SECURITY PROTOCOLS</Text></TouchableOpacity>
              <View style={styles.dot} />
              <TouchableOpacity><Text style={styles.linkText}>PRIVACY POLICY</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    padding: 24,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...theme.shadows.strong,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 24,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 22,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 40,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...theme.shadows.strong,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.primary,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 64,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authButton: {
    height: 64,
    borderRadius: 22,
    ...theme.shadows.strong,
  },
  switchMode: {
    marginTop: 32,
    alignItems: 'center',
  },
  switchModeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
  },
  footerDivider: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  footerLinks: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  }
});


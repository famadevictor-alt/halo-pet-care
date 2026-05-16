import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar
} from 'react-native';
import { 
  X, 
  UserPlus, 
  Users, 
  Mail, 
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Info,
  Send
} from 'lucide-react-native';
import { theme } from '../styles/theme';
import { supabase } from '../lib/supabase';
import HaloButton from './HaloButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const RESEND_API_KEY = 're_G1zcL7dd_DMyijEsL6kc9GZvK3GVzoQCi';

interface CareTeamModalProps {
  visible: boolean;
  onClose: () => void;
  pet: any;
  userEmail: string;
}

export default function CareTeamModal({ visible, onClose, pet, userEmail }: CareTeamModalProps) {
  const { isDark } = useTheme();
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (visible && pet) {
      fetchCaregivers();
    }
  }, [visible, pet]);

  const fetchCaregivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pet_caregivers')
        .select('*')
        .eq('pet_id', pet.id);
      
      if (error) throw error;
      setCaregivers(data || []);
    } catch (error) {
      console.error('Error fetching caregivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const dispatchInvitationEmail = async (recipientEmail: string, petName: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          from: 'Halo Pet Care <info@terra-ascent.com>',
          to: recipientEmail,
          subject: `Join the Care Team for ${petName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; color: #1e293b; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #4A8EB2; font-size: 24px; font-weight: 800; margin: 0;">HALO PET CARE</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">PRECISION HEALTH NETWORK</p>
              </div>
              <div style="background-color: #f8fafc; border-radius: 16px; padding: 32px; margin-bottom: 32px;">
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px; text-align: center;">Care Team Activation</h2>
                <p style="font-size: 16px; line-height: 24px; text-align: center; color: #334155;">
                  You have been designated as a specialized caregiver for <strong>${petName}</strong>. 
                  Join the clinical network to monitor vitals and medication adherence in real-time.
                </p>
              </div>
              <div style="text-align: center;">
                <a href="https://petsync.app/download" style="background-color: #4A8EB2; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; display: inline-block; letter-spacing: 0.5px;">GET STARTED</a>
              </div>
              <p style="text-align: center; margin-top: 24px;">
                <a href="https://petsync.app/download" style="color: #4A8EB2; font-size: 13px; text-decoration: underline;">Or download the app directly here</a>
              </p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 18px;">
                This invitation was initiated via the Halo Pet Care professional registry.<br/>
                © 2026 Terra Ascent Precision Systems
              </p>
            </div>
          `
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        Alert.alert('Email API Error', error.message || 'Resend rejected the request.');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        Alert.alert('Network Timeout', 'The email server is taking too long to respond. Please check your connection.');
      } else {
        Alert.alert('Dispatch Error', 'Could not communicate with the email dispatcher.');
      }
    }
  };

  const handleInvite = async () => {
    const trimmedEmail = inviteEmail.toLowerCase().trim();
    
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Credential', 'Please enter a valid institutional or personal email address.');
      return;
    }

    // Check for Duplicates (Requirement: Users should not be allowed to send invites to already registered mail)
    if (userEmail && trimmedEmail === userEmail.toLowerCase()) {
      Alert.alert('Restricted Action', 'You are the primary registrar of this account and already have full access.');
      return;
    }

    const isAlreadyCaregiver = caregivers.some(c => c.caregiver_email && c.caregiver_email.toLowerCase() === trimmedEmail);
    if (isAlreadyCaregiver) {
      Alert.alert('Duplicate Member', 'This individual is already part of the care network for this patient.');
      return;
    }

    setInviting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Authentication session expired. Please re-login.');
      
      const { error } = await supabase
        .from('pet_caregivers')
        .insert([{
          pet_id: pet.id,
          caregiver_email: trimmedEmail,
          invited_by: userData.user.id,
          status: 'active',
          role: 'caregiver'
        }]);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Duplicate Record', 'This caregiver is already integrated into the care network.');
        } else {
          throw error;
        }
      } else {
        // Dispatch email and await confirmation (with internal timeout in dispatch function)
        await dispatchInvitationEmail(trimmedEmail, pet.name);
        setInviteEmail('');
        fetchCaregivers();
        Alert.alert('Success', `Invitation dispatched to ${trimmedEmail}.`);
      }
    } catch (error: any) {
      console.error('Invite error:', error);
      Alert.alert('Network Error', error.message || 'Could not establish connection to the care registry.');
    } finally {
      setInviting(false);
    }
  };

  const removeCaregiver = async (id: string) => {
    Alert.alert(
      'Terminate Care Access',
      'This will immediately revoke all diagnostic access for this caregiver. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Revoke Access', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('pet_caregivers')
                .delete()
                .eq('id', id);
              if (error) throw error;
              fetchCaregivers();
            } catch (error) {
              console.error('Delete error:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={isDark ? ['rgba(15, 23, 42, 0.98)', 'rgba(30, 41, 59, 0.99)'] : ['#FFFFFF', '#F8FAFC']}
          style={[styles.modalContent, !isDark && { borderColor: 'rgba(0,0,0,0.05)', backgroundColor: '#FFF' }]}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, !isDark && { color: theme.colors.slate[900] }]}>Care Network</Text>
              <Text style={[styles.subtitle, !isDark && { color: theme.colors.slate[500] }]}>Collaborative health management</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={isDark ? "rgba(255,255,255,0.4)" : theme.colors.slate[400]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Invite Section */}
            <View style={[styles.glassCard, !isDark && { backgroundColor: '#F8FAFC', borderColor: 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.cardHeader}>
                <UserPlus size={22} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, !isDark && { color: theme.colors.slate[900] }]}>Add Specialist</Text>
              </View>
              <Text style={[styles.cardSubtitle, !isDark && { color: theme.colors.slate[600] }]}>
                Invite trusted family or medical staff to the {pet?.name || 'patient'}'s care circle for collaborative monitoring.
              </Text>
              
              <View style={[styles.glassInputWrapper, !isDark && { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.1)' }]}>
                <Mail size={18} color={isDark ? "rgba(255,255,255,0.3)" : theme.colors.slate[400]} />
                <TextInput
                  style={[styles.input, !isDark && { color: theme.colors.slate[900] }]}
                  placeholder="clinical@network.com"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : theme.colors.slate[300]}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <HaloButton
                title={inviting ? "SYNCHRONIZING..." : "INITIALIZE NETWORK ACCESS"}
                onPress={handleInvite}
                variant="gradient"
                isLoading={inviting}
                style={{ marginTop: 24, height: 60, borderRadius: 20 }}
              />
            </View>

            {/* Caregivers List */}
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, !isDark && { color: theme.colors.slate[400] }]}>AUTHORIZED PERSONNEL</Text>
              <View style={[styles.badge, !isDark && { backgroundColor: theme.colors.slate[100] }]}>
                <Text style={styles.badgeText}>{caregivers.length + 1}</Text>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.listContainer}>
                {/* Owner (Static) */}
                <View style={[styles.glassMemberItem, !isDark && { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.05)' }]}>
                  <LinearGradient
                    colors={[theme.colors.primary + '40', theme.colors.primary + '10']}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{userEmail ? userEmail[0].toUpperCase() : 'U'}</Text>
                  </LinearGradient>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, !isDark && { color: theme.colors.slate[900] }]}>Primary Registrar</Text>
                    <Text style={[styles.memberEmail, !isDark && { color: theme.colors.slate[500] }]}>{userEmail} (You)</Text>
                  </View>
                  <View style={styles.adminBadge}>
                    <ShieldCheck size={12} color={theme.colors.primary} />
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                  </View>
                </View>

                {caregivers.map(c => (
                  <View key={c.id} style={[styles.glassMemberItem, !isDark && { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.05)' }]}>
                    <View style={[styles.avatar, !isDark && { backgroundColor: theme.colors.slate[50] }]}>
                      <Text style={[styles.avatarText, { color: isDark ? 'rgba(255,255,255,0.4)' : theme.colors.slate[400] }]}>
                        {c.caregiver_email[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, !isDark && { color: theme.colors.slate[900] }]}>Authorized Caregiver</Text>
                      <Text style={[styles.memberEmail, !isDark && { color: theme.colors.slate[500] }]}>{c.caregiver_email}</Text>
                    </View>
                    
                    <View style={styles.memberActions}>
                      <View style={[styles.statusBadge, c.status === 'active' ? styles.statusActive : styles.statusPending, !isDark && { backgroundColor: theme.colors.slate[50] }]}>
                        <CheckCircle2 size={10} color={c.status === 'active' ? theme.colors.success : theme.colors.warning} />
                        <Text style={[styles.statusText, { color: c.status === 'active' ? theme.colors.success : theme.colors.warning }]}>
                          {c.status.toUpperCase()}
                        </Text>
                      </View>
                      
                      <TouchableOpacity onPress={() => removeCaregiver(c.id)} style={styles.revokeBtn}>
                        <Trash2 size={18} color={isDark ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.6)"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {caregivers.length === 0 && (
                  <View style={styles.emptyState}>
                    <Users size={48} color={isDark ? "rgba(255,255,255,0.05)" : theme.colors.slate[100]} />
                    <Text style={[styles.emptyText, !isDark && { color: theme.colors.slate[400] }]}>No secondary personnel registered.</Text>
                  </View>
                )}
              </View>
            )}

            <View style={[styles.clinicalNote, !isDark && { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '20' }]}>
              <Info size={18} color={theme.colors.primary} />
              <Text style={[styles.noteText, !isDark && { color: theme.colors.slate[600] }]}>All registered caregivers receive real-time updates and treatment adherence notifications to ensure collective care precision.</Text>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    marginTop: 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 36,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 40,
    ...theme.shadows.strong,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '600',
  },
  glassInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    height: 64,
  },
  input: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1.5,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  listContainer: {
    gap: 14,
    marginBottom: 40,
  },
  glassMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 142, 178, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  memberActions: {
    alignItems: 'flex-end',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  revokeBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  clinicalNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 142, 178, 0.08)',
    padding: 24,
    borderRadius: 32,
    gap: 18,
    borderWidth: 1,
    borderColor: 'rgba(74, 142, 178, 0.15)',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700',
    lineHeight: 20,
  }
});

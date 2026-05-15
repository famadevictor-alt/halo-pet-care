import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Switch, ScrollView, Alert, TextInput, Platform, Dimensions } from 'react-native';
import { X, Bell, Moon, Lock, Info, LogOut, ChevronRight, User, Shield, CreditCard, HelpCircle, Trash2, Edit2 } from 'lucide-react-native';
import { Image } from 'react-native';
import * as Notifications from 'expo-notifications';
import { theme } from '../styles/theme';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { registerForPushNotificationsAsync, cancelAllNotifications } from '../services/notification-service';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  pets: any[];
  onDeletePet: (petId: string, petName: string) => void;
  onEditPet: (pet: any) => void;
}

export default function SettingsModal({ visible, onClose, pets, onDeletePet, onEditPet }: SettingsModalProps) {
  const { mode, toggleTheme, isDark } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [userName, setUserName] = React.useState('');
  const [updating, setUpdating] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      checkNotificationStatus();
      fetchUserProfile();
    }
  }, [visible]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name);
    }
  };

  const checkNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const handleUpdateName = async () => {
    if (!userName.trim()) return;
    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: userName.trim() }
      });
      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const success = await registerForPushNotificationsAsync();
      if (success) {
        setNotificationsEnabled(true);
      } else {
        setNotificationsEnabled(false);
      }
    } else {
      await cancelAllNotifications();
      setNotificationsEnabled(false);
      Alert.alert('Protocol Deactivated', 'Medication reminders have been disabled.');
    }
  };

  const dynamicStyles = {
    overlay: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.4)',
    },
    modalContent: {
      backgroundColor: isDark ? theme.colors.dark.bg : theme.colors.white,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    text: {
      color: isDark ? '#FFFFFF' : theme.colors.slate[900],
    },
    subtitle: {
      color: isDark ? 'rgba(255,255,255,0.5)' : theme.colors.slate[500],
    },
    glassCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    sectionTitle: {
      color: isDark ? 'rgba(255,255,255,0.3)' : theme.colors.slate[400],
    },
    rowText: {
      color: isDark ? 'rgba(255,255,255,0.8)' : theme.colors.slate[700],
    },
    closeBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    input: {
      color: isDark ? '#FFFFFF' : theme.colors.slate[900],
    },
    divider: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, dynamicStyles.overlay]}>
        <LinearGradient
          colors={isDark ? ['rgba(15, 23, 42, 0.98)', 'rgba(30, 41, 59, 0.99)'] : ['#FFFFFF', '#F8FAFC']}
          style={[styles.modalContent, dynamicStyles.modalContent]}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, dynamicStyles.text]}>System Settings</Text>
              <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Terminal configuration & preferences</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, dynamicStyles.closeBtn]}>
              <X size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* User Profile */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Personnel Identity</Text>
              <View style={[styles.glassCard, dynamicStyles.glassCard]}>
                <View style={styles.inputWrapper}>
                  <User size={20} color={theme.colors.primary} />
                  <TextInput
                    style={[styles.input, dynamicStyles.input]}
                    placeholder="Caregiver Name"
                    placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                    value={userName}
                    onChangeText={setUserName}
                    onBlur={handleUpdateName}
                    returnKeyType="done"
                  />
                  {updating && <ActivityIndicator size="small" color={theme.colors.primary} />}
                </View>
              </View>
            </View>

            {/* System Preferences */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Diagnostic Interface</Text>
              <View style={[styles.glassCard, dynamicStyles.glassCard]}>
                <View style={styles.settingsRow}>
                  <View style={styles.rowLabel}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                      <Bell size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.rowText, dynamicStyles.rowText]}>Treatment Reminders</Text>
                  </View>
                  <Switch 
                    value={notificationsEnabled} 
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', true: theme.colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={[styles.divider, dynamicStyles.divider]} />
                <View style={styles.settingsRow}>
                  <View style={styles.rowLabel}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                      <Moon size={18} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.rowText, dynamicStyles.rowText]}>Clinical Dark Mode</Text>
                  </View>
                  <Switch 
                    value={isDark} 
                    onValueChange={toggleTheme}
                    trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', true: theme.colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>
            </View>

            {/* Privacy & Security */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Security & Ethics</Text>
              <View style={[styles.glassCard, dynamicStyles.glassCard]}>
                <TouchableOpacity style={styles.settingsRow}>
                  <View style={styles.rowLabel}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <Shield size={18} color={theme.colors.success} />
                    </View>
                    <Text style={[styles.rowText, dynamicStyles.rowText]}>Privacy Protocol</Text>
                  </View>
                  <ChevronRight size={18} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} />
                </TouchableOpacity>
                <View style={[styles.divider, dynamicStyles.divider]} />
                <TouchableOpacity style={styles.settingsRow}>
                  <View style={styles.rowLabel}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                      <Info size={18} color={theme.colors.warning} />
                    </View>
                    <Text style={[styles.rowText, dynamicStyles.rowText]}>System Information</Text>
                  </View>
                  <ChevronRight size={18} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pet Management */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Medical Profiles</Text>
              <View style={[styles.glassCard, dynamicStyles.glassCard]}>
                {pets.map(pet => (
                  <View key={pet.id} style={[styles.petListItem, { borderBottomColor: dynamicStyles.divider.backgroundColor }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Image source={{ uri: pet.avatar_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100' }} style={styles.petAvatarMini} />
                      <Text style={[styles.petListName, dynamicStyles.rowText]}>{pet.name}</Text>
                    </View>
                    <View style={styles.petActionRow}>
                      <TouchableOpacity 
                        onPress={() => {
                          onClose();
                          onEditPet(pet);
                        }}
                        style={[styles.actionPetBtn, { backgroundColor: 'rgba(74, 142, 178, 0.1)' }]}
                      >
                        <Edit2 size={16} color={theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => {
                          onClose();
                          onDeletePet(pet.id, pet.name);
                        }}
                        style={styles.deletePetBtn}
                      >
                        <Trash2 size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity 
              style={styles.logoutBtn}
              onPress={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  Alert.alert('System Error', error.message);
                } else {
                  onClose();
                }
              }}
            >
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
                style={styles.logoutGradient}
              >
                <LogOut size={20} color={theme.colors.error} />
                <Text style={styles.logoutText}>Terminate Session</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.versionContainer}>
              <Text style={[styles.versionText, { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}>HALO OS v1.2.0 • CLINICAL BUILD</Text>
              <Text style={[styles.copyright, { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>© 2026 TERRA ASCENT PRECISION SYSTEMS</Text>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '92%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  glassCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  logoutBtn: {
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.error,
    letterSpacing: 0.5,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 48,
    gap: 8,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  copyright: {
    fontSize: 10,
    fontWeight: '700',
  },
  petAvatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  petListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },
  petListName: {
    fontSize: 16,
    fontWeight: '500',
  },
  petActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPetBtn: {
    padding: 8,
    borderRadius: 10,
  },
  deletePetBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
  },
});


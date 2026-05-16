import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Platform, Dimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Calendar, MapPin, Clock, Info, Check, ShieldCheck, ChevronRight, Stethoscope, Activity, User, Scissors, AlertCircle, ShieldAlert } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import HaloButton from './HaloButton';
import HaloCard from './HaloCard';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { scheduleAppointmentReminders, cancelAppointmentNotifications } from '../services/notification-service';

const { width } = Dimensions.get('window');

interface AppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  onSuccess: () => void;
  editingAppointment?: any;
}

const APPOINTMENT_TYPES = [
  { id: 'checkup', label: 'Checkup', Icon: Stethoscope, color: '#6366F1' },
  { id: 'vaccination', label: 'Vaccine', Icon: ShieldCheck, color: '#10B981' },
  { id: 'surgery', label: 'Surgery', Icon: Activity, color: '#EF4444' },
  { id: 'specialist', label: 'Specialist', Icon: User, color: '#8B5CF6' },
  { id: 'grooming', label: 'Grooming', Icon: Scissors, color: '#EC4899' },
  { id: 'emergency', label: 'Emergency', Icon: AlertCircle, color: '#F59E0B' },
];

export default function AppointmentModal({ 
  visible, 
  onClose, 
  petId, 
  petName, 
  onSuccess, 
  editingAppointment 
}: AppointmentModalProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [clinic, setClinic] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('checkup');
  const [notes, setNotes] = useState('');
  const [reminderInterval, setReminderInterval] = useState('60');
  const [reminderCount, setReminderCount] = useState('2');

  const dynamicStyles = useMemo(() => ({
    modalContent: {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
    },
    text: {
      color: isDark ? '#FFFFFF' : theme.colors.slate[900],
    },
    subtext: {
      color: isDark ? '#94A3B8' : theme.colors.slate[500],
    },
    label: {
      color: isDark ? '#CBD5E1' : theme.colors.slate[600],
    },
    input: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(0,0,0,0.02)',
      color: isDark ? '#FFFFFF' : theme.colors.slate[900],
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    closeBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
    },
    badgeText: {
      color: isDark ? '#F59E0B' : '#D97706',
    }
  }), [isDark]);

  useEffect(() => {
    if (editingAppointment && visible) {
      setTitle(editingAppointment.title);
      setClinic(editingAppointment.clinic_name || '');
      const d = new Date(editingAppointment.appointment_at);
      setDate(d.toISOString().split('T')[0]);
      setTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setType(editingAppointment.type);
      setNotes(editingAppointment.notes || '');
      setReminderInterval(editingAppointment.reminder_interval_mins?.toString() || '60');
      setReminderCount(editingAppointment.reminder_count?.toString() || '2');
    } else {
      resetForm();
    }
  }, [editingAppointment, visible]);

  const resetForm = () => {
    setTitle('');
    setClinic('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('10:00');
    setType('checkup');
    setNotes('');
    setReminderInterval('60');
    setReminderCount('2');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Details', 'Please enter a title for the appointment.');
      return;
    }

    setLoading(true);
    try {
      const appointmentAt = new Date(`${date}T${time}:00`).toISOString();
      
      const appointmentData = {
        pet_id: petId,
        title,
        clinic_name: clinic,
        appointment_at: appointmentAt,
        type,
        notes,
        status: 'upcoming',
        reminder_interval_mins: parseInt(reminderInterval),
        reminder_count: parseInt(reminderCount),
        updated_at: new Date().toISOString(),
      };

      let error;
      let apptId;

      if (editingAppointment) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', editingAppointment.id);
        error = updateError;
        apptId = editingAppointment.id;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('appointments')
          .insert(appointmentData)
          .select();
        error = insertError;
        if (insertData && insertData.length > 0) {
          apptId = insertData[0].id;
        }
      }

      if (error) throw error;

      if (apptId) {
        await cancelAppointmentNotifications(apptId);
        await scheduleAppointmentReminders(
          apptId, 
          title, 
          appointmentAt, 
          parseInt(reminderInterval), 
          parseInt(reminderCount)
        );
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Sync Error', error.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#FFF' }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={isDark ? ['#020617', '#0F172A', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : 24, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
          <View>
            <Text style={[styles.headerTitle, dynamicStyles.text]}>
              {editingAppointment ? 'Update Booking' : 'New Appointment'}
            </Text>
            <Text style={[styles.headerSubtitle, dynamicStyles.subtext]}>
              Scheduling clinical care for {petName}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.closeButton, dynamicStyles.closeBtn]}
          >
            <X size={24} color={isDark ? theme.colors.slate[300] : theme.colors.slate[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Info Card */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, dynamicStyles.subtext]}>PRIMARY LOGISTICS</Text>
            <View style={[styles.glassCard, dynamicStyles.modalContent]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, dynamicStyles.label]}>APPOINTMENT TITLE</Text>
                <TextInput
                  style={[styles.textInput, dynamicStyles.text, dynamicStyles.input]}
                  placeholder="e.g. Annual Physical, Bloodwork"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15, 23, 42, 0.3)'}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, dynamicStyles.label]}>CLINIC / VETERINARIAN</Text>
                <View style={[styles.inputWrapper, dynamicStyles.input]}>
                  <MapPin size={20} color={theme.colors.primary} />
                  <TextInput
                    style={[styles.rowInput, dynamicStyles.text]}
                    placeholder="Clinic name or provider"
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15, 23, 42, 0.3)'}
                    value={clinic}
                    onChangeText={setClinic}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1.2, marginRight: 12 }]}>
                  <Text style={[styles.inputLabel, dynamicStyles.label]}>DATE</Text>
                  <View style={[styles.inputWrapper, dynamicStyles.input]}>
                    <Calendar size={18} color={theme.colors.primary} />
                    <TextInput
                      style={[styles.rowInput, dynamicStyles.text]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15, 23, 42, 0.3)'}
                      value={date}
                      onChangeText={setDate}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, dynamicStyles.label]}>TIME</Text>
                  <View style={[styles.inputWrapper, dynamicStyles.input]}>
                    <Clock size={18} color={theme.colors.primary} />
                    <TextInput
                      style={[styles.rowInput, dynamicStyles.text]}
                      placeholder="HH:MM"
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15, 23, 42, 0.3)'}
                      value={time}
                      onChangeText={setTime}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Appointment Type Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, dynamicStyles.subtext]}>CARE CLASSIFICATION</Text>
            <View style={styles.typeGrid}>
              {APPOINTMENT_TYPES.map((t) => {
                const Icon = t.Icon;
                const active = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeCard,
                      dynamicStyles.modalContent,
                      active && { borderColor: theme.colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => setType(t.id)}
                  >
                    <View style={[styles.typeIconBox, { backgroundColor: active ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.03)' : t.color + '15') }]}>
                      <Icon size={20} color={active ? '#FFF' : (isDark ? t.color + 'CC' : t.color)} />
                    </View>
                    <Text style={[styles.typeLabel, dynamicStyles.text, active && { color: theme.colors.primary }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, dynamicStyles.subtext]}>PREPARATION & NOTES</Text>
            <TextInput
              style={[styles.notesInput, dynamicStyles.modalContent, dynamicStyles.text]}
              placeholder="e.g. Fasting required for 12 hours, bring stool sample..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15, 23, 42, 0.3)'}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Reminders Section */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionLabel, dynamicStyles.subtext]}>CLINICAL REMINDERS</Text>
              <View style={styles.activeBadge}>
                <ShieldAlert size={12} color={theme.colors.warning} />
                <Text style={[styles.activeBadgeText, dynamicStyles.badgeText]}>NAGGING ENABLED</Text>
              </View>
            </View>
            
            <View style={[styles.glassCard, dynamicStyles.modalContent]}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={[styles.inputLabel, dynamicStyles.label]}>INTERVAL (MINS)</Text>
                  <TextInput
                    style={[styles.textInput, dynamicStyles.text, dynamicStyles.input]}
                    value={reminderInterval}
                    onChangeText={setReminderInterval}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, dynamicStyles.label]}>REPETITION COUNT</Text>
                  <TextInput
                    style={[styles.textInput, dynamicStyles.text, dynamicStyles.input]}
                    value={reminderCount}
                    onChangeText={setReminderCount}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* Footer */}
        <LinearGradient
          colors={isDark ? ['transparent', 'rgba(2, 6, 23, 0.9)', '#020617'] : ['transparent', 'rgba(255,255,255,0.9)', '#FFF']}
          style={styles.footer}
        >
          <HaloButton
            title={loading ? 'SYNCHRONIZING...' : (editingAppointment ? 'UPDATE APPOINTMENT' : 'CONFIRM APPOINTMENT')}
            onPress={handleSave}
            variant="primary"
            disabled={loading}
            style={styles.submitBtn}
          />
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  glassCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    ...theme.shadows.soft,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  textInput: {
    height: 60,
    borderRadius: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  rowInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    ...theme.shadows.soft,
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  notesInput: {
    borderRadius: 24,
    padding: 20,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    minHeight: 120,
    textAlignVertical: 'top',
    ...theme.shadows.soft,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  submitBtn: {
    height: 64,
    borderRadius: 20,
    ...theme.shadows.strong,
  },
});

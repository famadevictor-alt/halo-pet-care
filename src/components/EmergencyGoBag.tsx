import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { 
  X, 
  AlertTriangle, 
  Microscope, 
  Clipboard, 
  Clock, 
  Activity,
  Phone,
  ShieldAlert,
  ChevronRight,
  Stethoscope,
  Info,
  User
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import HaloButton from './HaloButton';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface EmergencyGoBagProps {
  visible: boolean;
  onClose: () => void;
  pet: any;
  medications: any[];
  logs: any[];
  vitals: any[];
}

export default function EmergencyGoBag({
  visible,
  onClose,
  pet,
  medications,
  logs,
  vitals
}: EmergencyGoBagProps) {
  const { isDark } = useTheme();
  const lastLog = (medId: string) => {
    return logs.find(l => l.medication_id === medId);
  };

  const currentWeight = vitals.length > 0 ? vitals[0].value : (pet?.weight_kg || '—');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, !isDark && { backgroundColor: '#F8FAFC' }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={isDark ? [theme.colors.slate[950], theme.colors.slate[900]] : ['#FFFFFF', '#F1F5F9']}
          style={StyleSheet.absoluteFill}
        />

        {/* Urgent Header */}
        <View style={[styles.header, !isDark && { borderBottomColor: theme.colors.slate[200] }]}>
          <View style={styles.headerLeft}>
            <View style={styles.alertIcon}>
              <ShieldAlert size={28} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.headerTitle, !isDark && { color: theme.colors.slate[900] }]}>Emergency Go-Bag</Text>
              <Text style={styles.headerSubtitle}>Critical Clinical Handover</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, !isDark && { backgroundColor: theme.colors.slate[100] }]}>
            <X size={24} color={isDark ? theme.colors.slate[400] : theme.colors.slate[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Identity Section - Glass Card */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>IDENTITY & VITALS</Text>
            <View style={[styles.glassCard, !isDark && { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.idHeader}>
                <Text style={[styles.petName, !isDark && { color: theme.colors.slate[900] }]}>{pet?.name || 'Unknown'}</Text>
                <View style={[styles.speciesBadge, !isDark && { backgroundColor: theme.colors.slate[100] }]}>
                  <Text style={[styles.speciesText, !isDark && { color: theme.colors.slate[600] }]}>{pet?.species || '—'} • {pet?.breed || '—'}</Text>
                </View>
              </View>
              
              <View style={[styles.divider, !isDark && { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
              
              <View style={styles.idGrid}>
                <View style={styles.idItem}>
                  <Text style={styles.idLabel}>MICROCHIP</Text>
                  <Text style={[styles.idValue, !isDark && { color: theme.colors.slate[700] }]}>{pet?.microchip_id || 'NOT REGISTERED'}</Text>
                </View>
                <View style={styles.idItem}>
                  <Text style={styles.idLabel}>WEIGHT</Text>
                  <Text style={[styles.idValue, !isDark && { color: theme.colors.slate[700] }]}>{currentWeight} kg</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Critical Alerts - Red Tinted Glass */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CRITICAL ALERTS</Text>
            <View style={styles.alertCard}>
              <LinearGradient
                colors={['rgba(220, 38, 38, 0.15)', 'rgba(220, 38, 38, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.alertHeader}>
                <AlertTriangle size={20} color="#EF4444" />
                <Text style={styles.alertTitle}>Allergies & Clinical Notes</Text>
              </View>
              <Text style={styles.alertText}>
                {pet?.medical_notes || 'No critical clinical alerts or allergies documented in registry.'}
              </Text>
            </View>
          </View>

          {/* Active Medications */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVE MEDICATION REGISTRY</Text>
            {medications.length === 0 ? (
              <View style={[styles.emptyCard, !isDark && { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }]}>
                <Info size={24} color={theme.colors.slate[400]} />
                <Text style={styles.emptyText}>No active medications found.</Text>
              </View>
            ) : (
              medications.map(med => {
                const lastTaken = lastLog(med.id);
                return (
                  <View key={med.id} style={[styles.medCard, !isDark && { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.05)' }]}>
                    <View style={styles.medMain}>
                      <View style={styles.medInfo}>
                        <Text style={[styles.medName, !isDark && { color: theme.colors.slate[900] }]}>{med.name}</Text>
                        <Text style={[styles.medInstructions, !isDark && { color: theme.colors.slate[500] }]}>{med.dosage_instructions}</Text>
                      </View>
                      <View style={styles.medBadge}>
                        <Text style={styles.medBadgeText}>{med.strength || 'N/A'}</Text>
                      </View>
                    </View>
                    
                    <View style={[styles.lastDoseRow, !isDark && { backgroundColor: theme.colors.slate[50] }]}>
                      <Clock size={14} color={theme.colors.primary} />
                      <Text style={styles.lastDoseLabel}>LAST ADMINISTERED:</Text>
                      <Text style={[styles.lastDoseValue, !isDark && { color: theme.colors.slate[600] }]}>
                        {lastTaken ? format(new Date(lastTaken.taken_at), 'MMM d, h:mm a') : 'NEVER LOGGED'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Protocol Info */}
          <View style={[styles.protocolCard, !isDark && { backgroundColor: 'rgba(0,0,0,0.03)' }]}>
            <Stethoscope size={20} color={isDark ? theme.colors.slate[400] : theme.colors.slate[500]} />
            <Text style={[styles.protocolText, !isDark && { color: theme.colors.slate[600] }]}>
              Present this screen to the intake nurse. It provides essential triage information and current medication status.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.emergencyBtn} onPress={() => {/* Logic for calling vet */}}>
            <LinearGradient
              colors={['#EF4444', '#B91C1C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Phone size={20} color="#FFF" />
            <Text style={styles.emergencyBtnText}>Contact Primary Care Vet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.strong,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.slate[400],
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.slate[500],
    marginBottom: 12,
    letterSpacing: 1,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  idHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  petName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  speciesBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  speciesText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.slate[300],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  idGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  idItem: {
    flex: 1,
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.slate[500],
    marginBottom: 4,
  },
  idValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.slate[200],
  },
  alertCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    overflow: 'hidden',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FCA5A5',
  },
  alertText: {
    fontSize: 15,
    color: '#FECACA',
    lineHeight: 22,
    fontWeight: '500',
  },
  medCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  medMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  medInstructions: {
    fontSize: 13,
    color: theme.colors.slate[400],
    lineHeight: 18,
  },
  medBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  lastDoseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 12,
  },
  lastDoseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.slate[500],
  },
  lastDoseValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.slate[300],
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyText: {
    marginTop: 12,
    color: theme.colors.slate[500],
    fontSize: 14,
    fontWeight: '600',
  },
  protocolCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    marginTop: 8,
  },
  protocolText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.slate[500],
    lineHeight: 18,
    fontStyle: 'italic',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: 'transparent',
  },
  emergencyBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
    ...theme.shadows.strong,
  },
  emergencyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

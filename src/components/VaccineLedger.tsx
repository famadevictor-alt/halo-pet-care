import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform, TextInput } from 'react-native';
import { X, ShieldCheck, Calendar, ChevronRight, AlertTriangle, Plus, History, Clock } from 'lucide-react-native';
import { theme } from '../styles/theme';
import HaloButton from './HaloButton';
import HaloCard from './HaloCard';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface VaccineLedgerProps {
  visible: boolean;
  onClose: () => void;
  petId: string;
}

export default function VaccineLedger({ visible, onClose, petId }: VaccineLedgerProps) {
  const { isDark } = useTheme();
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [vaccineName, setVaccineName] = useState('');
  const [dateAdministered, setDateAdministered] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && petId) {
      fetchVaccinations();
    }
  }, [visible, petId]);

  const fetchVaccinations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('pet_id', petId)
        .order('administered_at', { ascending: false });

      if (error) throw error;
      setVaccinations(data || []);
    } catch (error) {
      console.error('Error fetching vaccinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVaccine = async () => {
    if (!vaccineName || !dateAdministered) {
      Alert.alert('Required Fields', 'Please enter the vaccine name and date administered.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('vaccinations')
        .insert([{
          pet_id: petId,
          name: vaccineName,
          administered_at: dateAdministered,
          expires_at: nextDueDate || null,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      setVaccineName('');
      setNextDueDate('');
      setShowAddForm(false);
      fetchVaccinations();
      Alert.alert('Success', 'Vaccination record added.');
    } catch (error) {
      Alert.alert('Error', 'Failed to add vaccination record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = (date: string) => {
    if (!date) return false;
    return new Date(date).getTime() < Date.now();
  };

  const renderVaccineItem = (item: any) => {
    const expired = isExpired(item.expires_at);
    
    return (
      <HaloCard key={item.id} variant="elevated" style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={[styles.iconBox, { backgroundColor: expired ? '#FEE2E2' : '#F0FDF4' }]}>
            <ShieldCheck size={24} color={expired ? theme.colors.error : theme.colors.success} />
          </View>
          <View style={styles.recordMainInfo}>
            <Text style={[styles.vaccineName, isDark && { color: theme.colors.white }]}>{item.name}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={theme.colors.slate[400]} />
              <Text style={styles.dateText}>Administered: {new Date(item.administered_at).toLocaleDateString()}</Text>
            </View>
          </View>
          {item.expires_at && (
            <View style={[styles.statusBadge, { backgroundColor: expired ? theme.colors.error + '20' : theme.colors.success + '20' }]}>
              <Text style={[styles.statusText, { color: expired ? theme.colors.error : theme.colors.success }]}>
                {expired ? 'EXPIRED' : 'VALID'}
              </Text>
            </View>
          )}
        </View>

        {item.expires_at && (
          <View style={[styles.dueSection, isDark && { borderTopColor: theme.colors.dark.border }]}>
            <View style={styles.dueInfo}>
              <Clock size={14} color={expired ? theme.colors.error : theme.colors.slate[400]} />
              <Text style={[styles.dueLabel, expired && { color: theme.colors.error }]}>Next Due:</Text>
              <Text style={[styles.dueValue, expired && { color: theme.colors.error, fontWeight: '800' }]}>
                {new Date(item.expires_at).toLocaleDateString()}
              </Text>
            </View>
            {expired && <AlertTriangle size={16} color={theme.colors.error} />}
          </View>
        )}
      </HaloCard>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <LinearGradient 
          colors={isDark ? [theme.colors.dark.bg, '#1a1a2e'] : ['#F8FAFC', '#F1F5F9']} 
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={[styles.header, isDark && { borderBottomColor: theme.colors.dark.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDark ? theme.colors.slate[400] : theme.colors.slate[600]} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, isDark && { color: theme.colors.white }]}>Immunization Ledger</Text>
              <Text style={styles.headerSubtitle}>Official vaccination history</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
            {/* Quick Action */}
            <TouchableOpacity 
              style={[styles.addQuickAction, isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
              onPress={() => setShowAddForm(true)}
            >
              <LinearGradient colors={theme.gradients.brand} style={styles.addIconCircle}>
                <Plus size={24} color="#FFF" />
              </LinearGradient>
              <View style={styles.addTextContainer}>
                <Text style={[styles.addTitle, isDark && { color: theme.colors.white }]}>Add New Record</Text>
                <Text style={styles.addSubtitle}>Log a recent vaccination</Text>
              </View>
              <ChevronRight size={20} color={theme.colors.slate[300]} />
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : vaccinations.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <ShieldCheck size={48} color={theme.colors.slate[200]} />
                </View>
                <Text style={[styles.emptyTitle, isDark && { color: theme.colors.slate[300] }]}>No Records Found</Text>
                <Text style={styles.emptySubtitle}>Start building your pet's immunization history</Text>
              </View>
            ) : (
              <View style={styles.recordsList}>
                <View style={styles.sectionHeader}>
                  <History size={18} color={theme.colors.primary} />
                  <Text style={[styles.sectionTitle, isDark && { color: theme.colors.white }]}>History</Text>
                </View>
                {vaccinations.map(renderVaccineItem)}
              </View>
            )}
          </ScrollView>

          {/* Add Form Modal */}
          <Modal visible={showAddForm} animationType="fade" transparent>
            <View style={styles.formOverlay}>
              <HaloCard style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Add Vaccination</Text>
                  <TouchableOpacity onPress={() => setShowAddForm(false)}>
                    <X size={24} color={theme.colors.slate[400]} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formBody}>
                  <Text style={styles.inputLabel}>Vaccine Name</Text>
                  <View style={styles.inputWrapper}>
                    <ShieldCheck size={20} color={theme.colors.slate[400]} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.textInput}
                      placeholder="e.g. Rabies, DHPP"
                      value={vaccineName}
                      onChangeText={setVaccineName}
                      placeholderTextColor={theme.colors.slate[400]}
                    />
                  </View>

                  <Text style={styles.inputLabel}>Date Administered</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={20} color={theme.colors.slate[400]} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.textInput}
                      placeholder="YYYY-MM-DD"
                      value={dateAdministered}
                      onChangeText={setDateAdministered}
                      placeholderTextColor={theme.colors.slate[400]}
                    />
                  </View>

                  <Text style={styles.inputLabel}>Next Due Date (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <ShieldCheck size={20} color={theme.colors.slate[400]} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.textInput}
                      placeholder="YYYY-MM-DD"
                      value={nextDueDate}
                      onChangeText={setNextDueDate}
                      placeholderTextColor={theme.colors.slate[400]}
                    />
                  </View>
                </View>

                <View style={styles.formFooter}>
                  <HaloButton 
                    title="Save Record" 
                    onPress={handleAddVaccine}
                    isLoading={isSubmitting}
                    variant="gradient"
                    style={styles.submitButton}
                  />
                </View>
              </HaloCard>
            </View>
          </Modal>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.slate[800],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.slate[400],
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 24,
  },
  addQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFF',
    ...theme.shadows.soft,
    marginBottom: 32,
  },
  addIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.slate[800],
  },
  addSubtitle: {
    fontSize: 13,
    color: theme.colors.slate[400],
    marginTop: 2,
  },
  recordsList: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.slate[800],
  },
  recordCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordMainInfo: {
    flex: 1,
    marginLeft: 16,
  },
  vaccineName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.slate[800],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.slate[400],
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueLabel: {
    fontSize: 13,
    color: theme.colors.slate[400],
    fontWeight: '600',
  },
  dueValue: {
    fontSize: 13,
    color: theme.colors.slate[800],
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.slate[800],
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.slate[400],
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  formCard: {
    padding: 24,
    borderRadius: 32,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.slate[800],
  },
  formBody: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[600],
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.slate[800],
    fontWeight: '600',
  },
  formFooter: {
    marginTop: 32,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
  }
});

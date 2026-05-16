import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert
} from 'react-native';
import { X, Check, Pill, Clock, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import HaloButton from './HaloButton';

interface BatchLogModalProps {
  visible: boolean;
  onClose: () => void;
  pets: any[];
  allMedications: any[];
  onLogBatch: (logs: any[]) => Promise<void>;
}

export default function BatchLogModal({ visible, onClose, pets, allMedications, onLogBatch }: BatchLogModalProps) {
  const { isDark } = useTheme();
  const [selectedMeds, setSelectedMeds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Group medications by pet and identify what's due
  const batchData = useMemo(() => {
    const now = new Date();
    
    return (pets || []).map(pet => {
      const petMeds = (allMedications || []).filter(m => m.pet_id === pet.id && m.is_active);
      
      const dueMeds = petMeds.map(med => {
        const lastTaken = med.last_taken_at ? new Date(med.last_taken_at) : new Date(med.start_date || 0);
        const nextDue = new Date(lastTaken.getTime() + (med.interval_hours * 60 * 60 * 1000));
        const diffMs = nextDue.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        return {
          ...med,
          nextDue,
          isDue: diffHours <= 1, // Due within the next hour or already past
          isPastDue: diffHours < 0,
          dueInText: diffHours < 0 
            ? 'Past Due' 
            : `Due in ${Math.round(diffHours * 60)}m`
        };
      }).sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime());

      return {
        ...pet,
        meds: dueMeds
      };
    }).filter(p => p.meds.length > 0);
  }, [pets, allMedications, visible]);

  const toggleMed = (medId: string) => {
    const newSelected = new Set(selectedMeds);
    if (newSelected.has(medId)) {
      newSelected.delete(medId);
    } else {
      newSelected.add(medId);
    }
    setSelectedMeds(newSelected);
  };

  const handleSelectAll = () => {
    const allDueIds = batchData.flatMap(p => p.meds.filter(m => m.isDue).map(m => m.id));
    if (selectedMeds.size === allDueIds.length && allDueIds.length > 0) {
      setSelectedMeds(new Set());
    } else {
      setSelectedMeds(new Set(allDueIds));
    }
  };

  const handleConfirm = async () => {
    if (selectedMeds.size === 0) {
      Alert.alert('Selection Required', 'Please select at least one medication to log.');
      return;
    }

    setLoading(true);
    try {
      const logs = Array.from(selectedMeds).map(medId => {
        const med = allMedications.find(m => m.id === medId);
        return {
          pet_id: med.pet_id,
          medication_id: med.id,
          type: 'medication',
          status: 'taken',
          taken_at: new Date().toISOString(),
          scheduled_at: new Date().toISOString() // Simplification for batch log
        };
      });

      await onLogBatch(logs);
      onClose();
      setSelectedMeds(new Set());
    } catch (error) {
      console.error('Batch log error:', error);
      Alert.alert('Error', 'Failed to synchronize batch records.');
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = {
    modal: { backgroundColor: isDark ? '#000' : '#F8FAFC' },
    card: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF' },
    text: { color: isDark ? '#FFF' : '#1E293B' },
    subtext: { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' },
    border: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, dynamicStyles.modal]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, dynamicStyles.text]}>Morning Rounds</Text>
            <Text style={[styles.subtitle, dynamicStyles.subtext]}>Log medications for all patients</Text>
          </View>
          <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
            <Text style={styles.selectAllText}>
              {selectedMeds.size > 0 ? 'Deselect All' : 'Select All Due'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {batchData.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle2 size={64} color={theme.colors.success} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, dynamicStyles.text]}>All Caught Up!</Text>
              <Text style={[styles.emptySubtitle, dynamicStyles.subtext]}>
                No medications are currently due for any patients in your care circle.
              </Text>
            </View>
          ) : (
            batchData.map((pet) => (
              <View key={pet.id} style={styles.petSection}>
                <View style={styles.petHeader}>
                  <View style={styles.petInfo}>
                    <Text style={[styles.petName, dynamicStyles.text]}>{pet.name}</Text>
                    <Text style={[styles.petBreed, dynamicStyles.subtext]}>{pet.species} • {pet.breed}</Text>
                  </View>
                </View>

                {pet.meds.map((med: any) => (
                  <TouchableOpacity 
                    key={med.id}
                    style={[
                      styles.medCard, 
                      dynamicStyles.card, 
                      dynamicStyles.border,
                      selectedMeds.has(med.id) && styles.medCardSelected
                    ]}
                    onPress={() => toggleMed(med.id)}
                  >
                    <View style={styles.medMain}>
                      <View style={[
                        styles.checkCircle,
                        selectedMeds.has(med.id) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                      ]}>
                        {selectedMeds.has(med.id) && <Check size={16} color="#FFF" />}
                      </View>
                      
                      <View style={styles.medInfo}>
                        <Text style={[styles.medName, dynamicStyles.text]}>{med.name}</Text>
                        <Text style={[styles.medDosage, dynamicStyles.subtext]}>{med.strength} • {med.dosage_instructions}</Text>
                      </View>

                      <View style={[
                        styles.dueTag,
                        med.isPastDue ? styles.dueTagPast : (med.isDue ? styles.dueTagNow : styles.dueTagLater)
                      ]}>
                        <Clock size={12} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.dueTagText}>{med.dueInText}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>

        <View style={[styles.footer, dynamicStyles.border]}>
          <HaloButton
            variant="gradient"
            title={loading ? 'Synchronizing Batch...' : `Log ${selectedMeds.size} Medications`}
            onPress={handleConfirm}
            isLoading={loading}
            disabled={selectedMeds.size === 0}
            style={{ height: 60, borderRadius: 18 }}
          />
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  selectAllBtn: {
    paddingVertical: 8,
  },
  selectAllText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  petSection: {
    marginBottom: 32,
  },
  petHeader: {
    marginBottom: 12,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
  },
  petBreed: {
    fontSize: 13,
  },
  medCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  medCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(74, 142, 178, 0.05)',
  },
  medMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  medDosage: {
    fontSize: 13,
  },
  dueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dueTagPast: { backgroundColor: theme.colors.error },
  dueTagNow: { backgroundColor: theme.colors.primary },
  dueTagLater: { backgroundColor: '#64748B' },
  dueTagText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    borderTopWidth: 1,
  },
});

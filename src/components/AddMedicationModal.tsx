import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Pill, Camera, Check, ChevronRight, Clock, Info, Calendar, Beaker, ShieldAlert, Image as ImageIcon } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import HaloButton from './HaloButton';
import HaloCard from './HaloCard';
import * as ImagePicker from 'expo-image-picker';
import { parsePrescription } from '../services/gemini-vision';
import { supabase } from '../lib/supabase';
import { scheduleAdaptiveDose, cancelMedicationNotifications } from '../services/notification-service';
import { useTheme } from '../context/ThemeContext';

interface AddMedicationModalProps {
  visible: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  onSuccess: () => void;
  onScanPress?: () => void;
  initialData?: any;
  editingMedication?: any;
}

type Step = 'choice' | 'scanning' | 'form' | 'success';

export default function AddMedicationModal({ 
  visible, 
  onClose, 
  petId, 
  petName, 
  onSuccess, 
  onScanPress, 
  initialData,
  editingMedication 
}: AddMedicationModalProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [step, setStep] = useState<Step>('choice');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [interval, setInterval] = useState('12');
  const [instructions, setInstructions] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [unit, setUnit] = useState<'hours' | 'mins'>('hours');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [remainingDoses, setRemainingDoses] = useState('');
  const [trackInventory, setTrackInventory] = useState(false);
  const [reminderInterval, setReminderInterval] = useState('5');
  const [reminderCount, setReminderCount] = useState('12');

  const dynamicStyles = useMemo(() => ({
    modalContent: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    text: {
      color: isDark ? '#FFFFFF' : theme.colors.slate[900],
    },
    subtext: {
      color: isDark ? 'rgba(255,255,255,0.6)' : theme.colors.slate[500],
    },
    input: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      color: isDark ? '#FFFFFF' : theme.colors.slate[900],
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    card: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    closeBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    overlay: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(15, 23, 42, 0.3)',
    }
  }), [isDark]);

  useEffect(() => {
    if (initialData && visible) {
      setName(initialData.pillName && initialData.pillName !== 'Unknown' ? initialData.pillName : '');
      setDosage(initialData.identifiedStrength || '');
      setStep('form');
    } else if (editingMedication && visible) {
      setName(editingMedication.name);
      setDosage(editingMedication.dosage_instructions);
      setInterval(editingMedication.interval_hours.toString());
      setInstructions(editingMedication.instructions || '');
      if (editingMedication.total_quantity) {
        setTotalQuantity(editingMedication.total_quantity.toString());
        setRemainingDoses(editingMedication.remaining_doses?.toString() || '');
        setTrackInventory(true);
      }
      setReminderInterval(editingMedication.reminder_interval_mins?.toString() || '5');
      setReminderCount(editingMedication.reminder_count?.toString() || '12');
      setStep('form');
    }
  }, [initialData, editingMedication, visible]);

  const resetForm = () => {
    setStep('choice');
    setName('');
    setDosage('');
    setInterval('12');
    setInstructions('');
    setImage(null);
    setTotalQuantity('');
    setRemainingDoses('');
    setTrackInventory(false);
    setReminderInterval('5');
    setReminderCount('12');
    setLoading(false);
  };

  const handleCapturePrescription = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      processPrescription(result.assets[0].base64);
    }
  };

  const handleSelectPrescription = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to upload clinical labels.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      processPrescription(result.assets[0].base64);
    }
  };

  const processPrescription = async (base64: string) => {
    setStep('scanning');
    setLoading(true);
    try {
      const data = await parsePrescription(base64);
      if (data.name) setName(data.name);
      if (data.dosage) setDosage(data.dosage);
      if (data.interval_hours) setInterval(data.interval_hours.toString());
      if (data.instructions) setInstructions(data.instructions);
      if (data.total_quantity) {
        setTotalQuantity(data.total_quantity.toString());
        setRemainingDoses(data.total_quantity.toString());
        setTrackInventory(true);
      }
      setStep('form');
    } catch (error) {
      Alert.alert('AI Error', 'Failed to parse prescription. Switching to manual entry.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'choice':
        return (
          <View style={styles.stepContainer}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.iconCircle}
            >
              <Pill size={40} color={theme.colors.primary} />
            </LinearGradient>
            <Text style={[styles.subtitle, dynamicStyles.subtext]}>How would you like to add {petName}'s medication?</Text>
            
            <TouchableOpacity style={[styles.glassChoiceCard, dynamicStyles.card]} onPress={onScanPress}>
              <View style={[styles.choiceIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Camera size={24} color={theme.colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceTitle, dynamicStyles.text]}>Scan Pill with AI</Text>
                <Text style={[styles.choiceSubtitle, dynamicStyles.subtext, { opacity: 0.7 }]}>Identify pill via camera</Text>
              </View>
              <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.glassChoiceCard, dynamicStyles.card]} onPress={handleCapturePrescription}>
              <View style={[styles.choiceIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Camera size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceTitle, dynamicStyles.text]}>Scan Prescription Label</Text>
                <Text style={[styles.choiceSubtitle, dynamicStyles.subtext, { opacity: 0.7 }]}>Extract details via camera</Text>
              </View>
              <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.glassChoiceCard, dynamicStyles.card]} onPress={handleSelectPrescription}>
              <View style={[styles.choiceIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <ImageIcon size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceTitle, dynamicStyles.text]}>Upload from Gallery</Text>
                <Text style={[styles.choiceSubtitle, dynamicStyles.subtext, { opacity: 0.7 }]}>Import label from records</Text>
              </View>
              <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.glassChoiceCard, dynamicStyles.card]} onPress={() => setStep('form')}>
              <View style={[styles.choiceIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Beaker size={24} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceTitle, dynamicStyles.text]}>Manual Entry</Text>
                <Text style={[styles.choiceSubtitle, dynamicStyles.subtext, { opacity: 0.7 }]}>Type details yourself</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ marginTop: 24, paddingVertical: 12, width: '100%', alignItems: 'center' }} 
              onPress={() => { onClose(); resetForm(); }}
            >
              <Text style={[dynamicStyles.subtext, { fontSize: 16, fontWeight: '500' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case 'scanning':
        return (
          <View style={styles.stepContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.subtitle, dynamicStyles.subtext]}>Extracting high-precision details from your prescription.</Text>
          </View>
        );

      case 'form':
        return (
          <ScrollView 
            style={styles.formContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
          >

            <View style={styles.inputGroup}>
              <Text style={[styles.label, dynamicStyles.subtext, { fontWeight: '700' }]}>Medication Name</Text>
              <TextInput 
                style={[styles.glassInput, dynamicStyles.input]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Amoxicillin"
                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, dynamicStyles.subtext, { fontWeight: '700' }]}>Dosage & Strength</Text>
              <TextInput 
                style={[styles.glassInput, dynamicStyles.input]}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g. 1 pill (5mg)"
                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.label, dynamicStyles.subtext, { fontWeight: '700', marginBottom: 0 }]}>Frequency Interval</Text>
                <View style={[styles.unitToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <TouchableOpacity 
                    style={[styles.unitBtn, unit === 'hours' && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} 
                    onPress={() => setUnit('hours')}
                  >
                    <Text style={[styles.unitBtnText, unit === 'hours' && { color: isDark ? '#FFFFFF' : theme.colors.slate[900] }]}>Hours</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.unitBtn, unit === 'mins' && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} 
                    onPress={() => setUnit('mins')}
                  >
                    <Text style={[styles.unitBtnText, unit === 'mins' && { color: isDark ? '#FFFFFF' : theme.colors.slate[900] }]}>Mins</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TextInput 
                style={[styles.glassInput, dynamicStyles.input]}
                value={interval}
                onChangeText={setInterval}
                keyboardType="numeric"
                placeholder={unit === 'hours' ? "e.g. 12" : "e.g. 45"}
                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
              />
              
              <View style={[styles.frequencyContainer, { marginTop: 16 }]}>
                {(unit === 'hours' ? ['8', '12', '24'] : ['15', '30', '45']).map((val) => (
                  <TouchableOpacity 
                    key={val}
                    style={[styles.freqBtn, dynamicStyles.input, interval === val && styles.freqBtnActive]}
                    onPress={() => setInterval(val)}
                  >
                    <Text style={[styles.freqText, interval === val && styles.freqTextActive]}>{val}{unit === 'hours' ? 'h' : 'm'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.glassInfoBox, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Clock size={18} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.primary }]}>
                Protocol: Next dose in {interval} {unit}
              </Text>
            </View>

            <View style={[styles.inputGroup, { marginTop: 32 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.label, dynamicStyles.subtext, { fontWeight: '700', marginBottom: 0 }]}>Inventory Forecast</Text>
                  <Info size={14} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
                </View>
                <Switch 
                  value={trackInventory}
                  onValueChange={setTrackInventory}
                  trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', true: theme.colors.success }}
                  thumbColor="#FFF"
                />
              </View>

              {trackInventory && (
                <View style={[styles.glassInventoryContainer, dynamicStyles.card]}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[styles.subLabel, dynamicStyles.subtext, { fontWeight: '700' }]}>Total Quantity</Text>
                    <TextInput 
                      style={[styles.smallGlassInput, dynamicStyles.input]}
                      value={totalQuantity}
                      onChangeText={setTotalQuantity}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.subLabel, dynamicStyles.subtext, { fontWeight: '600' }]}>In Hand</Text>
                    <TextInput 
                      style={[styles.smallGlassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? '#FFFFFF' : theme.colors.slate[900], borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                      value={remainingDoses}
                      onChangeText={setRemainingDoses}
                      keyboardType="numeric"
                      placeholder="e.g. 30"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                    />
                  </View>
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, { marginTop: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ShieldAlert size={20} color={theme.colors.warning} />
                <Text style={[styles.label, dynamicStyles.subtext, { fontWeight: '700', marginBottom: 0 }]}>Clinical Reminders (Nagging)</Text>
              </View>
              
              <View style={[styles.glassInventoryContainer, dynamicStyles.card]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.subLabel, dynamicStyles.subtext, { fontWeight: '700' }]}>Interval (Mins)</Text>
                  <TextInput 
                    style={[styles.smallGlassInput, dynamicStyles.input]}
                    value={reminderInterval}
                    onChangeText={setReminderInterval}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.subLabel, dynamicStyles.subtext, { fontWeight: '600' }]}>Total Reminders</Text>
                  <TextInput 
                    style={[styles.smallGlassInput, dynamicStyles.input]}
                    value={reminderCount}
                    onChangeText={setReminderCount}
                    keyboardType="numeric"
                    placeholder="3"
                  />
                </View>
              </View>
              <Text style={[styles.choiceSubtitle, dynamicStyles.subtext, { marginTop: 8, opacity: 0.6 }]}>
                Reminders repeat every {reminderInterval} mins until confirmed.
              </Text>
            </View>

            <HaloButton 
              variant="gradient"
              title={loading ? 'Synchronizing...' : 'Activate Treatment'}
              onPress={() => {
                const intervalVal = parseFloat(interval);
                const intervalInHours = unit === 'mins' ? intervalVal / 60 : intervalVal;
                
                (async () => {
                  if (!petId) {
                    Alert.alert('Protocol Error', 'No active pet profile selected. Please select a patient first.');
                    return;
                  }

                  if (!name || !dosage) {
                    Alert.alert('Incomplete Protocol', 'Please provide a medication name and dosage.');
                    return;
                  }

                  setLoading(true);
                  try {
                    const medData = {
                      pet_id: petId,
                      name,
                      dosage_instructions: dosage,
                      interval_hours: intervalInHours,
                      total_quantity: trackInventory ? parseInt(totalQuantity) : null,
                      remaining_doses: trackInventory ? parseInt(remainingDoses) : null,
                      reminder_interval_mins: parseInt(reminderInterval),
                      reminder_count: parseInt(reminderCount),
                      status: 'active'
                    };

                    let error;
                    let medId = editingMedication?.id;

                    if (editingMedication) {
                      const { error: updateError } = await supabase
                        .from('medications')
                        .update(medData)
                        .eq('id', editingMedication.id);
                      error = updateError;
                    } else {
                      const { data: insertData, error: insertError } = await supabase
                        .from('medications')
                        .insert([{ ...medData, start_date: new Date().toISOString() }])
                        .select();
                      error = insertError;
                      if (insertData && insertData.length > 0) {
                        medId = insertData[0].id;
                      }
                    }

                    if (error) throw error;
                    if (medId) {
                      await cancelMedicationNotifications(medId);
                      await scheduleAdaptiveDose(
                        medId, 
                        name, 
                        intervalInHours, 
                        parseInt(reminderInterval), 
                        parseInt(reminderCount)
                      );
                    }
                    
                    setStep('success');
                    onSuccess();
                  } catch (error: any) {
                    Alert.alert('Sync Error', error.message);
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              isLoading={loading}
              style={{ marginTop: 32, height: 64, borderRadius: 20 }}
            />

            <TouchableOpacity 
              style={{ marginTop: 16, paddingVertical: 12, width: '100%', alignItems: 'center' }} 
              onPress={() => { onClose(); resetForm(); }}
            >
              <Text style={[dynamicStyles.subtext, { fontSize: 16, fontWeight: '500' }]}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'success':
        return (
          <View style={styles.stepContainer}>
            <LinearGradient
              colors={[theme.colors.success, '#10B981']}
              style={[styles.iconCircle, { shadowColor: theme.colors.success, shadowOpacity: 0.3 }]}
            >
              <Check size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.title, dynamicStyles.text]}>Protocol Active</Text>
            <Text style={[styles.subtitle, dynamicStyles.subtext]}>Treatment plan has been successfully synchronized. Adherence reminders are now active.</Text>
            <HaloButton 
              variant="primary"
              title="Return to Hub"
              onPress={() => {
                onClose();
                resetForm();
              }}
              style={{ width: '100%', marginTop: 24, height: 60, borderRadius: 18 }}
            />
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.overlay, dynamicStyles.overlay]}>
        <View style={[styles.modalContent, dynamicStyles.modalContent, { paddingTop: Math.max(insets.top + 20, 40) }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, dynamicStyles.text]}>{editingMedication ? 'Update Protocol' : 'New Schedule'}</Text>
              <Text style={[styles.headerSubtitle, dynamicStyles.subtext]}>{editingMedication ? 'Refining treatment parameters' : 'Establishing clinical care'}</Text>
            </View>
            <TouchableOpacity onPress={() => { onClose(); resetForm(); }} style={[styles.closeBtn, dynamicStyles.closeBtn]}>
              <X size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
            </TouchableOpacity>
          </View>
          {renderStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
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
  stepContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 36,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  glassChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
  },
  choiceIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  choiceTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  choiceSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  glassInput: {
    borderRadius: 18,
    padding: 20,
    fontSize: 17,
    fontWeight: '600',
    borderWidth: 1,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  freqBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.strong,
  },
  freqText: {
    fontSize: 17,
    fontWeight: '800',
    color: 'rgba(128,128,128,0.5)',
  },
  freqTextActive: {
    color: '#FFF',
  },
  glassInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: 20,
    borderRadius: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 14,
    fontWeight: '800',
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(128,128,128,0.6)',
  },
  glassInventoryContainer: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  smallGlassInput: {
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
  }
});

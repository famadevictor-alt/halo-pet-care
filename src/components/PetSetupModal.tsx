import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { X, Camera, Dog, Cat, Weight, Calendar, ChevronRight, RotateCcw, Image as ImageIcon, Heart, Info, Check, Scale, ShieldCheck } from 'lucide-react-native';
import { theme } from '../styles/theme';
import HaloButton from './HaloButton';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PetSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pet?: any; // Added for editing mode
}

type Step = 'form' | 'camera' | 'success';

export default function PetSetupModal({ visible, onClose, onSuccess, pet }: PetSetupModalProps) {
  const { isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('form');
  
  // Initialize state with pet data if editing
  const [name, setName] = useState(pet?.name || '');
  const [species, setSpecies] = useState<'Dog' | 'Cat' | 'Other'>(pet?.species || 'Dog');
  const [breed, setBreed] = useState(pet?.breed || '');
  const [weight, setWeight] = useState(pet?.weight_kg?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(pet?.avatar_url || null);
  const cameraRef = React.useRef<any>(null);

  const dynamicStyles = React.useMemo(() => ({
    overlay: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(15, 23, 42, 0.4)',
    },
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
    label: {
      color: isDark ? 'rgba(255,255,255,0.7)' : theme.colors.slate[600],
    },
    card: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    closeBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    }
  }), [isDark]);

  // Sync state when pet prop changes
  React.useEffect(() => {
    if (pet) {
      setName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed);
      setWeight(pet.weight_kg?.toString() || '');
      setPhoto(pet.avatar_url);
    } else {
      resetForm();
    }
  }, [pet, visible]);

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const result = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        
        const manipulated = await ImageManipulator.manipulateAsync(
          result.uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        setPhoto(manipulated.uri);
        setStep('form');
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to upload a pet picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Incomplete Profile', 'Please enter your pet\'s name to continue.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      setLoading(true);
      
      // Ensure profile exists (satisfies foreign key constraint in schema)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || 'Caregiver',
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile Upsert Error:', profileError);
        // Continue anyway, as it might just be a unique violation or RLS issue
      }

      let avatarUrl = null;
      if (photo && photo.startsWith('file://')) {
        const fileName = `${session.user.id}/${Date.now()}.jpg`;
        
        const response = await fetch(photo);
        const blob = await response.blob();
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pet-avatars')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          console.error('Upload Error:', uploadError);
          // Non-blocking, continue without avatar
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('pet-avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      console.log(pet ? 'Attempting Pet Update' : 'Attempting Pet Insert');
      
      const petData = {
        name,
        species,
        breed,
        weight_kg: parseFloat(weight) || 0,
        avatar_url: avatarUrl || photo,
      };

      let result;
      if (pet?.id) {
        // Update existing pet
        result = await supabase
          .from('pets')
          .update(petData)
          .eq('id', pet.id)
          .select();
      } else {
        // Insert new pet
        result = await supabase
          .from('pets')
          .insert({
            ...petData,
            owner_id: session.user.id,
          })
          .select();
      }

      if (result.error) {
        console.error('Pet Save Error:', result.error);
        throw result.error;
      }
      console.log('Pet Save Result:', result.data);

      setStep('success');
      onSuccess();
    } catch (error: any) {
      console.error('HandleSave Error:', error);
      Alert.alert('Sync Error', error.message || 'An unexpected error occurred during synchronization.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setBreed('');
    setWeight('');
    setPhoto(null);
    setStep('form');
    setLoading(false);
  };

  const renderContent = () => {
    switch (step) {
      case 'form':
        return (
          <>
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, dynamicStyles.text]}>{pet ? 'Update Profile' : 'New Life Profile'}</Text>
                <Text style={[styles.subtitle, dynamicStyles.subtext]}>{pet ? 'Refining patient diagnostics' : 'Establishing diagnostic baseline'}</Text>
              </View>
              <TouchableOpacity onPress={() => { onClose(); resetForm(); }} style={[styles.closeBtn, dynamicStyles.closeBtn]}>
                <X size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.avatarSection}>
                <TouchableOpacity 
                  style={[styles.glassAvatar, photo && { borderColor: theme.colors.primary }]}
                  onPress={() => {
                    Alert.alert(
                      'Patient Diagnostics',
                      'Capture a new clinical photo or upload from diagnostic records.',
                      [
                        {
                          text: 'Gallery / Records',
                          onPress: handlePickImage
                        },
                        {
                          text: 'Direct Camera',
                          onPress: async () => {
                            if (!permission?.granted) {
                              const result = await requestPermission();
                              if (!result.granted) {
                                Alert.alert('Permission Denied', 'Camera access is required for real-time capture.');
                                return;
                              }
                            }
                            setStep('camera');
                          }
                        },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  {photo ? (
                    <View style={styles.photoPreview}>
                      <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
                      <View style={[styles.photoOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                        <Camera size={32} color="#FFF" />
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(74, 142, 178, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                        <Camera size={30} color={theme.colors.primary} />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, dynamicStyles.label]}>PATIENT NAME</Text>
                  <TextInput
                    style={[styles.glassInput, dynamicStyles.input]}
                    placeholder="e.g. Luna"
                    placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, dynamicStyles.label]}>SPECIES</Text>
                  <View style={styles.speciesGrid}>
                    {(['Dog', 'Cat', 'Other'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.speciesBtn,
                          dynamicStyles.card,
                          species === s && styles.speciesBtnActive
                        ]}
                        onPress={() => setSpecies(s)}
                      >
                        <Text style={[
                          styles.speciesText, 
                          dynamicStyles.subtext,
                          species === s && styles.speciesTextActive
                        ]}>{s.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, dynamicStyles.label]}>BREED / TYPE</Text>
                  <TextInput
                    style={[styles.glassInput, dynamicStyles.input]}
                    placeholder="e.g. Golden Retriever"
                    placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"}
                    value={breed}
                    onChangeText={setBreed}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, dynamicStyles.label]}>CURRENT WEIGHT (KG)</Text>
                    <View style={[styles.rowInputWrapper, dynamicStyles.input]}>
                      <Scale size={20} color={theme.colors.primary} />
                      <TextInput
                        style={[styles.rowInput, dynamicStyles.text]}
                        placeholder="0.0"
                        placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"}
                        keyboardType="decimal-pad"
                        value={weight}
                        onChangeText={setWeight}
                      />
                    </View>
                  </View>
                </View>

                <View style={[styles.clinicalNote, !isDark && { backgroundColor: 'rgba(74, 142, 178, 0.05)' }]}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(74, 142, 178, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <ShieldCheck size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.noteText, dynamicStyles.subtext]}>Diagnostic data is encrypted and stored in your secure health registry.</Text>
                </View>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
              <HaloButton
                variant="gradient"
                title={loading ? 'Synchronizing...' : pet ? 'Update Diagnostics' : 'Register Patient'}
                onPress={handleSave}
                isLoading={loading}
                style={{ height: 64, borderRadius: 20 }}
              />
            </View>
          </>
        );

      case 'camera':
        return (
          <View style={styles.cameraContainer}>
            <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cameraHeader}>
              <TouchableOpacity style={styles.cameraBack} onPress={() => setStep('form')}>
                <X size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Portrait Capture</Text>
              <View style={{ width: 44 }} />
            </View>
            <View style={styles.shutterContainer}>
              <TouchableOpacity style={styles.shutterBtn} onPress={handleCapture}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'success':
        return (
          <View style={styles.successContainer}>
            <LinearGradient
              colors={[theme.colors.success, '#10B981']}
              style={styles.successIcon}
            >
              <Check size={48} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.successTitle, dynamicStyles.text]}>{pet ? 'Profile Updated' : 'Profile Synchronized'}</Text>
            <Text style={[styles.successSubtitle, dynamicStyles.subtext]}>
              Patient {name} has been successfully {pet ? 'updated' : 'integrated'} in the care network.
            </Text>
            <HaloButton
              variant="primary"
              title="Enter Health Hub"
              onPress={() => {
                onClose();
                resetForm();
              }}
              style={{ width: '100%', height: 60, borderRadius: 18 }}
            />
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => { onClose(); resetForm(); }}
    >
      <View style={[styles.overlay, dynamicStyles.overlay]}>
        <LinearGradient
          colors={isDark ? ['rgba(15, 23, 42, 0.98)', 'rgba(30, 41, 59, 0.99)'] : ['#FFFFFF', '#F8FAFC']}
          style={[styles.modalContent, dynamicStyles.modalContent]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {renderContent()}
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  glassAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 142, 178, 0.3)',
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '800',
    marginTop: 12,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  glassInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    fontSize: 17,
    color: '#FFF',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  speciesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  speciesBtn: {
    flex: 1,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  speciesBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.soft,
  },
  speciesText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
  },
  speciesTextActive: {
    color: '#FFF',
  },
  row: {
    flexDirection: 'row',
  },
  rowInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 17,
    color: '#FFF',
    fontWeight: '600',
  },
  clinicalNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 142, 178, 0.1)',
    padding: 20,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 142, 178, 0.2)',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    padding: 32,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  cameraBack: {
    padding: 8,
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...theme.shadows.strong,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 48,
    lineHeight: 24,
  }
});

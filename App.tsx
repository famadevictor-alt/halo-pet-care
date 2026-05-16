import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, Image, Alert, RefreshControl } from 'react-native';
import { 
  Activity as ActivityIcon, 
  Pill, 
  Plus, 
  Calendar, 
  Settings, 
  ClipboardList, 
  FileText, 
  ChevronRight, 
  Check, 
  Camera, 
  TrendingUp, 
  Heart, 
  Users, 
  Trash2,
  Pencil,
  X,
  RotateCcw,
  AlertCircle,
  ClipboardCheck,
  Package,
  ShieldCheck
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Logo from './src/components/Logo';
import HaloCard from './src/components/HaloCard';
import HaloButton from './src/components/HaloButton';
import { theme } from './src/styles/theme';
import { supabase } from './src/lib/supabase';
import { registerForPushNotificationsAsync, scheduleAdaptiveDose, cancelMedicationNotifications } from './src/services/notification-service';

// Clinical Components
import PillScanner from './src/components/PillScanner';
import LoginScreen from './src/components/LoginScreen';
import PetSetupModal from './src/components/PetSetupModal';
import AddMedicationModal from './src/components/AddMedicationModal';
import ActivityModal from './src/components/ActivityModal';
import SettingsModal from './src/components/SettingsModal';
import AnalyticsScreen from './src/components/AnalyticsScreen';
import CareTeamModal from './src/components/CareTeamModal';
import EmergencyGoBag from './src/components/EmergencyGoBag';
import BatchLogModal from './src/components/BatchLogModal';
import AppointmentModal from './src/components/AppointmentModal';
import VaccineLedger from './src/components/VaccineLedger';
import ReportsScreen from './src/components/ReportsScreen';
import { calculateAdherence } from './src/services/analytics-service';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function MainApp() {
  const { isDark } = useTheme();
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Data State
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Modal State
  const [showScanner, setShowScanner] = useState(false);
  const [showPetSetup, setShowPetSetup] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCareTeam, setShowCareTeam] = useState(false);
  const [showGoBag, setShowGoBag] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showBatchLog, setShowBatchLog] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showVaccines, setShowVaccines] = useState(false);
  const [editingMed, setEditingMed] = useState<any>(null);
  const [scannedMedData, setScannedMedData] = useState<any>(null);
  const [allMedications, setAllMedications] = useState<any[]>([]);
  const [editingPet, setEditingPet] = useState<any>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (session) {
      fetchInitialData();
      registerForPushNotificationsAsync();
    }
  }, [session]);

  const fetchInitialData = async () => {
    if (!session?.user) return;
    
    try {
      const userId = session.user.id;
      console.log('Fetching data for User ID:', userId);

      // 1. Fetch owned pets
      const { data: ownedPets, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId);

      if (petsError) {
        console.error('Fetch Owned Pets Error:', petsError);
      } else {
        console.log('Fetched Owned Pets:', ownedPets?.length || 0);
      }

      // 2. Fetch shared relations
      const { data: sharedRelations, error: sharedError } = await supabase
        .from('pet_caregivers')
        .select('pet_id')
        .eq('caregiver_email', session.user.email)
        .eq('status', 'active');

      console.log(`Fetched ${ownedPets?.length || 0} owned pets and ${sharedRelations?.length || 0} shared relations`);
      let allPets = [...(ownedPets || [])];

      if (sharedRelations && sharedRelations.length > 0) {
        const sharedIds = sharedRelations.map(r => r.pet_id);
        const { data: sharedPets } = await supabase
          .from('pets')
          .select('*')
          .in('id', sharedIds);
        
        if (sharedPets) {
          allPets = [...allPets, ...sharedPets];
        }
      }

      console.log(`Total pets synced: ${allPets.length}`);
      setPets(allPets);
      
      // Fetch all medications for all pets
      if (allPets.length > 0) {
        const { data: allMeds } = await supabase
          .from('medications')
          .select('*')
          .in('pet_id', allPets.map(p => p.id));
        setAllMedications(allMeds || []);
      }

      if (allPets.length > 0) {
        // Stale ID Guard: Ensure selectedPetId is valid and exists in allPets
        const currentPetExists = allPets.find(p => p.id === selectedPetId);
        if (!selectedPetId || !currentPetExists) {
          setSelectedPetId(allPets[0].id);
        }
      } else {
        setShowPetSetup(true);
      }
    } catch (err) {
      console.error('Data sync error:', err);
    }
  };

  useEffect(() => {
    if (selectedPetId) {
      fetchPetData(selectedPetId);
    }
  }, [selectedPetId]);

  const fetchPetData = async (petId: string) => {
    // Fetch Meds
    const { data: meds } = await supabase
      .from('medications')
      .select('*')
      .eq('pet_id', petId);
    setMedications(meds || []);

    // Fetch Logs
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .limit(50);
    setActivityLogs(logs || []);

    // Fetch Vitals (Weight)
    const { data: weightLogs } = await supabase
      .from('vitals')
      .select('*')
      .eq('pet_id', petId)
      .eq('type', 'weight')
      .order('recorded_at', { ascending: false });
    setVitals(weightLogs || []);

    // Fetch Appointments
    const { data: appts } = await supabase
      .from('appointments')
      .select('*')
      .eq('pet_id', petId)
      .eq('status', 'upcoming')
      .order('appointment_at', { ascending: true });
    setAppointments(appts || []);
  };

  const handleLogWeight = async (weight: number) => {
    if (!selectedPetId) return;
    const { error } = await supabase.from('vitals').insert({
      pet_id: selectedPetId,
      type: 'weight',
      value: weight,
      recorded_at: new Date().toISOString()
    });
    if (!error) fetchPetData(selectedPetId);
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    Alert.alert(
      "Decommission Profile",
      `Are you sure you want to delete ${petName}? This will remove all clinical records, medication protocols, and history. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('pets')
                .delete()
                .eq('id', petId);
              
              if (error) throw error;
              fetchInitialData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteMedication = async (medId: string) => {
    Alert.alert(
      "Remove Protocol",
      "Are you sure you want to delete this medication schedule? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', medId);
              
              if (error) throw error;
              await cancelMedicationNotifications(medId);
              if (selectedPetId) fetchPetData(selectedPetId);
              // Update allMedications
              setAllMedications(prev => prev.filter(m => m.id !== medId));
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleLogBatch = async (logs: any[]) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert(logs);
      
      if (error) throw error;

      // Update local state for all medications (last_taken_at)
      const now = new Date().toISOString();
      const medIds = logs.map(l => l.medication_id);
      
      setAllMedications(prev => prev.map(m => 
        medIds.includes(m.id) ? { ...m, last_taken_at: now } : m
      ));

      // Refresh current pet data if relevant
      if (selectedPetId) fetchPetData(selectedPetId);
      
      Alert.alert('Batch Complete', `${logs.length} clinical records synchronized successfully.`);
    } catch (error: any) {
      console.error('Batch Logging Error:', error);
      throw error;
    }
  };

  const handleRefillMedication = async (medId: string, doses: number) => {
    const med = medications.find(m => m.id === medId);
    if (!med) return;

    const newTotal = (med.remaining_doses || 0) + doses;
    const { error } = await supabase
      .from('medications')
      .update({ remaining_doses: newTotal })
      .eq('id', medId);

    if (!error) {
      Alert.alert('Refill Success', `${med.name} updated with ${doses} new doses.`);
      fetchPetData(selectedPetId!);
    }
  };

  const handleTakeDose = async (med: any) => {
    if (!session?.user) return;
    
    const now = new Date().toISOString();
    
    // 1. Create Log
    const { error: logError } = await supabase.from('activity_logs').insert({
      pet_id: selectedPetId,
      medication_id: med.id,
      type: 'medication',
      status: 'taken',
      taken_at: now,
      notes: `Dose of ${med.name} (${med.dosage_instructions}) taken.`
    });

    // 2. Update Med (Last taken + Inventory)
    const { error: medError } = await supabase.from('medications').update({
      last_taken_at: now,
      remaining_doses: Math.max(0, (med.remaining_doses || 0) - 1)
    }).eq('id', med.id);

    if (logError || medError) {
      console.error('Dose error:', logError || medError);
      Alert.alert('Error Logging Dose', (logError || medError)?.message || 'Database error');
      return;
    }

    // 3. Schedule next dose notification
    if (med.interval_hours > 0) {
      await cancelMedicationNotifications(med.id);
      await scheduleAdaptiveDose(med.id, med.name, med.interval_hours, med.reminder_interval_mins, med.reminder_count);
    }
    
    // 4. Overdue Warning for clinical safety
    const lastTaken = med.last_taken_at ? new Date(med.last_taken_at).getTime() : new Date(med.start_date || med.created_at).getTime();
    const nextDue = lastTaken + (med.interval_hours * 3600000);
    const isLate = Date.now() > nextDue + (45 * 60000); // More than 45 minutes late
    
    if (isLate) {
      Alert.alert(
        'Late Administration Warning', 
        `This dose for ${med.name} is being administered significantly late. Please consult your veterinarian to ensure the treatment protocol remains effective.`,
        [{ text: 'Acknowledged' }]
      );
    } else {
      Alert.alert('Dose Logged', `Successfully recorded ${med.name} for ${pets.find(p => p.id === selectedPetId)?.name}.`);
    }
    
    fetchPetData(selectedPetId!);
  };

  const handleRefuseDose = async (med: any) => {
    if (!session?.user) return;
    
    const now = new Date().toISOString();
    
    // 1. Create Log with 'refused' status
    const { error: logError } = await supabase.from('activity_logs').insert({
      pet_id: selectedPetId,
      medication_id: med.id,
      type: 'medication',
      status: 'refused',
      taken_at: now,
      notes: `Dose of ${med.name} was refused or spit out.`
    });

    if (logError) {
      console.error('Refusal log error:', logError);
      Alert.alert('Error Logging Refusal', logError.message);
      return;
    }

    // 2. Ask for Retry Reminder
    Alert.alert(
      'Dose Refused',
      `${pets.find(p => p.id === selectedPetId)?.name} refused the medication. Would you like a reminder to retry in 30 minutes?`,
      [
        { 
          text: 'No', 
          onPress: () => fetchPetData(selectedPetId!),
          style: 'cancel' 
        },
        { 
          text: 'Remind Me', 
          onPress: async () => {
            const retryAt = new Date(Date.now() + 30 * 60000).toISOString();
            // Update the log with retry_at (using the ID we just created)
            // Note: For simplicity in this demo, we just schedule the notification
            await scheduleAdaptiveDose(med.id, `${med.name} (Retry)`, 0.5); // 0.5 hours = 30 mins
            Alert.alert('Retry Scheduled', 'We will remind you in 30 minutes.');
            fetchPetData(selectedPetId!);
          }
        }
      ]
    );
  };

  if (loading) return null;

  if (!session) {
    return <LoginScreen onLogin={fetchInitialData} />;
  }

  const renderPetSwitcher = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petSwitcher}>
      {pets.map(pet => (
        <TouchableOpacity 
          key={pet.id} 
          onPress={() => setSelectedPetId(pet.id)}
          onLongPress={() => handleDeletePet(pet.id, pet.name)}
          delayLongPress={500}
          style={[styles.petTab, selectedPetId === pet.id && styles.petTabActive]}
        >
          <Image source={{ uri: pet.avatar_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100' }} style={styles.petAvatarSmall} />
          <Text style={[styles.petTabText, selectedPetId === pet.id && styles.petTabActiveText]}>{pet.name}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => setShowPetSetup(true)} style={styles.addPetTab}>
        <Plus size={16} color={theme.colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );

  const getNextMedication = () => {
    if (medications.length === 0) return null;
    
    return [...medications]
      .map(med => {
        const lastTaken = med.last_taken_at ? new Date(med.last_taken_at).getTime() : new Date(med.start_date || med.created_at).getTime();
        const nextTime = lastTaken + (med.interval_hours * 3600000);
        return { ...med, nextTime };
      })
      .sort((a, b) => a.nextTime - b.nextTime)[0];
  };

  const nextMed = getNextMedication();
  const nextTime = nextMed ? nextMed.nextTime : null;
  const timeLeft = nextTime ? nextTime - currentTime : 0;

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return 'DUE NOW';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  };

  const adherence = calculateAdherence(medications, activityLogs);

  const renderDashboard = () => (
    <ScrollView 
      style={styles.content} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      {pets.length === 0 ? (
        <View style={styles.emptyDashboardContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
            style={styles.noPetsGlassCard}
          >
            <View style={styles.noPetsIconWrapper}>
              <Logo size={60} />
            </View>
            <Text style={[styles.noPetsTitle, isDark && { color: '#FFF' }]}>Welcome to Halo</Text>
            <Text style={styles.noPetsSubtitle}>
              Begin your professional health monitoring journey by establishing your first pet's diagnostic profile.
            </Text>
            <HaloButton 
              title="INITIALIZE PROFILE" 
              onPress={() => setShowPetSetup(true)} 
              variant="gradient" 
              style={styles.noPetsButton}
            />
          </LinearGradient>
        </View>
      ) : (
        <>
          {renderPetSwitcher()}
          <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={[styles.greeting, isDark && { color: theme.colors.white }]}>
                Hi, {session?.user?.user_metadata?.full_name || 'Pet Parent'}! 👋
              </Text>
              <Text style={styles.subGreeting}>
                Keep tracking <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>{pets.find(p => p.id === selectedPetId)?.name || pets[0]?.name || 'your pet'}</Text>'s health.
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                setEditingPet(pets.find(p => p.id === selectedPetId));
                setShowPetSetup(true);
              }}
              style={styles.editBtnSmall}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.clinicalHub}>
            <Text style={[styles.sectionTitle, isDark && { color: theme.colors.white }]}>Clinical Hub</Text>
            <View style={styles.hubGrid}>
              <TouchableOpacity style={styles.hubItem} onPress={() => setShowGoBag(true)}>
                <LinearGradient colors={['#FF4B4B', '#FF7676']} style={styles.hubIcon}>
                  <Heart size={20} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.hubLabel, isDark && { color: theme.colors.slate[300] }]}>Go-Bag</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.hubItem} onPress={() => setShowCareTeam(true)}>
                <LinearGradient colors={['#3B82F6', '#60A5FA']} style={styles.hubIcon}>
                  <Users size={20} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.hubLabel, isDark && { color: theme.colors.slate[300] }]}>Team</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubItem} onPress={() => setActiveTab('reports')}>
                <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.hubIcon}>
                  <FileText size={20} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.hubLabel, isDark && { color: theme.colors.slate[300] }]}>Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubItem} onPress={() => setShowBatchLog(true)}>
                <LinearGradient colors={['#10B981', '#34D399']} style={styles.hubIcon}>
                  <ClipboardCheck size={20} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.hubLabel, isDark && { color: theme.colors.slate[300] }]}>Rounds</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubItem} onPress={() => setShowScanner(true)}>
                <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.hubIcon}>
                  <Camera size={20} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.hubLabel, isDark && { color: theme.colors.slate[300] }]}>Scanner</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubItem} onPress={() => setShowAppointments(true)}>
                <LinearGradient colors={['#EC4899', '#F472B6']} style={styles.hubIcon}>
                  <Calendar size={20} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.hubLabel, isDark && { color: theme.colors.slate[300] }]}>Events</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubItem} onPress={() => setShowVaccines(true)}>
                <LinearGradient colors={['#0EA5E9', '#38BDF8']} style={styles.hubIcon}>
                  <ShieldCheck size={20} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.hubLabel, isDark && { color: theme.colors.slate[300] }]}>Vaccines</Text>
              </TouchableOpacity>
            </View>
          </View>

      {medications.length > 0 ? (
        <>
          <View style={styles.bentoContainer}>
            <LinearGradient 
              colors={theme.gradients.brand} 
              style={styles.heroCard}
            >
              <View style={styles.heroTop}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{timeLeft <= 0 ? 'ATTENTION REQUIRED' : 'NEXT DOSE COUNTDOWN'}</Text>
                </View>
                <Heart size={20} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.heroTitle}>{nextMed ? formatCountdown(timeLeft) : 'All Set!'}</Text>
              <Text style={styles.heroSubtitle}>
                {nextMed 
                  ? `${nextMed.name} (${nextMed.dosage_instructions})` 
                  : `No upcoming doses for ${pets.find(p => p.id === selectedPetId)?.name}`}
              </Text>
            </LinearGradient>

            <View style={styles.statsGrid}>
              <TouchableOpacity style={[styles.statCard, isDark && { backgroundColor: theme.colors.dark.card }]}>
                <TrendingUp size={20} color={theme.colors.primary} />
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Latest Weight</Text>
                  <Text style={[styles.statValue, isDark && { color: theme.colors.white }]}>
                    {vitals[0]?.value ? `${vitals[0].value}kg` : '--'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.statCard, isDark && { backgroundColor: theme.colors.dark.card }]}>
                <ActivityIcon size={20} color="#10B981" />
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Adherence</Text>
                  <Text style={[styles.statValue, isDark && { color: theme.colors.white }]}>{adherence.score}%</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {appointments.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDark && { color: theme.colors.white }]}>Upcoming Care</Text>
                <TouchableOpacity onPress={() => setShowAppointments(true)}>
                  <Text style={styles.addMedHeaderText}>View All</Text>
                </TouchableOpacity>
              </View>
              {appointments.slice(0, 1).map(appt => (
                <TouchableOpacity 
                  key={appt.id} 
                  style={[styles.apptCard, isDark && { backgroundColor: theme.colors.dark.card }]}
                  onPress={() => setShowAppointments(true)}
                >
                  <View style={styles.apptIconBox}>
                    <Calendar size={20} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.apptTitle, isDark && { color: theme.colors.white }]}>{appt.title}</Text>
                    <Text style={styles.apptSubtitle}>{new Date(appt.appointment_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.slate[400]} />
                </TouchableOpacity>
              ))}
            </View>
          )}


          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && { color: theme.colors.white }]}>Clinical Schedule</Text>
            <TouchableOpacity onPress={() => setShowAddMedication(true)} style={styles.addMedHeaderBtn}>
              <Plus size={16} color={theme.colors.primary} />
              <Text style={styles.addMedHeaderText}>Add New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.medicationList}>
            {[...medications]
              .map(med => {
                const lastTaken = med.last_taken_at ? new Date(med.last_taken_at).getTime() : new Date(med.start_date || med.created_at).getTime();
                const nextTime = lastTaken + (med.interval_hours * 3600000);
                return { ...med, nextTime };
              })
              .sort((a, b) => a.nextTime - b.nextTime)
              .map(med => (
                <MedicationItem 
                  key={med.id}
                  medication={med}
                  onTake={() => handleTakeDose(med)}
                  onRefuse={() => handleRefuseDose(med)}
                  onEdit={() => { setEditingMed(med); setShowAddMedication(true); }}
                  onDelete={() => handleDeleteMedication(med.id)}
                />
              ))}
          </View>
        </>
      ) : (
        <View style={styles.noMedsContainer}>
          <HaloCard variant="outline" style={styles.noMedsCard}>
            <View style={styles.noMedsIconBox}>
              <ActivityIcon size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.noMedsTitle}>No Medications Yet</Text>
            <Text style={styles.noMedsSubtitle}>Start by adding a medication schedule for {pets.find(p => p.id === selectedPetId)?.name || pets[0]?.name}.</Text>
            <HaloButton 
              variant="primary" 
              title="Add Medication" 
              onPress={() => setShowAddMedication(true)} 
              style={styles.noMedsButton} 
            />
          </HaloCard>
        </View>
      )}
    </>
  )}
  <View style={{ height: 100 }} />
</ScrollView>
);

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: theme.colors.dark.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, isDark && { backgroundColor: theme.colors.dark.bg, borderBottomColor: theme.colors.dark.border }]}>
        <View style={styles.headerLeft}>
          <Logo size={32} />
          <Text style={[styles.headerTitle, isDark && { color: theme.colors.white }]}>Halo Pet Care</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowSettings(true)}>
            <Settings size={24} color={isDark ? theme.colors.slate[300] : theme.colors.slate[400]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowActivity(true)}>
            <ActivityIcon size={24} color={isDark ? theme.colors.slate[300] : theme.colors.slate[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'insights' && (
        <AnalyticsScreen 
          medications={medications || []} 
          logs={activityLogs || []} 
          vitals={vitals || []} 
          isDark={isDark} 
          onLogWeight={handleLogWeight} 
          onRefill={handleRefillMedication} 
        />
      )}
      {activeTab === 'reports' && (
        <ReportsScreen 
          isDark={isDark} 
          pet={pets.find(p => p.id === selectedPetId)} 
          medications={medications || []} 
          vitals={vitals || []} 
          activityLogs={activityLogs || []} 
          onClose={() => setActiveTab('dashboard')} 
        />
      )}

      {/* Clinical Modals */}
      {showScanner && (
        <PillScanner 
          onClose={() => setShowScanner(false)} 
          onResult={(res) => { 
            setShowScanner(false); 
            setScannedMedData(res); 
            setShowAddMedication(true); 
          }} 
        />
      )}

      <SettingsModal 
        visible={showSettings} 
        onClose={() => setShowSettings(false)} 
        pets={pets}
        onDeletePet={handleDeletePet}
        onEditPet={(pet) => { setEditingPet(pet); setShowPetSetup(true); }}
      />

      <PetSetupModal 
        visible={showPetSetup} 
        onClose={() => { setShowPetSetup(false); setEditingPet(null); }} 
        pet={editingPet}
        onSuccess={() => {
          setShowPetSetup(false);
          setEditingPet(null);
          fetchInitialData();
        }} 
      />

      <AddMedicationModal 
        visible={showAddMedication} 
        onClose={() => { setShowAddMedication(false); setEditingMed(null); setScannedMedData(null); }}
        petId={selectedPetId!}
        petName={pets.find(p => p.id === selectedPetId)?.name || 'your pet'}
        initialData={scannedMedData}
        editingMedication={editingMed}
        onSuccess={() => { 
          if (selectedPetId) fetchPetData(selectedPetId);
          setShowAddMedication(false); 
        }}
      />

      <ActivityModal 
        visible={showActivity} 
        onClose={() => setShowActivity(false)} 
        logs={activityLogs || []}
      />

      <CareTeamModal 
        visible={showCareTeam} 
        onClose={() => setShowCareTeam(false)} 
        pet={pets.find(p => p.id === selectedPetId)}
        userEmail={session?.user?.email || ''}
      />

      <EmergencyGoBag 
        visible={showGoBag} 
        onClose={() => setShowGoBag(false)} 
        pet={pets.find(p => p.id === selectedPetId)}
        medications={medications || []}
        logs={activityLogs || []}
        vitals={vitals || []}
      />

      <BatchLogModal
        visible={showBatchLog}
        onClose={() => setShowBatchLog(false)}
        pets={pets || []}
        allMedications={medications || []}
        onLogBatch={handleLogBatch}
      />

      <AppointmentModal
        visible={showAppointments}
        onClose={() => setShowAppointments(false)}
        petId={selectedPetId!}
        petName={pets.find(p => p.id === selectedPetId)?.name || ''}
        onSuccess={() => selectedPetId && fetchPetData(selectedPetId)}
      />

      <VaccineLedger
        visible={showVaccines}
        onClose={() => setShowVaccines(false)}
        petId={selectedPetId!}
      />

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, isDark && { backgroundColor: theme.colors.dark.bg, borderTopColor: theme.colors.dark.border }]}>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.tabItem} 
          onPress={() => setActiveTab('dashboard')}
          hitSlop={{ top: 10, bottom: 20, left: 10, right: 10 }}
        >
          <ClipboardList size={24} color={activeTab === 'dashboard' ? theme.colors.primary : theme.colors.slate[400]} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.tabItem} 
          onPress={() => setActiveTab('insights')}
          hitSlop={{ top: 10, bottom: 20, left: 10, right: 10 }}
        >
          <TrendingUp size={24} color={activeTab === 'insights' ? theme.colors.primary : theme.colors.slate[400]} />
          <Text style={[styles.tabLabel, activeTab === 'insights' && styles.tabLabelActive]}>Insights</Text>
        </TouchableOpacity>
        
        <View style={styles.tabItem} pointerEvents="none" />
        
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.tabItem} 
          onPress={() => setActiveTab('reports')}
          hitSlop={{ top: 10, bottom: 20, left: 10, right: 10 }}
        >
          <FileText size={24} color={activeTab === 'reports' ? theme.colors.primary : theme.colors.slate[400]} />
          <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.tabItem} 
          onPress={() => setShowSettings(true)}
          hitSlop={{ top: 10, bottom: 20, left: 10, right: 10 }}
        >
          <Settings size={24} color={theme.colors.slate[400]} />
          <Text style={styles.tabLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fabOuterContainer} pointerEvents="box-none">
        <View style={styles.fabContainer} pointerEvents="box-none">
          <TouchableOpacity 
            activeOpacity={0.9}
            style={styles.fab} 
            onPress={() => {
              setEditingMed(null);
              setShowAddMedication(true);
            }}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <LinearGradient colors={theme.gradients.brand} style={styles.fabGradient}>
              <Plus size={28} color={theme.colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const MedicationItem = ({ medication, onTake, onRefuse, onEdit, onDelete }) => {
  const { isDark } = useTheme();
  const lastTaken = medication.last_taken_at ? new Date(medication.last_taken_at).getTime() : new Date(medication.start_date || medication.created_at).getTime();
  const nextTime = lastTaken + (medication.interval_hours * 3600000);
  const diff = nextTime - Date.now();
  const isOverdue = diff < 0;
  const isCriticallyLate = diff < -(45 * 60000); // 45+ minutes late
  const timeStr = new Date(nextTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  
  // Refill Predictor Logic
  const dosesPerDay = 24 / medication.interval_hours;
  const daysRemaining = medication.remaining_doses / dosesPerDay;
  const isLowSupply = daysRemaining <= 7 && medication.remaining_doses > 0;
  const isOutOfStock = medication.remaining_doses <= 0;

  return (
    <HaloCard variant={isOverdue ? 'elevated' : 'outline'} style={[
      styles.medCard, 
      isOverdue && styles.medCardOverdue,
      isCriticallyLate && { borderColor: theme.colors.error, borderLeftWidth: 6 }
    ]}>
      <TouchableOpacity onPress={onEdit} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.medIconContainer, isCriticallyLate && { backgroundColor: theme.colors.error + '20' }]}>
          <Pill size={24} color={isCriticallyLate ? theme.colors.error : (isOverdue ? theme.colors.warning : theme.colors.slate[300])} />
        </View>
        <View style={styles.medContent}>
          <Text style={[
            styles.medTime, 
            isOverdue && { color: theme.colors.warning },
            isCriticallyLate && { color: theme.colors.error, fontWeight: '900' }
          ]}>
            {isCriticallyLate ? 'MISSED / CRITICALLY LATE' : (isOverdue ? 'OVERDUE' : `Due at ${timeStr}`)}
          </Text>
          <Text style={[styles.medTitle, isDark && { color: theme.colors.white }]}>{medication.name}</Text>
          <Text style={[styles.medSubtitle, isDark && { color: theme.colors.slate[400] }]}>
            {medication.dosage_instructions}
          </Text>
          
          {/* Refined Inventory Row */}
          {isOutOfStock ? (
            <View style={[styles.inventoryStatusRow, { backgroundColor: '#FEE2E2' }]}>
              <AlertCircle size={12} color="#EF4444" />
              <Text style={[styles.inventoryStatusText, { color: '#EF4444' }]}>OUT OF STOCK • REFILL NOW</Text>
            </View>
          ) : isLowSupply ? (
            <View style={[styles.inventoryStatusRow, { backgroundColor: '#FEF3C7' }]}>
              <RotateCcw size={12} color="#D97706" />
              <Text style={[styles.inventoryStatusText, { color: '#D97706' }]}>LOW STOCK • {Math.ceil(daysRemaining)}d LEFT</Text>
            </View>
          ) : medication.remaining_doses !== null && (
            <View style={[styles.inventoryStatusRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
              <Package size={12} color={isDark ? theme.colors.slate[400] : theme.colors.slate[500]} />
              <Text style={[styles.inventoryStatusText, { color: isDark ? theme.colors.slate[400] : theme.colors.slate[500] }]}>
                {medication.remaining_doses} DOSES REMAINING
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Secondary Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 }}>
          <TouchableOpacity onPress={onEdit} style={[styles.takeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Pencil size={16} color={isDark ? theme.colors.slate[400] : theme.colors.slate[500]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[styles.takeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Trash2 size={16} color={theme.colors.error + '90'} />
          </TouchableOpacity>
        </View>

        {/* Primary Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={onRefuse} style={[styles.takeBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
            <X size={20} color={theme.colors.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onTake} style={styles.takeBtn}>
            <Check size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </HaloCard>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.primary, marginLeft: 12 },
  headerRight: { flexDirection: 'row' },
  iconButton: { marginLeft: 12, padding: 4 },
  content: { flex: 1, padding: 16 },
  petSwitcher: { marginBottom: 20 },
  petTab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    backgroundColor: '#F3F4F6', 
    marginRight: 8 
  },
  petTabActive: { backgroundColor: theme.colors.primary + '15' },
  petAvatarSmall: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  petTabText: { fontSize: 13, fontWeight: '600', color: theme.colors.slate[500] },
  petTabActiveText: { color: theme.colors.primary },
  addPetTab: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F3F4F6', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  greeting: { fontSize: 24, fontWeight: '800', color: theme.colors.slate[800] },
  subGreeting: { fontSize: 14, color: theme.colors.slate[500], marginTop: 2 },
  editBtnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  emergencyRow: { flexDirection: 'row' },
  goBagBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EF4444', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 8 
  },
  goBagBtnText: { marginLeft: 6, color: '#FFF', fontSize: 11, fontWeight: '800' },
  careTeamBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: theme.colors.primary + '30', 
    marginRight: 8 
  },
  careTeamBtnText: { marginLeft: 6, color: theme.colors.primary, fontSize: 11, fontWeight: '800' },
  reportsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: theme.colors.primary + '30' 
  },
  reportsBtnText: { marginLeft: 6, color: theme.colors.primary, fontSize: 11, fontWeight: '800' },
  bentoContainer: { marginBottom: 24 },
  heroCard: { padding: 24, borderRadius: 24, marginBottom: 12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  heroSubtitle: { color: '#FFF', opacity: 0.9, fontSize: 14, fontWeight: '500', marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    ...theme.shadows.soft 
  },
  statContent: { marginLeft: 12 },
  statLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.slate[400], textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '800', color: theme.colors.slate[800], marginTop: 2 },
  clinicalHub: { marginBottom: 24 },
  hubGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 16,
    gap: 12
  },
  hubItem: { 
    alignItems: 'center', 
    width: '22%', 
    marginBottom: 16 
  },
  hubIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8, 
    ...theme.shadows.soft 
  },
  hubLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.slate[600], textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.slate[800] },
  addMedHeaderBtn: { flexDirection: 'row', alignItems: 'center' },
  addMedHeaderText: { color: theme.colors.primary, fontWeight: '700', marginLeft: 4 },
  medicationList: { gap: 12 },
  medCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20 },
  medCardOverdue: { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  medIconContainer: { padding: 10, borderRadius: 12 },
  medContent: { flex: 1, marginLeft: 12 },
  medTime: { fontSize: 10, fontWeight: '700', color: theme.colors.slate[400], textTransform: 'uppercase' },
  medTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.slate[800] },
  medSubtitle: { fontSize: 13, color: theme.colors.slate[500] },
  takeBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: theme.colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...theme.shadows.soft
  },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    paddingBottom: 8, 
    paddingTop: 8, 
    paddingHorizontal: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.slate[400], marginTop: 4 },
  tabLabelActive: { color: theme.colors.primary },
  fabOuterContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fabContainer: {
    alignItems: 'center',
  },
  fab: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: theme.colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    ...theme.shadows.strong,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDashboardContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  noPetsGlassCard: { 
    padding: 40, 
    alignItems: 'center', 
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    ...theme.shadows.strong,
  },
  noPetsIconWrapper: {
    padding: 20,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  noPetsTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: theme.colors.slate[800], 
    marginTop: 0,
    letterSpacing: -0.5
  },
  noPetsSubtitle: { 
    fontSize: 15, 
    color: 'rgba(255,255,255,0.4)', 
    textAlign: 'center', 
    marginBottom: 32, 
    marginTop: 12, 
    lineHeight: 22,
    fontWeight: '600'
  },
  noPetsButton: {
    width: '100%',
    height: 64,
    borderRadius: 22,
  },
  noMedsContainer: {
    paddingVertical: 20,
    width: '100%',
  },
  noMedsCard: { 
    padding: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 32,
  },
  noMedsIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    ...theme.shadows.soft,
  },
  apptIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  apptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.slate[800],
  },
  apptSubtitle: {
    fontSize: 13,
    color: theme.colors.slate[500],
    marginTop: 2,
  },
  inventoryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  inventoryStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noMedsTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.slate[800], marginTop: 0 },
  noMedsSubtitle: { 
    fontSize: 14, 
    color: theme.colors.slate[500], 
    textAlign: 'center', 
    marginBottom: 24, 
    marginTop: 8, 
    lineHeight: 20 
  },
  noMedsButton: { 
    width: 200, 
    height: 56, 
    borderRadius: 28 
  }
});


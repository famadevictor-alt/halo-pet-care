import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Pill, Plus, Calendar, Settings, Activity, ClipboardList } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from './src/components/Logo';
import HaloCard from './src/components/HaloCard';
import HaloButton from './src/components/HaloButton';
import { theme } from './src/styles/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo size={32} />
          <Text style={styles.headerTitle}>Halo Pet Care</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Activity size={24} color={theme.colors.slate[400]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Settings size={24} color={theme.colors.slate[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>Upcoming Window</Text>
          <Text style={styles.heroTitle}>Next dose in 2h 15m</Text>
          <Text style={styles.heroSubtitle}>Anytime between 2:00 PM - 4:00 PM</Text>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Flow</Text>
          <Text style={styles.dateText}>Wed, Oct 25</Text>
        </View>

        <View style={styles.medicationList}>
          <MedicationItem 
            time="8:00 AM - 10:00 AM"
            title="Morning Routine"
            subtitle="Thyroid pill + breakfast"
            status="completed"
          />
          <MedicationItem 
            time="2:00 PM - 4:00 PM"
            title="Afternoon Meds"
            subtitle="Cardisure 5mg"
            status="current"
          />
          <MedicationItem 
            time="8:00 PM - 10:00 PM"
            title="Evening Wind Down"
            subtitle="Joint supplement + Dinner"
            status="upcoming"
          />
        </View>

        <HaloButton 
          variant="gradient"
          title="Identify New Pill"
          onPress={() => console.log('Open AI Camera')}
          style={{ marginTop: 32 }}
          icon={<Pill size={20} color="#FFF" style={{ marginRight: 8 }} />}
        />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('dashboard')}>
          <ClipboardList size={24} color={activeTab === 'dashboard' ? theme.colors.primary : theme.colors.slate[400]} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fab}>
          <Plus size={32} color={theme.colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reports')}>
          <Calendar size={24} color={activeTab === 'reports' ? theme.colors.primary : theme.colors.slate[400]} />
          <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>Vet Reports</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const MedicationItem = ({ time, title, subtitle, status }) => {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';

  return (
    <HaloCard 
      variant={isCurrent ? 'elevated' : 'outline'}
      style={[styles.medCard, isCurrent && styles.medCardActive]}
    >
      <View style={[
        styles.iconContainer, 
        isCompleted ? styles.iconBgSuccess : isCurrent ? styles.iconBgActive : styles.iconBgUpcoming
      ]}>
        <Pill size={24} color={isCompleted ? theme.colors.success : isCurrent ? theme.colors.primary : theme.colors.slate[300]} />
      </View>
      <View style={styles.medContent}>
        <Text style={styles.medTime}>{time}</Text>
        <Text style={styles.medTitle}>{title}</Text>
        <Text style={styles.medSubtitle}>{subtitle}</Text>
      </View>
      {isCompleted && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Done</Text>
        </View>
      )}
    </HaloCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.slate[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.slate[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  heroCard: {
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.strong,
  },
  heroLabel: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.slate[800],
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.slate[400],
  },
  medicationList: {
    gap: 16,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  medCardActive: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  iconContainer: {
    padding: 12,
    borderRadius: theme.borderRadius.lg,
  },
  iconBgSuccess: { backgroundColor: '#ECFDF5' },
  iconBgActive: { backgroundColor: '#F0F9FF' },
  iconBgUpcoming: { backgroundColor: theme.colors.slate[50] },
  medContent: {
    flex: 1,
    marginLeft: 16,
  },
  medTime: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  medTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.slate[700],
  },
  medSubtitle: {
    fontSize: 14,
    color: theme.colors.slate[500],
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  badgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.md,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: theme.colors.slate[100],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.slate[400],
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
  fab: {
    backgroundColor: theme.colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -48,
    ...theme.shadows.strong,
  }
});

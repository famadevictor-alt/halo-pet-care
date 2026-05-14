import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Pill, Plus, Calendar, Settings, Activity, ClipboardList } from 'lucide-react-native';
import Logo from './src/components/Logo';

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
            <Activity size={24} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Settings size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Upcoming Window</Text>
          <Text style={styles.heroTitle}>Next dose in 2h 15m</Text>
          <Text style={styles.heroSubtitle}>Anytime between 2:00 PM - 4:00 PM</Text>
        </View>

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
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('dashboard')}>
          <ClipboardList size={24} color={activeTab === 'dashboard' ? '#4A8EB2' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fab}>
          <Plus size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reports')}>
          <Calendar size={24} color={activeTab === 'reports' ? '#4A8EB2' : '#94A3B8'} />
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
    <View style={[styles.medCard, isCurrent && styles.medCardActive]}>
      <View style={[styles.iconContainer, isCompleted ? styles.iconBgSuccess : isCurrent ? styles.iconBgActive : styles.iconBgUpcoming]}>
        <Pill size={24} color={isCompleted ? '#10B981' : isCurrent ? '#4A8EB2' : '#CBD5E1'} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A8EB2',
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
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  heroCard: {
    backgroundColor: '#4A8EB2',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#4A8EB2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  heroLabel: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  dateText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  medicationList: {
    gap: 16,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  medCardActive: {
    borderColor: '#4A8EB2',
    borderLeftWidth: 4,
    borderLeftColor: '#4A8EB2',
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
  },
  iconBgSuccess: { backgroundColor: '#ECFDF5' },
  iconBgActive: { backgroundColor: '#F0F9FF' },
  iconBgUpcoming: { backgroundColor: '#F8FAFC' },
  medContent: {
    flex: 1,
    marginLeft: 16,
  },
  medTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  medTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  medSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: '#4A8EB2',
  },
  fab: {
    backgroundColor: '#4A8EB2',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -48,
    shadowColor: '#4A8EB2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  }
});

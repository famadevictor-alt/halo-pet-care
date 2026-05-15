import React, { useState, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Dimensions,
  Platform
} from 'react-native';
import { 
  FileText, 
  Share2, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  Download, 
  Info,
  History,
  ClipboardCheck,
  Stethoscope,
  ArrowRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import HaloCard from './HaloCard';
import HaloButton from './HaloButton';
import { generateClinicalReport, uploadVetReport, fetchVetReports } from '../services/report-service';
import { calculateClinicalCareScore } from '../services/analytics-service';

const { width, height } = Dimensions.get('window');

interface ReportsScreenProps {
  visible?: boolean;
  onClose?: () => void;
  isDark: boolean;
  pet?: any;
  medications: any[];
  vitals: any[];
  activityLogs: any[];
}

const ReportsScreen: React.FC<ReportsScreenProps> = ({ 
  visible, 
  onClose, 
  isDark, 
  pet, 
  medications, 
  vitals, 
  activityLogs 
}) => {
  const [generating, setGenerating] = useState(false);
  const [externalReports, setExternalReports] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (pet?.id) {
      loadExternalReports();
    }
  }, [pet?.id]);

  const loadExternalReports = async () => {
    setFetching(true);
    try {
      const reports = await fetchVetReports(pet.id);
      setExternalReports(reports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleUploadReport = async () => {
    if (!pet) {
      Alert.alert('Selection Required', 'Please select a pet first.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setUploading(true);
        const file = result.assets[0];
        await uploadVetReport(pet.id, file, file.name);
        Alert.alert('Success', 'Vet report uploaded successfully.');
        loadExternalReports();
      }
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!pet) {
      Alert.alert('Selection Required', 'Please select a pet on the dashboard before generating a report.');
      return;
    }
    
    setGenerating(true);
    try {
      const careScore = calculateClinicalCareScore(medications, activityLogs);
      
      await generateClinicalReport({
        petName: pet?.name || 'Pet',
        careScore,
        medications,
        vitals,
        activityLogs,
        externalReports
      });
      
      Alert.alert('Report Generated', 'Your clinical PDF has been prepared and is ready for sharing.');
    } catch (error: any) {
      Alert.alert('Report Error', 'Could not generate report: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? [theme.colors.dark.bg, theme.colors.slate[900]] : ['#FFFFFF', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, isDark && { color: theme.colors.white }]}>Clinical Reports</Text>
          <Text style={styles.headerSubtitle}>Professional documentation for {pet?.name || 'your pet'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
          <Text style={[styles.badgeText, { color: '#10B981' }]}>READY</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary Report Card */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={[theme.colors.primary, '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <ClipboardCheck size={32} color="#FFF" />
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Comprehensive Health PDF</Text>
                <Text style={styles.heroDesc}>
                  Synthesize adherence, vitals, and logs into a clean medical document for your vet.
                </Text>
              </View>
            </View>

            <View style={styles.featureGrid}>
              <View style={styles.featureItem}>
                <CheckCircle2 size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.featureText}>Adherence Scoring</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.featureText}>30-Day Med Logs</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.featureText}>Weight Trends</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.featureText}>Forecasts</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.generateButton, generating && styles.generateButtonDisabled]}
              onPress={handleGenerateReport}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <>
                  <Text style={styles.generateButtonText}>Generate Export</Text>
                  <Download size={20} color={theme.colors.primary} />
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Info Section */}
        <View style={[styles.glassCard, isDark ? styles.darkGlassCard : styles.lightGlassCard]}>
          <View style={styles.cardHeader}>
            <Stethoscope size={20} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, isDark && { color: theme.colors.white }]}>Vet-Ready Standards</Text>
          </View>
          <Text style={[styles.cardDesc, isDark && { color: theme.colors.slate[400] }]}>
            Our reports follow clinical documentation standards to ensure your veterinarian can quickly assess medication adherence and health trends.
          </Text>
          <View style={styles.infoRow}>
            <Info size={16} color={theme.colors.primary} />
            <Text style={[styles.infoText, isDark && { color: theme.colors.slate[400] }]}>
              Reports are encrypted and generated locally for privacy.
            </Text>
          </View>
        </View>

        {/* External Vet Reports Section */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <FileText size={20} color={isDark ? theme.colors.slate[400] : theme.colors.slate[600]} />
              <Text style={[styles.sectionTitle, isDark && { color: theme.colors.white }]}>Veterinary Records</Text>
            </View>
            <TouchableOpacity 
              style={styles.uploadSmallButton}
              onPress={handleUploadReport}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.uploadSmallButtonText}>Upload PDF</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {fetching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : externalReports.length > 0 ? (
            <View style={styles.reportList}>
              {externalReports.map((report) => (
                <TouchableOpacity 
                  key={report.id}
                  style={[styles.reportItem, isDark ? styles.darkReportItem : styles.lightReportItem]}
                  onPress={() => Linking.openURL(report.file_url)}
                >
                  <View style={styles.reportIcon}>
                    <FileText size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={[styles.reportTitleText, isDark && { color: '#FFF' }]} numberOfLines={1}>
                      {report.title}
                    </Text>
                    <Text style={[styles.reportDate, isDark && { color: theme.colors.slate[500] }]}>
                      {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </Text>
                    {report.ai_summary && (
                      <Text style={[styles.reportSummary, isDark && { color: theme.colors.slate[400] }]} numberOfLines={2}>
                        {report.ai_summary.replace(/[#*]/g, '')}
                      </Text>
                    )}
                  </View>
                  <ArrowRight size={18} color={theme.colors.slate[400]} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Calendar size={48} color={isDark ? theme.colors.slate[800] : theme.colors.slate[200]} />
              <Text style={[styles.emptyText, isDark && { color: theme.colors.slate[600] }]}>
                No external reports uploaded yet
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.slate[900],
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.slate[500],
    marginTop: 4,
  },
  badge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  heroWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  generateButton: {
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  generateButtonDisabled: {
    opacity: 0.8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  glassCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  lightGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  darkGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary + '10',
    padding: 10,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  historySection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyHistory: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadSmallButton: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  uploadSmallButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  reportList: {
    gap: 12,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  lightReportItem: {
    backgroundColor: '#FFF',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  darkReportItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitleText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 12,
    color: theme.colors.slate[500],
  },
  reportSummary: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});

export default ReportsScreen;


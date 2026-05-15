import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Rect, G, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { TrendingUp, Award, Calendar, AlertCircle, ChevronRight, Activity, Plus, PackageOpen } from 'lucide-react-native';
import { calculateAdherence, getWeeklyActivity, calculateInventoryForecast } from '../services/analytics-service';

const { width } = Dimensions.get('window');

interface AnalyticsScreenProps {
  medications: any[];
  logs: any[];
  vitals: any[];
  isDark: boolean;
  onLogWeight: () => void;
  onRefill?: (medicationId: string, amount: number) => void;
}

export default function AnalyticsScreen({ medications, logs, vitals, isDark, onLogWeight, onRefill }: AnalyticsScreenProps) {
  const stats = calculateAdherence(medications, logs);
  const weeklyData = getWeeklyActivity(logs);
  const weightData = vitals.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  const forecasts = calculateInventoryForecast(medications);
  
  const circleSize = 160;
  const strokeWidth = 15;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (stats.score / 100) * circumference;

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? theme.colors.dark.bg : theme.colors.slate[50],
    },
    text: {
      color: isDark ? '#FFFFFF' : theme.colors.slate[900],
    },
    subtitle: {
      color: isDark ? 'rgba(255,255,255,0.6)' : theme.colors.slate[500],
    },
    glassCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      shadowColor: isDark ? '#000' : theme.colors.slate[200],
    },
    scoreLabel: {
      color: isDark ? 'rgba(255,255,255,0.4)' : theme.colors.slate[400],
    },
    statLabel: {
      color: isDark ? 'rgba(255,255,255,0.5)' : theme.colors.slate[500],
    },
    statDivider: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    barBg: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    insightDesc: {
      color: isDark ? 'rgba(255,255,255,0.6)' : theme.colors.slate[600],
    },
    emptyChartText: {
      color: isDark ? 'rgba(255,255,255,0.4)' : theme.colors.slate[400],
    }
  };

  return (
    <LinearGradient 
      colors={isDark ? [theme.colors.dark.bg, theme.colors.slate[900]] : ['#FFFFFF', '#F8FAFC']} 
      style={styles.container}
    >
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, dynamicStyles.text]}>Health Insights</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Clinical adherence & patterns</Text>
        </View>

        {/* Care Score Ring */}
        <View style={[styles.glassCard, dynamicStyles.glassCard]}>
          <View style={styles.scoreContainer}>
            <Svg width={circleSize} height={circleSize}>
              <Defs>
                <SvgGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={theme.colors.primary} />
                  <Stop offset="100%" stopColor="#8B5CF6" />
                </SvgGradient>
              </Defs>
              <G rotation="-90" origin={`${circleSize/2}, ${circleSize/2}`}>
                <Circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  stroke="url(#scoreGrad)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  fill="none"
                />
              </G>
            </Svg>
            <View style={styles.scoreTextContainer}>
              <Text style={[styles.scoreNumber, dynamicStyles.text]}>{stats.score}%</Text>
              <Text style={[styles.scoreLabel, dynamicStyles.scoreLabel]}>ADHERENCE</Text>
            </View>
          </View>

          <View style={[styles.statsGrid, { borderTopColor: dynamicStyles.statDivider.backgroundColor }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, dynamicStyles.text]}>{stats.onTime}</Text>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>On-Time</Text>
            </View>
            <View style={[styles.statDivider, dynamicStyles.statDivider]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.late}</Text>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Late</Text>
            </View>
            <View style={[styles.statDivider, dynamicStyles.statDivider]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.error }]}>{stats.missed}</Text>
              <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Missed</Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity Chart */}
        <Text style={[styles.sectionTitle, dynamicStyles.text, { marginTop: 24 }]}>Weekly Activity</Text>
        <View style={[styles.glassCard, dynamicStyles.glassCard, { marginTop: 16, paddingBottom: 24 }]}>
          <View style={styles.chartContainer}>
            {weeklyData.map((item, index) => {
              const maxCount = Math.max(...weeklyData.map(d => d.count), 1);
              const barHeight = (item.count / maxCount) * 100;
              return (
                <View key={index} style={styles.barWrapper}>
                  <LinearGradient 
                    colors={item.count > 0 ? [theme.colors.primary, '#8B5CF6'] : [dynamicStyles.barBg.backgroundColor, dynamicStyles.barBg.backgroundColor]} 
                    style={[styles.bar, { height: Math.max(barHeight, 8) }]}
                  />
                  <Text style={[styles.barLabel, dynamicStyles.scoreLabel]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Weight Trends */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>Weight Trend</Text>
          <TouchableOpacity style={styles.logBtn} onPress={onLogWeight}>
            <Plus size={14} color={theme.colors.primary} />
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.glassCard, dynamicStyles.glassCard, { marginTop: 8 }]}>
          {weightData.length < 2 ? (
            <View style={styles.emptyChart}>
              <Activity size={32} color={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
              <Text style={[styles.emptyChartText, dynamicStyles.emptyChartText]}>Log measurements to see trends</Text>
            </View>
          ) : (
            <View style={styles.weightChartContainer}>
              <Svg width={width - 88} height={120}>
                <Defs>
                  <SvgGradient id="weightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={theme.colors.primary} />
                    <Stop offset="100%" stopColor="#10B981" />
                  </SvgGradient>
                </Defs>
                {(() => {
                  const chartWidth = width - 88;
                  const chartHeight = 100;
                  const minWeight = Math.min(...weightData.map(v => Number(v.value))) * 0.98;
                  const maxWeight = Math.max(...weightData.map(v => Number(v.value))) * 1.02;
                  const range = maxWeight - minWeight || 1;
                  
                  const points = weightData.map((v, i) => {
                    const x = (i / (weightData.length - 1)) * chartWidth;
                    const y = chartHeight - ((Number(v.value) - minWeight) / range) * chartHeight;
                    return { x, y };
                  });
                  
                  let d = `M ${points[0].x} ${points[0].y}`;
                  points.slice(1).forEach(p => {
                    d += ` L ${p.x} ${p.y}`;
                  });
                  
                  return (
                    <>
                      <Path
                        d={d}
                        fill="none"
                        stroke="url(#weightGrad)"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {points.map((p, i) => (
                        <Circle key={i} cx={p.x} cy={p.y} r={5} fill={isDark ? "#FFFFFF" : theme.colors.white} stroke={theme.colors.primary} strokeWidth={2} />
                      ))}
                    </>
                  );
                })()}
              </Svg>
              <View style={styles.chartLabels}>
                <Text style={[styles.chartLabel, dynamicStyles.emptyChartText]}>Start</Text>
                <Text style={[styles.chartLabel, dynamicStyles.emptyChartText]}>Latest</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, dynamicStyles.text, { marginTop: 32 }]}>Smart Insights</Text>
        
        {/* Dynamic Adherence Insight */}
        <TouchableOpacity style={[styles.glassCard, dynamicStyles.glassCard, { marginTop: 16, flexDirection: 'row', alignItems: 'center' }]}>
          <View style={[styles.insightIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Award size={22} color={theme.colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightTitle, dynamicStyles.text]}>Consistency Score</Text>
            <Text style={stats.score > 90 ? styles.insightDescPositive : [styles.insightDesc, dynamicStyles.insightDesc]}>
              {stats.score > 90 ? "Excellent routine! Maintaining this level significantly improves treatment outcomes." : "Try to align doses closer to their scheduled times for better results."}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Inventory Forecast Insights */}
        {forecasts.map((f, i) => (
          <TouchableOpacity key={i} style={[styles.glassCard, dynamicStyles.glassCard, { marginTop: 12, flexDirection: 'row', alignItems: 'center' }]}>
            <View style={[styles.insightIcon, { backgroundColor: f.isCritical ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <PackageOpen size={22} color={f.isCritical ? theme.colors.error : theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.insightHeaderRow}>
                <Text style={[styles.insightTitle, dynamicStyles.text]}>
                  {f.medicationName}
                </Text>
                {f.isCritical && (
                  <View style={styles.criticalBadge}>
                    <Text style={styles.criticalBadgeText}>LOW STOCK</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.insightDesc, dynamicStyles.insightDesc]}>
                {f.daysRemaining <= 0 
                  ? "Out of stock. Refill immediately." 
                  : `Est. run-out in ${f.daysRemaining} days.`}
              </Text>
              
              <View style={styles.insightActionRow}>
                <TouchableOpacity 
                  style={[styles.refillBtn, f.isCritical && { backgroundColor: theme.colors.error }]}
                  onPress={() => onRefill?.(f.medicationId, 30)}
                >
                  <Text style={[styles.refillBtnText, { color: '#FFFFFF' }]}>Refill Now</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  glassCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  logBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  weightChartContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyChart: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  barWrapper: {
    alignItems: 'center',
    width: 36,
  },
  bar: {
    width: 14,
    borderRadius: 7,
    marginBottom: 10,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criticalBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  criticalBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.error,
  },
  insightDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  insightDescPositive: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  insightActionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  refillBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  refillBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});


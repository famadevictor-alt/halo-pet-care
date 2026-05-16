import { differenceInMinutes, startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface AdherenceData {
  score: number;
  totalDoses: number;
  onTime: number;
  late: number;
  missed: number;
  trend: number;
}

export interface VitalPoint {
  date: string;
  value: number;
  label: string;
}

export interface InventoryForecast {
  medicationId: string;
  medicationName: string;
  daysRemaining: number;
  runOutDate: string;
  isCritical: boolean;
}

export const calculateAdherence = (medications: any[], logs: any[]): AdherenceData => {
  if (!medications || medications.length === 0) return { score: 0, totalDoses: 0, onTime: 0, late: 0, missed: 0, trend: 0 };

  const totalDoses = logs?.length || 0;
  if (totalDoses === 0) return { score: 0, totalDoses: 0, onTime: 0, late: 0, missed: 0, trend: 0 };

  let onTime = 0;
  let late = 0;
  let missed = 0;

  logs.forEach(log => {
    if (!log.scheduled_at) {
      onTime++;
      return;
    }

    const diff = Math.abs(differenceInMinutes(new Date(log.taken_at), new Date(log.scheduled_at)));
    
    // Stricter Clinical Thresholds:
    // 0-15m: On Time (Requirement: Precision care)
    // 15-45m: Late (Requirement: Reduced adherence window)
    // 45m+: Missed / Critically Late
    if (diff <= 15) {
      onTime++;
    } else if (diff <= 45) {
      late++;
    } else {
      missed++;
    }
  });

  // Score considers only On-Time as perfect, Late as 50%, Missed as 0%
  const score = Math.round(((onTime + (late * 0.5)) / totalDoses) * 100);

  return {
    score,
    totalDoses,
    onTime,
    late,
    missed,
    trend: 5
  };
};

export const getWeeklyActivity = (logs: any[]) => {
  if (!logs) return [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activity = days.map(day => ({ day, count: 0 }));

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), i);
    return format(d, 'EEE');
  }).reverse();

  const counts: Record<string, number> = {};
  logs.forEach(log => {
    const day = format(new Date(log.taken_at), 'EEE');
    counts[day] = (counts[day] || 0) + 1;
  });

  return last7Days.map(day => ({
    day,
    count: counts[day] || 0
  }));
};

export const formatWeightData = (vitals: any[]): VitalPoint[] => {
  if (!vitals || vitals.length === 0) return [];
  
  return vitals
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map(v => ({
      date: v.recorded_at,
      value: Number(v.weight),
      label: format(new Date(v.recorded_at), 'MMM d')
    }));
};

export const calculateInventoryForecast = (medications: any[]): InventoryForecast[] => {
  if (!medications) return [];
  return medications
    .filter(m => m.remaining_doses !== null && m.remaining_doses !== undefined)
    .map(m => {
      // Calculate daily dosage frequency
      // Simplification: if 'Twice daily' -> 2, if 'Daily' -> 1, if 'Weekly' -> 1/7
      let dosesPerDay = 1;
      const freq = m.frequency?.toLowerCase() || '';
      
      if (freq.includes('twice')) dosesPerDay = 2;
      else if (freq.includes('thrice')) dosesPerDay = 3;
      else if (freq.includes('weekly')) dosesPerDay = 1/7;
      else if (freq.includes('monthly')) dosesPerDay = 1/30;
      
      const daysRemaining = Math.floor(m.remaining_doses / dosesPerDay);
      const runOutDate = new Date();
      runOutDate.setDate(runOutDate.getDate() + daysRemaining);
      
      return {
        medicationId: m.id,
        medicationName: m.name,
        daysRemaining,
        runOutDate: format(runOutDate, 'MMM d'),
        isCritical: daysRemaining <= 5
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
};

export const calculateClinicalCareScore = (medications: any[], logs: any[]): number => {
  if (!medications || medications.length === 0) return 100;
  const adherence = calculateAdherence(medications, logs);
  return adherence.score;
};

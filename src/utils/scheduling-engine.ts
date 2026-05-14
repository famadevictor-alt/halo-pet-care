import { addHours, format, isAfter, parseISO } from 'date-fns';

export interface DoseSchedule {
  id: string;
  medicationName: string;
  intervalHours: number;
  lastDoseTime?: string;
  nextDoseTime: string;
  windowMinutes: number; // e.g. 60 min window
}

export const calculateNextDose = (lastDoseTime: string, intervalHours: number): string => {
  return addHours(parseISO(lastDoseTime), intervalHours).toISOString();
};

export const getDoseStatus = (nextDoseTime: string, windowMinutes: number) => {
  const now = new Date();
  const next = parseISO(nextDoseTime);
  const windowStart = new Date(next.getTime() - (windowMinutes / 2) * 60000);
  const windowEnd = new Date(next.getTime() + (windowMinutes / 2) * 60000);

  if (isAfter(now, windowEnd)) return 'overdue';
  if (isAfter(now, windowStart)) return 'due';
  return 'upcoming';
};

export const formatInterval = (hours: number): string => {
  if (hours === 24) return 'Once daily';
  if (hours === 12) return 'Twice daily';
  if (hours === 8) return 'Every 8 hours';
  return `Every ${hours} hours`;
};

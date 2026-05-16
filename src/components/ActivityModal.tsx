import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X, CheckCircle2, Clock } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  logs: any[];
}

export default function ActivityModal({ visible, onClose, logs = [] }: ActivityModalProps) {
  const { isDark } = useTheme();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const dynamicStyles = {
    modalContainer: {
      backgroundColor: isDark ? theme.colors.dark.bg : theme.colors.white,
    },
    header: {
      borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.slate[100],
    },
    text: {
      color: isDark ? '#FFFFFF' : theme.colors.slate[800],
    },
    logItem: {
      borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : theme.colors.slate[50],
    },
    logIcon: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
    },
    subtext: {
      color: isDark ? 'rgba(255,255,255,0.5)' : theme.colors.slate[400],
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, dynamicStyles.modalContainer]}>
          <View style={[styles.header, dynamicStyles.header]}>
            <Text style={[styles.title, dynamicStyles.text]}>Recent Activity</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDark ? theme.colors.white : theme.colors.slate[800]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {logs.length > 0 ? (
              logs.map((log) => (
                <View key={log.id} style={[styles.logItem, dynamicStyles.logItem]}>
                  <View style={[
                    styles.logIcon, 
                    log.status === 'refused' 
                      ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }
                      : dynamicStyles.logIcon
                  ]}>
                    {log.status === 'refused' ? (
                      <X size={24} color={theme.colors.error} />
                    ) : (
                      <CheckCircle2 size={24} color={theme.colors.success} />
                    )}
                  </View>
                  <View style={styles.logContent}>
                    <Text style={[styles.logTitle, dynamicStyles.text]}>
                      {log.medications?.name || 'Medication'} {log.status === 'refused' ? 'refused' : 'administered'}
                    </Text>
                    <View style={styles.logMeta}>
                      <Clock size={14} color={isDark ? "rgba(255,255,255,0.4)" : theme.colors.slate[400]} />
                      <Text style={[styles.logTime, dynamicStyles.subtext]}>
                        {log.status === 'refused' ? 'Attempted' : 'Recorded'} {formatDate(log.taken_at)} at {formatTime(log.taken_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Clock size={48} color={isDark ? 'rgba(255,255,255,0.1)' : theme.colors.slate[200]} />
                <Text style={[styles.emptyText, dynamicStyles.subtext]}>No recent activity found.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.slate[100],
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.slate[800],
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.slate[50],
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.slate[800],
    marginBottom: 4,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logTime: {
    fontSize: 14,
    color: theme.colors.slate[400],
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.slate[400],
    fontWeight: '500',
  }
});

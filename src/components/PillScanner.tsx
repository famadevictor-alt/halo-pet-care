import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Zap, Camera, Check, Edit3 } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { identifyPill } from '../services/gemini-vision';
import { labelPill } from '../services/learning-service';
import HaloButton from './HaloButton';
import { TextInput } from 'react-native';

interface PillScannerProps {
  onClose: () => void;
  onResult: (result: any) => void;
}

export default function PillScanner({ onClose, onResult }: PillScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualName, setManualName] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Grant Camera Permission"
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current && !isScanning) {
      setIsScanning(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5, // Reduced quality for faster API transfer
        });

        // Compress and resize image further for Gemini efficiency
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (manipulated.base64) {
          setCurrentPhoto(manipulated.base64);
          const result = await identifyPill(manipulated.base64);
          setAiResult(result);
          if (result.pillName === 'Unknown') {
            setShowManualEntry(true);
          } else {
            // Give user a moment to see the AI result, then show option to correct
            setTimeout(() => setShowManualEntry(true), 2000);
          }
        }
      } catch (error) {
        console.error('Capture Error:', error);
        alert('Failed to capture image');
      } finally {
        setIsScanning(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close Scanner"
            >
              <X color="#FFF" size={28} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pill ID</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerFrameContainer}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {isScanning && (
                <View style={styles.scanningIndicator}>
                  <ActivityIndicator color={theme.colors.secondary} size="large" />
                  <Text style={styles.scanningText}>Analyzing with AI...</Text>
                </View>
              )}
            </View>
            <Text style={styles.guideText}>Center the pill in the frame</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={handleCapture}
              disabled={isScanning}
              accessibilityRole="button"
              accessibilityLabel="Capture Pill Photo"
            >
              <View style={styles.captureButtonInner}>
                <Camera color={theme.colors.primary} size={32} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Manual Entry / AI Correction Modal Overlay */}
      {showManualEntry && (
        <View style={styles.manualEntryOverlay}>
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>
              {aiResult?.pillName !== 'Unknown' ? 'AI Identified this as:' : 'Pill Not Recognized'}
            </Text>
            
            {aiResult?.pillName !== 'Unknown' && (
              <Text style={styles.aiPrediction}>{aiResult.pillName} ({aiResult.identifiedStrength})</Text>
            )}

            <Text style={styles.manualLabel}>Does this look right? Or enter a custom name:</Text>
            
            <TextInput
              style={styles.input}
              placeholder="e.g. Cardisure 5mg"
              value={manualName}
              onChangeText={setManualName}
              placeholderTextColor={theme.colors.slate[400]}
            />

            <View style={styles.manualActions}>
              <HaloButton 
                variant="outline"
                title="Use AI Name"
                onPress={() => onResult(aiResult)}
                style={{ flex: 1, marginRight: 8 }}
                disabled={aiResult?.pillName === 'Unknown'}
              />
              <HaloButton 
                variant="gradient"
                title="Save Label"
                onPress={async () => {
                  if (currentPhoto && manualName) {
                    // Logic to "Teach" the AI by saving the labeled photo
                    await labelPill('current-user-id', currentPhoto, manualName, '', aiResult?.pillName);
                    onResult({ pillName: manualName, identifiedStrength: '', confidence: 1 });
                  }
                }}
                style={{ flex: 1 }}
                disabled={!manualName}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  manualEntryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  manualCard: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    ...theme.shadows.strong,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[500],
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  aiPrediction: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 24,
  },
  manualLabel: {
    fontSize: 16,
    color: theme.colors.slate[600],
    marginBottom: 16,
  },
  input: {
    backgroundColor: theme.colors.slate[50],
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: theme.colors.slate[800],
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.slate[200],
  },
  manualActions: {
    flexDirection: 'row',
  },

  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    paddingVertical: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  scannerFrameContainer: {
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 0,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.colors.secondary,
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  guideText: {
    color: '#FFF',
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
    color: theme.colors.slate[600],
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  scanningIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 16,
  },
  scanningText: {
    color: '#FFF',
    marginTop: 12,
    fontWeight: '600',
  }
});

import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Zap, Camera } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { identifyPill } from '../services/gemini-vision';

interface PillScannerProps {
  onClose: () => void;
  onResult: (result: any) => void;
}

export default function PillScanner({ onClose, onResult }: PillScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
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
          const result = await identifyPill(manipulated.base64);
          onResult(result);
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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
            >
              <View style={styles.captureButtonInner}>
                <Camera color={theme.colors.primary} size={32} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
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

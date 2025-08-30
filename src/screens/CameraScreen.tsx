import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import CameraOverlay from '../components/CameraOverlay';

interface CameraScreenProps {
  onImageCaptured: (imageUri: string) => void;
  onBack: () => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onImageCaptured, onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const optimizeImage = async (imageUri: string) => {
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'カメラアクセス許可',
        'お部屋を撮影するためにカメラへのアクセスが必要です',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    setShowOverlay(true);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    setShowOverlay(false);
    if (!result.canceled && result.assets[0]) {
      setIsProcessing(true);
      const optimizedUri = await optimizeImage(result.assets[0].uri);
      setSelectedImage(optimizedUri);
      setIsProcessing(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'ライブラリアクセス許可',
        '写真を選択するためにフォトライブラリへのアクセスが必要です',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setIsProcessing(true);
      const optimizedUri = await optimizeImage(result.assets[0].uri);
      setSelectedImage(optimizedUri);
      setIsProcessing(false);
    }
  };

  const handleAnalyze = () => {
    if (selectedImage) {
      onImageCaptured(selectedImage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textOnBase} />
        </TouchableOpacity>
        <Text style={styles.title}>お部屋を撮影</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {showOverlay && <CameraOverlay />}
        
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingBox}>
              <Text style={styles.processingText}>画像を最適化中...</Text>
            </View>
          </View>
        )}
        
        {selectedImage ? (
          <>
            <Image source={{ uri: selectedImage }} style={styles.preview} resizeMode="cover" />
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.retakeButtonText}>撮り直す</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.analyzeButton}
                onPress={handleAnalyze}
              >
                <Text style={styles.analyzeButtonText}>AI分析を開始</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={80} color={COLORS.inactive} />
              <Text style={styles.placeholderText}>
                植物を置きたい場所を{'\n'}撮影してください
              </Text>
            </View>

            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>撮影のポイント</Text>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                <Text style={styles.tipText}>明るい時間帯に撮影</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                <Text style={styles.tipText}>部屋全体が写るように</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                <Text style={styles.tipText}>窓の位置がわかるように</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cameraButton} onPress={pickImageFromCamera}>
                <Ionicons name="camera" size={24} color={COLORS.textOnPrimary} />
                <Text style={styles.cameraButtonText}>カメラで撮影</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.libraryButton} onPress={pickImageFromLibrary}>
                <Ionicons name="images" size={24} color={COLORS.primary} />
                <Text style={styles.libraryButtonText}>ライブラリから選択</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 50,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  placeholderText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 22,
  },
  preview: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  previewActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retakeButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnPrimary,
    fontWeight: '600',
  },
  tips: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  tipsTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textOnBase,
    marginBottom: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  actions: {
    gap: SPACING.md,
  },
  cameraButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cameraButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnPrimary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  libraryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  libraryButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingBox: {
    backgroundColor: COLORS.base,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  processingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
    fontWeight: '600',
  },
});

export default CameraScreen;
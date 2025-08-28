import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

interface CameraScreenProps {
  onImageCaptured: (imageUri: string) => void;
  onBack: () => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onImageCaptured, onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラへのアクセス権限が必要です');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'フォトライブラリへのアクセス権限が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
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
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>お部屋を撮影</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
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
                <Ionicons name="camera" size={24} color={COLORS.background} />
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
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.background,
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
    color: COLORS.text,
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
    color: COLORS.background,
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
});

export default CameraScreen;
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING } from '../config/constants';

const CameraOverlay: React.FC = () => {
  return (
    <View style={styles.overlay}>
      <View style={styles.guideFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          部屋全体が入るように撮影してください
        </Text>
        <View style={styles.tips}>
          <Text style={styles.tipText}>💡 明るい時間帯がおすすめ</Text>
          <Text style={styles.tipText}>📐 まっすぐ正面から</Text>
          <Text style={styles.tipText}>🪴 植物を置きたい場所を含める</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: '90%',
    height: '60%',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.accent,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(121, 137, 148, 0.9)',
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
  },
  instructionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  tips: {
    marginTop: SPACING.xs,
  },
  tipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnPrimary,
    textAlign: 'center',
    marginVertical: 2,
  },
});

export default CameraOverlay;
import React, { useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, PanResponder, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../config/constants';

interface BeforeAfterSliderProps {
  beforeImage: any;
  afterImage: any;
  initialPosition?: number;
  width?: number;
  height?: number;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ 
  beforeImage, 
  afterImage,
  initialPosition = 50,
  width: containerWidth,
  height = 300
}) => {
  const screenWidth = containerWidth || Dimensions.get('window').width - 40;
  const [sliderPosition, setSliderPosition] = useState((initialPosition / 100) * screenWidth);
  const containerRef = useRef<View>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      let newPosition = Math.max(0, Math.min(screenWidth, gestureState.moveX));
      const percentage = (newPosition / screenWidth) * 100;
      
      // Apply snapping at edges
      if (percentage <= 10) {
        newPosition = 0;
      } else if (percentage >= 90) {
        newPosition = screenWidth;
      }
      
      setSliderPosition(newPosition);
    },
  });

  return (
    <View style={[styles.container, { width: screenWidth, height }]} ref={containerRef}>
      {/* After Image (Background) */}
      <Image source={afterImage} style={[styles.fullImage, { width: screenWidth, height }]} resizeMode="cover" />
      
      {/* Before Image (Overlay) */}
      <View style={[styles.afterImageContainer, { width: sliderPosition, height }]}>
        <Image source={beforeImage} style={[styles.fullImage, { width: screenWidth, height }]} resizeMode="cover" />
      </View>
      
      {/* Labels */}
      <View style={styles.labelsContainer}>
        <Text style={styles.labelBefore}>Before</Text>
        <Text style={styles.labelAfter}>After</Text>
      </View>
      
      {/* Slider Handle */}
      <View
        {...panResponder.panHandlers}
        style={[styles.sliderHandle, { left: sliderPosition - 20, height }]}
      >
        <View style={[styles.sliderLine, { height }]} />
        <View style={styles.sliderButton}>
          <Ionicons name="code" size={20} color={COLORS.textOnAccent} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  fullImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  afterImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  labelsContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelBefore: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
  },
  labelAfter: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
  },
  sliderHandle: {
    position: 'absolute',
    top: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#FFFFFF',
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default BeforeAfterSlider;
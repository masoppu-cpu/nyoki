import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

interface BeforeAfterSliderProps {
  beforeImage: any;
  afterImage: any;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
  const screenWidth = Dimensions.get('window').width;
  const [sliderPosition, setSliderPosition] = useState(screenWidth / 2);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newPosition = Math.max(0, Math.min(screenWidth, gestureState.moveX));
      setSliderPosition(newPosition);
    },
  });

  return (
    <View style={styles.container}>
      <Image source={beforeImage} style={styles.fullImage} resizeMode="cover" />
      <View style={[styles.afterImageContainer, { width: sliderPosition }]}>
        <Image source={afterImage} style={styles.fullImage} resizeMode="cover" />
      </View>
      <View
        {...panResponder.panHandlers}
        style={[styles.sliderHandle, { left: sliderPosition - 20 }]}
      >
        <View style={styles.sliderLine} />
        <View style={styles.sliderButton}>
          <Ionicons name="code" size={20} color={COLORS.background} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: '100%',
    position: 'absolute',
  },
  afterImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  sliderHandle: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: COLORS.background,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, PanResponder, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

interface BeforeAfterSliderProps {
  beforeImage: any;
  afterImage: any;
  initialPercent?: number; // 0..1
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  autoAnimate?: { from: number; to: number; duration?: number; delay?: number };
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  initialPercent = 0.5,
  onInteractionStart,
  onInteractionEnd,
  autoAnimate,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const initialPos = useMemo(() => Math.max(0, Math.min(1, initialPercent)) * screenWidth, [initialPercent, screenWidth]);
  const [sliderPosition, setSliderPosition] = useState(initialPos);
  const sliderAnim = useRef(new Animated.Value(initialPos)).current;

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only capture if it's a deliberate horizontal drag with minimal vertical movement
      const isHorizontalDrag = Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 5;
      // And only if starting near the slider handle
      const touchX = gestureState.x0;
      const handleX = sliderPosition;
      const isNearHandle = Math.abs(touchX - handleX) < 40;
      return isHorizontalDrag && isNearHandle;
    },
    onPanResponderGrant: () => {
      onInteractionStart?.();
    },
    onPanResponderMove: (_, gestureState) => {
      const newPosition = Math.max(0, Math.min(screenWidth, gestureState.moveX));
      sliderAnim.setValue(newPosition);
      // 次のレンダーサイクルで状態を更新
      requestAnimationFrame(() => {
        setSliderPosition(newPosition);
      });
    },
    onPanResponderRelease: () => {
      // snap to edges for 0-10% and 90-100%
      const ratio = sliderAnim._value / screenWidth;
      if (ratio <= 0.1) {
        Animated.timing(sliderAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start(() => {
          requestAnimationFrame(() => setSliderPosition(0));
        });
      } else if (ratio >= 0.9) {
        Animated.timing(sliderAnim, { toValue: screenWidth, duration: 160, useNativeDriver: false }).start(() => {
          requestAnimationFrame(() => setSliderPosition(screenWidth));
        });
      } else {
        requestAnimationFrame(() => setSliderPosition(sliderAnim._value));
      }
      onInteractionEnd?.();
    },
  }), [screenWidth, sliderPosition, onInteractionStart, onInteractionEnd]);

  // Auto-animate from -> to when requested
  useEffect(() => {
    if (!autoAnimate) return;
    const fromPos = Math.max(0, Math.min(1, autoAnimate.from)) * screenWidth;
    const toPos = Math.max(0, Math.min(1, autoAnimate.to)) * screenWidth;
    
    // 初期位置を設定
    sliderAnim.setValue(fromPos);
    requestAnimationFrame(() => {
      setSliderPosition(fromPos);
    });
    
    const t = setTimeout(() => {
      Animated.timing(sliderAnim, {
        toValue: toPos,
        duration: autoAnimate.duration ?? 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        requestAnimationFrame(() => {
          setSliderPosition(toPos);
        });
      });
    }, autoAnimate.delay ?? 0);
    return () => clearTimeout(t);
  }, [screenWidth, autoAnimate?.from, autoAnimate?.to, autoAnimate?.duration, autoAnimate?.delay, sliderAnim]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Show AFTER on the right: use it as the background */}
      <Image source={afterImage} style={styles.fullImage} resizeMode="cover" />
      {/* Show BEFORE on the left: clip to slider position */}
      <Animated.View style={[styles.afterImageContainer, { width: sliderAnim }]}>
        <Image source={beforeImage} style={styles.fullImage} resizeMode="cover" />
      </Animated.View>
      <Text style={[styles.label, styles.beforeLabel]}>Before</Text>
      <Text style={[styles.label, styles.afterLabel]}>After</Text>
      <View
        style={[styles.sliderHandle, { left: (sliderPosition as number) - 20 }]}
      >
        <View style={styles.sliderLine} />
        <View style={styles.sliderButton}>
          <Ionicons name="code" size={20} color={COLORS.textOnAccent} />
        </View>
      </View>
      <View style={styles.guideContainer}>
        <Text style={styles.guideText}>左右に動かして変化を確認</Text>
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
  label: {
    position: 'absolute',
    top: 8,
    fontSize: 12,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  beforeLabel: {
    left: 8,
  },
  afterLabel: {
    right: 8,
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
    backgroundColor: COLORS.base,
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
  guideContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

export default BeforeAfterSlider;

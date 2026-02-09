import { Animated, Easing } from 'react-native';

/**
 * Fade in animation
 * @param opacity - Animated value (0 to 1)
 * @param duration - Animation duration in ms (default: 300)
 * @returns Animation config
 */
export const fadeIn = (
  opacity: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(opacity, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Fade out animation
 * @param opacity - Animated value (1 to 0)
 * @param duration - Animation duration in ms (default: 300)
 * @returns Animation config
 */
export const fadeOut = (
  opacity: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(opacity, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Slide up animation
 * @param translateY - Animated value (starts from positive value, goes to 0)
 * @param opacity - Animated value (0 to 1)
 * @param duration - Animation duration in ms (default: 400)
 * @param fromValue - Starting Y position (default: 50)
 * @returns Animation config
 */
export const slideUp = (
  translateY: Animated.Value,
  opacity: Animated.Value,
  duration: number = 400,
  fromValue: number = 50
): Animated.CompositeAnimation => {
  translateY.setValue(fromValue);
  opacity.setValue(0);

  return Animated.parallel([
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Slide down animation
 * @param translateY - Animated value (0 to positive value)
 * @param opacity - Animated value (1 to 0)
 * @param duration - Animation duration in ms (default: 400)
 * @param toValue - Ending Y position (default: 50)
 * @returns Animation config
 */
export const slideDown = (
  translateY: Animated.Value,
  opacity: Animated.Value,
  duration: number = 400,
  toValue: number = 50
): Animated.CompositeAnimation => {
  return Animated.parallel([
    Animated.timing(translateY, {
      toValue,
      duration,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Pulse animation (scale in and out repeatedly)
 * @param scale - Animated value
 * @param minScale - Minimum scale (default: 0.95)
 * @param maxScale - Maximum scale (default: 1.05)
 * @param duration - Duration for one pulse cycle (default: 1000)
 * @returns Animation config (looping)
 */
export const pulse = (
  scale: Animated.Value,
  minScale: number = 0.95,
  maxScale: number = 1.05,
  duration: number = 1000
): Animated.CompositeAnimation => {
  scale.setValue(minScale);

  const pulseAnimation = Animated.sequence([
    Animated.timing(scale, {
      toValue: maxScale,
      duration: duration / 2,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(scale, {
      toValue: minScale,
      duration: duration / 2,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
  ]);

  return Animated.loop(pulseAnimation);
};

/**
 * Success bounce animation
 * @param scale - Animated value
 * @param duration - Animation duration in ms (default: 600)
 * @returns Animation config
 */
export const successBounce = (
  scale: Animated.Value,
  duration: number = 600
): Animated.CompositeAnimation => {
  scale.setValue(1);

  return Animated.sequence([
    Animated.spring(scale, {
      toValue: 1.2,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }),
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Shake animation (for errors)
 * @param translateX - Animated value
 * @param duration - Animation duration in ms (default: 400)
 * @returns Animation config
 */
export const shake = (
  translateX: Animated.Value,
  duration: number = 400
): Animated.CompositeAnimation => {
  translateX.setValue(0);

  const shakeAnimation = Animated.sequence([
    Animated.timing(translateX, {
      toValue: -10,
      duration: duration / 4,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(translateX, {
      toValue: 10,
      duration: duration / 4,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(translateX, {
      toValue: -10,
      duration: duration / 4,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(translateX, {
      toValue: 0,
      duration: duration / 4,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ]);

  return shakeAnimation;
};

/**
 * Scale in animation
 * @param scale - Animated value
 * @param duration - Animation duration in ms (default: 300)
 * @returns Animation config
 */
export const scaleIn = (
  scale: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  scale.setValue(0);

  return Animated.spring(scale, {
    toValue: 1,
    friction: 7,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Scale out animation
 * @param scale - Animated value
 * @param duration - Animation duration in ms (default: 300)
 * @returns Animation config
 */
export const scaleOut = (
  scale: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(scale, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};
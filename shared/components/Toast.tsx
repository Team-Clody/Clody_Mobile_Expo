import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Typo } from './typo/Typo';
import { Icon } from './Icon';

interface ToastProps {
  message: string;
  visible: boolean;
  variant?: "success" | "warning";
  duration?: number;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  variant = "success",
  duration = 2000,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    let exitAnimation: Animated.CompositeAnimation | undefined;
    translateY.setValue(20);
    const enterAnimation = Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });
    enterAnimation.start();

    const timer = setTimeout(() => {
      exitAnimation = Animated.timing(translateY, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      });
      exitAnimation.start(({ finished }) => {
        if (active && finished) onHideRef.current();
      });
    }, duration);

    return () => {
      active = false;
      clearTimeout(timer);
      enterAnimation.stop();
      exitAnimation?.stop();
    };
  }, [visible, duration, message, variant, translateY]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none" accessibilityLiveRegion="polite">
      <Animated.View
        style={[
          styles.toast,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {variant === "warning" ? (
          <Icon.IcWarning width={18} height={18} />
        ) : (
          <Icon.IcSuccess width={18} height={18} />
        )}
        <Typo.Body variant="body4" color="white">
          {message}
        </Typo.Body>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    backgroundColor: '#8791A0',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
});

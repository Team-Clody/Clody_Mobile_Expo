import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
interface Props {
  visible: boolean;
  message: string;
  onHide: () => void;
}

export default function BottomToast({ visible, message, onHide }: Props) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 80,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(onHide);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View style={styles.icon}>
          <Ionicons name="checkmark" size={16} color="#111" />
        </View>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8791A0", // Figma 느낌 회색
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999, // pill

    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    // Android
    elevation: 6,
  },

  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFC342", // 노란 체크 배경
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

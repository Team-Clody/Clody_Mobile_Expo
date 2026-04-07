import React from "react";
import { Text, StyleSheet, View } from "react-native";

interface Props {
  visible: boolean;
  message: string;
  onHide?: () => void;
}

export default function Tooltip({ visible, message }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.bubble}>
        <Text style={styles.text} numberOfLines={1}>
          {message}
        </Text>
      </View>
      <View style={styles.arrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  bubble: {
    backgroundColor: "#4A4C54",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    width: 10,
    height: 10,
    marginTop: -6,
    backgroundColor: "#4A4C54",
    transform: [{ rotate: "45deg" }],
    borderRadius: 2,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

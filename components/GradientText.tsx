import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Figma gra1 스타일: #004926 → #293038 선형 그라데이션 채움 (마스크 텍스트)
 */
export function GradientText({ children, style }: Props) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const { color: _omit, ...textStyle } = flat ?? {};

  return (
    <MaskedView
      style={styles.masked}
      maskElement={
        <View style={styles.maskRoot}>
          <Text style={[textStyle, styles.maskFill]}>{children}</Text>
        </View>
      }
    >
      <LinearGradient
        colors={["#004926", "#293038"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[textStyle, styles.sizeOnly]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  masked: {
    width: "100%",
  },
  maskRoot: {
    backgroundColor: "transparent",
  },
  maskFill: {
    color: "#000000",
  },
  gradient: {
    alignSelf: "stretch",
  },
  sizeOnly: {
    opacity: 0,
  },
});

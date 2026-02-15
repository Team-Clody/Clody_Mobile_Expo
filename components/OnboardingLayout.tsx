import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Text,
  Keyboard,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/app/_layout";
import { useFonts } from "expo-font";
export default function OnboardingLayout({
  children,
  showBack = true,
  isValid,
  text1,
  text2,
}: {
  children: React.ReactNode;
  showBack?: boolean;
  isValid?: boolean;
  text1: string;
  text2: string;
}) {
  const [fontsLoaded] = useFonts({
    PretendardRegular: require("../assets/fonts/Pretendard-Regular.otf"),
    PretendardBold: require("../assets/fonts/Pretendard-Bold.otf"),
    PretendardMedium: require("../assets/fonts/Pretendard-Medium.otf"),
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardShow, setKeyboardShow] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      setKeyboardShow(true);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      setKeyboardShow(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const { resetAuthState } = useContext(AuthContext);
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container}>
        {/* 상단 영역 */}
        <View style={styles.header}>
          {showBack && (
            <Pressable
              onPress={() => {
                if (pathname === "/name") {
                  resetAuthState();
                }
                router.back();
              }}
            >
              <Ionicons name="chevron-back" size={28} color="#111827" />
            </Pressable>
          )}
        </View>

        {/* 콘텐츠 */}
        <View style={styles.content}>
          <Text style={styles.title}>{text1}</Text>
          <Text style={styles.sub}>{text2}</Text>
          {children}
        </View>

        {/* 하단 버튼 */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: keyboardShow ? keyboardHeight : 20,
          }}
        >
          <Pressable
            disabled={!isValid}
            style={[
              styles.button,
              { backgroundColor: isValid ? "#2B2F36" : "#E5E7EB" },
            ]}
            onPress={() => {}}
          >
            <Text
              style={{
                color: isValid ? "#fff" : "#9CA3AF",
                fontWeight: "600",
              }}
            >
              다음
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingLeft: 10,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
  },

  button: {
    height: 54,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 38,
    marginTop: 10,
    fontFamily: "PretendardBold",
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
});

import {
  View,
  KeyboardAvoidingView,
  StyleSheet,
  Pressable,
  Text,
  Keyboard,
  Linking,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/app/_layout";
import { useFonts } from "expo-font";
import { RegisterContext } from "@/app/(register)/_layout";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "@/services/authService";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export default function OnboardingLayout({
  children,
  showBack = true,
  isValid,
  ready,
  text1,
  text2,
}: {
  children: React.ReactNode;
  showBack?: boolean;
  isValid?: boolean;
  ready?: boolean;
  text1: string;
  text2: string;
}) {
  const [fontsLoaded] = useFonts({
    PretendardRegular: require("../assets/fonts/Pretendard-Regular.otf"),
    PretendardBold: require("../assets/fonts/Pretendard-Bold.otf"),
    PretendardMedium: require("../assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("../assets/fonts/Pretendard-SemiBold.otf"),
  });
  const insets = useSafeAreaInsets();
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
  const { form, setForm } = useContext(RegisterContext)!;

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
          {pathname !== "/name" && ready ? (
            <Text
              style={styles.skip}
              onPress={async () => {
                if (pathname == "/birth") {
                  setForm({
                    ...form,
                    birthDate: "",
                    gender: "none",
                  });
                  router.push("/alarm");
                } else if (pathname == "/alarm") {
                  const d = new Date();
                  d.setHours(21, 30, 0, 0);
                  const id = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "클로디",
                      body: "하루를 돌아보며 감사했던 순간을 적어보세요 ✍️",
                    },
                    trigger: {
                      type: Notifications.SchedulableTriggerInputTypes.DAILY,
                      hour: d.getHours(),
                      minute: d.getMinutes(),
                    },
                  });
                  console.log(form);
                  await AsyncStorage.setItem("alarmId", id);
                  setForm({
                    ...form,
                    alarm: String(d),
                  });
                  const kakao = await AsyncStorage.getItem("kakao_accessToken");
                  const google =
                    await AsyncStorage.getItem("google_accessToken");
                  let result;
                  if (kakao) {
                    result = await authService.kakaoSignUp(form);
                  } else if (google) {
                    result = await authService.googleSignUp(form);
                  }

                  await SecureStore.setItem("accessToken", result.accessToken);
                  await SecureStore.setItem(
                    "refreshToken",
                    result.refreshToken,
                  );
                  router.replace("/main");
                }
              }}
            >
              건너뛰기
            </Text>
          ) : null}
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
            paddingHorizontal: keyboardShow ? 0 : 14,
            paddingBottom: keyboardShow ? (Platform.OS === 'ios' ? keyboardHeight-insets.bottom : keyboardHeight)  : 0,
          }}
        >
          <Pressable
            disabled={!isValid}
            style={[
              styles.button,
              { backgroundColor: isValid ? "#2B2F36" : "#E5E7EB" },
            ]}
            onPress={async () => {
              if (pathname === "/name") {
                router.push("/birth");
              } else if (pathname == "/birth") {
                router.push("/alarm");
              } else if (pathname == "/alarm") {
                const { status } =
                  await Notifications.requestPermissionsAsync();
                if (status !== "granted") {
                  Linking.openSettings();
                  return;
                }
                const alarmId = await AsyncStorage.getItem("alarmId");
                if (alarmId) {
                  await Notifications.cancelScheduledNotificationAsync(alarmId);
                  await AsyncStorage.removeItem("alarmId");
                }
                const d = new Date(form.alarm);
                const id = await Notifications.scheduleNotificationAsync({
                  content: {
                    title: "클로디",
                    body: "하루를 돌아보며 감사했던 순간을 적어보세요 ✍️",
                  },
                  trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: d.getHours(),
                    minute: d.getMinutes(),
                  },
                });
                await AsyncStorage.setItem("alarmId", id);
                console.log(form);
                const kakao = await AsyncStorage.getItem("kakao_accessToken");
                const google = await AsyncStorage.getItem("google_accessToken");
                let result;
                if (kakao) {
                  result = await authService.kakaoSignUp(form);
                } else if (google) {
                  result = await authService.googleSignUp(form);
                }
                await SecureStore.setItem("accessToken", result.accessToken);
                await SecureStore.setItem("refreshToken", result.refreshToken);
                router.replace("/main");
              }
            }}
          >
            <Text
              style={{
                color: isValid ? "#fff" : "#757980",
                fontFamily: "PretendardSemiBold",
                fontSize: 18,
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
    paddingRight: 14,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
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
  skip: {
    fontFamily: "PretendardSemiBold",
    fontSize: 16,
  },
});

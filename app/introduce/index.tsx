import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import IntroduceFirstImage from "@/assets/introduce/1.svg";
import IntroduceSecondImage from "@/assets/introduce/2.svg";
import IntroduceThirdImage from "@/assets/introduce/3.svg";
import GoogleIcon from "@/assets/icons/ic_google.svg";
import type { AxiosError } from "axios";
import { statusCodes } from "@react-native-google-signin/google-signin";

import KakaoLoginButton from "@/components/KakaoLoginButton";
import { useApp } from "@/store/useAppStore";
import authService from "@/services/authService";
import { tokenStorage } from "@/shared/storage/tokenStorage";
import {
  DEV_BYPASS_AUTH,
  enterAppWithDevBypass,
} from "@/shared/config/devAuth";
import { getAvailableLoginButtons } from "@/shared/utils/loginButtons";
import { getLanguageCode } from "@/shared/utils/locale";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HERO_PAGE_COUNT = 3;

const KO_SLIDES = [
  {
    badge: "AI 친구 로디",
    title: "감사일기에 칭찬과 응원의\n답장을 작성해요",
  },
  {
    badge: "행운의 클로버",
    title: "하루에 기록한 감사가\n쌓일수록 클로버가 진해져요",
  },
  {
    badge: "감사일기",
    title: "오늘과 전날 일기만\n작성할 수 있어요",
  },
] as const;

const EN_SLIDES = [
  {
    badge: "Your friend Lody",
    title: "Replies filled with\ncompliments and\nencouragement",
  },
  {
    badge: "Lucky Clover",
    title:
      "The more you confide in\nLody, the luckier your\nclover becomes",
  },
  {
    badge: "Gratitude journal",
    title: "You can only journal\nfor today and yesterday",
  },
] as const;

export default function Introduce() {
  const [fontsLoaded] = useFonts({
    PretendardMedium: require("@/assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("@/assets/fonts/Pretendard-SemiBold.otf"),
    PretendardBold: require("@/assets/fonts/Pretendard-Bold.otf"),
  });
  const { setIsLoggedIn } = useApp();
  const languageCode = useMemo(() => getLanguageCode(), []);
  const isKorean = languageCode === "ko";
  const loginButtons = useMemo(() => getAvailableLoginButtons(), []);
  const [pageIndex, setPageIndex] = useState(0);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pagerWrapHeight, setPagerWrapHeight] = useState(0);
  const kakaoBusyRef = useRef(false);
  const googleBusyRef = useRef(false);

  useEffect(() => {
    if (!DEV_BYPASS_AUTH) return;
    void (async () => {
      await enterAppWithDevBypass();
      router.replace("/(home)/(tabs)/main");
    })();
  }, []);

  const handleKakaoLogin = useCallback(async () => {
    if (kakaoBusyRef.current) return;
    kakaoBusyRef.current = true;
    setKakaoLoading(true);
    try {
      const { accessToken, refreshToken } = await authService.kakaoLogin();
      await tokenStorage.saveTokens(accessToken, refreshToken);
      setIsLoggedIn(true);
      router.replace("/(home)/(tabs)/main");
    } catch (error) {
      console.error(error);
      const status = (error as AxiosError)?.response?.status;
      if (status === 404) {
        router.replace("/register" as never);
        return;
      }
      Alert.alert(
        isKorean ? "로그인 실패" : "Sign-in failed",
        isKorean
          ? "카카오 로그인을 완료할 수 없습니다. 잠시 후 다시 시도해 주세요."
          : "We couldn’t complete Kakao sign-in. Please try again.",
      );
    } finally {
      kakaoBusyRef.current = false;
      setKakaoLoading(false);
    }
  }, [setIsLoggedIn, isKorean]);

  const handleGoogleLogin = useCallback(async () => {
    if (googleBusyRef.current) return;
    googleBusyRef.current = true;
    setGoogleLoading(true);
    try {
      const { accessToken, refreshToken } = await authService.googleLogin();
      await tokenStorage.saveTokens(accessToken, refreshToken);
      setIsLoggedIn(true);
      router.replace("/(home)/(tabs)/main");
    } catch (error) {
      if ((error as { code?: string })?.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error(error);
      const status = (error as AxiosError)?.response?.status;
      if (status === 404) {
        router.replace("/register" as never);
        return;
      }
      Alert.alert(
        isKorean ? "로그인 실패" : "Sign-in failed",
        isKorean
          ? "구글 로그인을 완료할 수 없습니다. 잠시 후 다시 시도해 주세요."
          : "We couldn’t complete Google sign-in. Please try again.",
      );
    } finally {
      googleBusyRef.current = false;
      setGoogleLoading(false);
    }
  }, [setIsLoggedIn, isKorean]);

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setPageIndex(e.nativeEvent.position);
    },
    [],
  );

  const slides = isKorean ? KO_SLIDES : EN_SLIDES;
  const appleLoginLabel = isKorean ? "Apple로 로그인" : "Sign up with Apple";
  const heroHeight = SCREEN_WIDTH * 173 / 375;
  const pagerTop = Math.max(24, Math.round(pagerWrapHeight * 0.165));
  const titleHeight = isKorean ? 56 : 84;
  const dotsTop = pagerTop + 30 + 16 + titleHeight + 16 + heroHeight + 16;
  const handlePagerWrapLayout = useCallback((e: LayoutChangeEvent) => {
    setPagerWrapHeight(e.nativeEvent.layout.height);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const appleLoginButton = (
    <Pressable style={styles.appleSlot} onPress={() => {}}>
      <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
      <Text style={styles.appleSlotText}>{appleLoginLabel}</Text>
    </Pressable>
  );
  const googleLoginButton = (
    <Pressable
      style={[styles.googleSlot, googleLoading && styles.loadingDisabled]}
      onPress={() => {
        void handleGoogleLogin();
      }}
      disabled={googleLoading}
      accessibilityRole="button"
    >
      <GoogleIcon width={18} height={18} />
      <Text style={styles.googleSlotText}>
        {isKorean ? "구글로 로그인" : "Sign up with Google"}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={styles.pagerWrap} onLayout={handlePagerWrapLayout}>
        <PagerView
          style={styles.pager}
          initialPage={0}
          onPageSelected={onPageSelected}
        >
          {slides.map((slide, index) => (
            <View
              key={String(index)}
              style={[styles.pagerPage, { paddingTop: pagerTop }]}
              collapsable={false}
            >
              <View style={styles.badgeSlot}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{slide.badge}</Text>
                </View>
              </View>
              <View style={[styles.titleSlot, { minHeight: titleHeight }]}>
                <Text style={styles.title}>{slide.title}</Text>
              </View>
              <View
                style={[
                  styles.heroPlaceholder,
                  { height: heroHeight },
                ]}
              >
                {index === 0 ? (
                  <View style={styles.firstHeroImageWrap}>
                    <IntroduceFirstImage
                      width="100%"
                      height="100%"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </View>
                ) : index === 1 ? (
                  <View style={styles.firstHeroImageWrap}>
                    <IntroduceSecondImage
                      width="100%"
                      height="100%"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </View>
                ) : index === 2 ? (
                  <View style={styles.firstHeroImageWrap}>
                    <IntroduceThirdImage
                      width="100%"
                      height="100%"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </View>
                ) : (
                  <>
                    <Text style={styles.heroLabel}>
                      {isKorean ? "이미지 영역" : "Illustration"}
                    </Text>
                    <Text style={styles.heroSub}>
                      {isKorean
                        ? `슬라이드 ${index + 1} / ${HERO_PAGE_COUNT}`
                        : `Slide ${index + 1} of ${HERO_PAGE_COUNT}`}
                    </Text>
                  </>
                )}
              </View>
            </View>
          ))}
        </PagerView>
        <View
          style={[styles.dotsRow, { top: dotsTop }]}
          accessibilityRole="tablist"
        >
          {Array.from({ length: HERO_PAGE_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === pageIndex ? styles.dotActive : styles.dotInactive,
              ]}
              accessibilityLabel={
                isKorean
                  ? `이미지 슬라이드 ${i + 1}`
                  : `Onboarding slide ${i + 1}`
              }
              accessibilityState={{ selected: i === pageIndex }}
            />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.bottomActions,
          { paddingBottom: 2 },
        ]}
      >
        {loginButtons.includes("kakao") ? (
          <View style={styles.kakaoWrap}>
            <KakaoLoginButton
              onPress={handleKakaoLogin}
              disabled={kakaoLoading}
            />
            {kakaoLoading ? (
              <View style={styles.kakaoLoadingOverlay} pointerEvents="none">
                <ActivityIndicator color="#000" />
              </View>
            ) : null}
          </View>
        ) : null}
        {loginButtons.includes("apple") ? appleLoginButton : null}
        {loginButtons.includes("google") ? googleLoginButton : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  badgeSlot: {
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: "#F2F3F6",
  },
  badgeText: {
    fontFamily: "PretendardMedium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.28,
    color: "#4A4C54",
  },
  titleSlot: {
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "center",
  },
  title: {
    fontFamily: "PretendardBold",
    fontSize: 20,
    color: "#1B1C20",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  pagerWrap: {
    flex: 1,
    minHeight: 240,
    position: "relative",
  },
  pager: {
    flex: 1,
  },
  pagerPage: {
    flex: 1,
    width: SCREEN_WIDTH,
    paddingHorizontal: 0,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  heroPlaceholder: {
    width: "100%",
    height: 188,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  firstHeroImageWrap: {
    width: "100%",
    aspectRatio: 375 / 173,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7684",
  },
  heroSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#8791A0",
  },
  dotsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "#1B1C20",
  },
  dotInactive: {
    backgroundColor: "#D1D5DD",
  },
  bottomActions: {
    paddingHorizontal: 14,
    paddingTop: 0,
    gap: 10,
  },
  kakaoWrap: {
    position: "relative",
    width: "100%",
  },
  kakaoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  appleSlot: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  appleSlotText: {
    fontFamily: "PretendardSemiBold",
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: -0.05,
    color: "#FFFFFF",
  },
  googleSlot: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleSlotText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B1C20",
  },
  loadingDisabled: {
    opacity: 0.55,
  },
});

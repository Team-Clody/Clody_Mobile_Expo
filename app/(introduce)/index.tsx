import { useContext, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useFonts } from "expo-font";
import { AuthContext } from "../_layout";
import { router } from "expo-router";
import KakaoLoginButton from "@/components/KakaoLoginButton";
import AppleLoginButton from "@/components/AppleLoginButton";
import img1 from "@/assets/images/img_signin_pager_1.png";
import img2 from "@/assets/images/img_signin_pager_2.png";
import img3 from "@/assets/images/img_signin_pager_3.png";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Localization from "expo-localization";
import GoogleLoginButton from "@/components/googleLoginButton";

const { width } = Dimensions.get("window");

export default function Introduce() {
  const { login, finRegister, isLoggedIn } = useContext(AuthContext);
  const locale = Localization.getLocales()[0];
  console.log(locale);
  let{ languageTag } = locale;
  languageTag = languageTag.split('-')[0].toLowerCase();
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/main");
      return;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!finRegister) {
      router.push("/name");
      return;
    }
  }, [finRegister]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };
  const slides = [
    {
      image: img1,
      label: languageTag === "en" ? "Your friend Lody " : "AI 친구 로디",
      title:
        languageTag === "en"
          ? "Replies filled with\ncompliments and\nencouragement"
          : "감사일기에 칭찬과 응원의\n답장을 작성해요",
    },
    {
      image: img2,
      label: languageTag === "en" ? "Lucky Clover " : "행운의 클로버",
      title:
        languageTag === "en"
          ? "The more you confide in \nLody, the luckier your \nclover becomes"
          : "하루에 기록한 감사가\n쌓일수록 클로버가 진해져요",
    },
    {
      image: img3,
      label: languageTag === "en" ? "Gratitude journal " : "감사일기",
      title:
        languageTag === "en"
          ? "You can only journal \nfor today and yesterday"
          : "오늘과 전날 일기만 \n작성할 수 있어요",
    },
  ];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
        >
          {slides.map((slide, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              {/* 🔹 상단 텍스트 */}
              <View style={[styles.textArea, { width: "100%" }]}>
                <View
                  style={[
                    styles.labelBox,
                    {
                      paddingVertical: languageTag === "en" ? 5 : 5,
                      paddingHorizontal: languageTag === "en" ? 9 : 9,
                      paddingTop: languageTag === "en" ? 5 : 4,
                      paddingRight: languageTag === "en" ? 9 : 8,
                    },
                  ]}
                >
                  <Text style={styles.label}>{slide.label}</Text>
                </View>

                <Text
                  style={[
                    {
                      fontSize: 22,
                      textAlign: "center",
                      lineHeight: 31,
                      fontFamily: "PretendardBold",
                      width: "100%",
                      paddingTop: 2,
                    },
                  ]}
                >
                  {slide.title}
                </Text>
              </View>
              <Image
                source={slide.image}
                style={styles.slideImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>
        <View
          style={[styles.dots, { bottom: languageTag === "en" ? (Platform.OS === "ios" ? 105 : 210) : (Platform.OS === "ios" ? 150 : 210)}]}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentIndex === i && styles.activeDot]}
            />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.bottom,
         
        ]}
      >
        {Platform.OS === "android" && languageTag === "en" && (
          <>
            <GoogleLoginButton disabled={true}  onPress={() => login("google")} />
            <GoogleLoginButton onPress={() => login("kakao")} />
          </>
        )}
        {Platform.OS === "android" && languageTag !== "en" && (
          <>
            <KakaoLoginButton disabled={true} onPress={() => login("kakao")} />
            <KakaoLoginButton onPress={() => login("kakao")} />
          </>
        )}

        {Platform.OS === "ios" && languageTag === "en" && (
          <>
            <AppleLoginButton onPress={() => login("apple")} />
            <View style={{ height: 6 }} />
            <GoogleLoginButton onPress={() => login("kakao")} />
          </>
        )}
        {Platform.OS === "ios" && languageTag !== "en" && (
          <>
            <KakaoLoginButton onPress={() => login("kakao")} />
      
            <AppleLoginButton onPress={() => login("apple")} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 70,
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  top: {
    flex: 1,
    justifyContent: "center",
    height: 80,
  },
  slideImage: {
    width: width * 1.05,
    height: 235, // 👈 고정
    resizeMode: "contain",
  },

  dots: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: "#333",
  },

  bottom: {
    paddingHorizontal: 16,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
  },

  textArea: {
    alignItems: "center",
  },

  labelBox: {
    backgroundColor: "#F1F1F1",
    display: "flex",
    borderRadius: 4,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4C4C4C",
    fontFamily: "PretendardMedium",
  },
  title: {},
});

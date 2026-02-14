import { useContext, useState } from "react";
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
import { Slot } from "expo-router";
import KakaoLoginButton from "@/components/KakaoLoginButton";
import AppleLoginButton from "@/components/AppleLoginButton";

import img1 from "@/assets/images/img_signin_pager_1.png";
import img2 from "@/assets/images/img_signin_pager_2.png";
import img3 from "@/assets/images/img_signin_pager_3.png";

const { width } = Dimensions.get("window");

export default function HomeLayout() {
  const [fontsLoaded] = useFonts({
    PretendardRegular: require("../../assets/fonts/Pretendard-Regular.otf"),
    PretendardBold: require("../../assets/fonts/Pretendard-Bold.otf"),
    PretendardMedium: require("../../assets/fonts/Pretendard-Medium.otf"),
  });
  const { login, isLoggedIn } = useContext(AuthContext);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };
  const slides = [
    {
      image: img1,
      label: "AI 친구 로디",
      title: "감사일기에 칭찬과 응원의\n답장을 작성해요",
    },
    {
      image: img2,
      label: "행운의 클로버",
      title: "하루에 기록한 감사가\n쌓일수록 클로버가 진해져요",
    },
    {
      image: img3,
      label: "감사일기",
      title: "오늘과 전날 일기만\n작성할 수 있어요",
    },
  ];
  if (isLoggedIn) return <Slot />;

  return (
    <View style={styles.container}>
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
              <View style={styles.textArea}>
                <View style={styles.labelBox}>
                  <Text style={styles.label}>{slide.label}</Text>
                </View>

                <Text style={styles.title}>{slide.title}</Text>
              </View>
              <Image
                source={slide.image}
                style={styles.slideImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentIndex === i && styles.activeDot]}
            />
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        {Platform.OS === "android" && (
          <>
            <KakaoLoginButton onPress={() => login("kakao")} />
            <KakaoLoginButton onPress={() => login("apple")} />
          </>
        )}

        {Platform.OS === "ios" && (
          <>
            <KakaoLoginButton onPress={() => login("kakao")} />
            <View style={{ height: 12 }} />
            <AppleLoginButton onPress={() => login("apple")} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 110,
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  top: {
    flex: 0.695,
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

  /* 🔽 하단 버튼 영역 */
  bottom: {
    paddingHorizontal: 16,
    paddingBottom: 75,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    color: "#4C4C4C",
    fontWeight: "500",
    fontFamily: "PretendardMedium",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
    fontFamily: "PretendardBold",
  },
});

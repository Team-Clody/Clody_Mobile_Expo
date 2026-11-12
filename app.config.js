const ADMOB_APP_IDS = {
  android: "ca-app-pub-6721111543239153~1390622228",
  ios: "ca-app-pub-6721111543239153~7854886391",
};

export default {
  expo: {
    name: "Clody_Mobile_Expo",
    slug: "clodymobileexpo",
    version: "2.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "clodymobileexpo",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.clody.corp",
      buildNumber: "7",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_PLIST || "./GoogleService-Info.plist",
      infoPlist: {
        GADApplicationIdentifier: ADMOB_APP_IDS.ios,
      },
    },
    android: {
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
      package: "com.clody.Clody_Mobile_Expo",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/bootsplash/logo4x.png",
          resizeMode: "contain",
          backgroundColor: "#8FF76F",
          imageWidth: 160,
        },
      ],
      "expo-secure-store",
      "@react-native-firebase/app",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            "com.googleusercontent.apps.430648671385-2l5bjp3apfjp0bed20646vk3orvj04e3",
        },
      ],
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: ADMOB_APP_IDS.android,
          iosAppId: ADMOB_APP_IDS.ios,
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: [
              "https://devrepo.kakao.com/nexus/content/groups/public/",
            ],
            newArchEnabled: true,
          },
          ios: {
            newArchEnabled: true,
            useFrameworks: "static",
            forceStaticLinking: ["RNFBApp", "RNFBAnalytics", "RNFBRemoteConfig"],
          },
        },
      ],
      [
        "@react-native-kakao/core",
        {
          nativeAppKey: "b520fc6d759caf1cb41ec2a7be31fb75",
          android: {
            authCodeHandlerActivity: true,
          },
          ios: {
            handleKakaoOpenUrl: true,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      androidStoreUrl:
        process.env.EXPO_PUBLIC_ANDROID_STORE_URL ||
        "https://play.google.com/store/apps/details?id=com.sopt.clody&hl=ko",
      iosStoreUrl:
        process.env.EXPO_PUBLIC_IOS_STORE_URL ||
        "https://apps.apple.com/kr/app/%ED%81%B4%EB%A1%9C%EB%94%94-%ED%96%89%EC%9A%B4%EC%9D%84-%EC%A0%84%ED%95%98%EB%8A%94-%EA%B0%90%EC%82%AC%EC%9D%BC%EA%B8%B0/id6511215518",
      /** JS에서 `initializeKakaoSDK` 호출 시 사용 (네이티브 플러그인 nativeAppKey와 동일해야 함) */
      kakaoNativeAppKey: "b520fc6d759caf1cb41ec2a7be31fb75",
      /** iOS Google Sign-In configure용 Client ID */
      googleIosClientId:
        "430648671385-2l5bjp3apfjp0bed20646vk3orvj04e3.apps.googleusercontent.com",
      /** Web Google Sign-In configure용 Client ID (서버 idToken 검증용 audience) */
      googleWebClientId:
        "430648671385-fpd7ugcuko0dphopbt329mh9r7lml8bc.apps.googleusercontent.com",
      /** true/false로 지정하면 dev/release 기본 테스트 광고 ID 정책을 덮어씀 */
      admobUseTestAds:
        process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS == null
          ? undefined
          : process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS !== "false",
      eas: {
        projectId: "32473cd1-e225-4303-b3b1-8c52103eded6",
      },
    },
    owner: "clodymobile",
  },
};

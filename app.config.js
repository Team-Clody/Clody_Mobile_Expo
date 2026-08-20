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
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            "com.googleusercontent.apps.430648671385-2l5bjp3apfjp0bed20646vk3orvj04e3",
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
      /** JS에서 `initializeKakaoSDK` 호출 시 사용 (네이티브 플러그인 nativeAppKey와 동일해야 함) */
      kakaoNativeAppKey: "b520fc6d759caf1cb41ec2a7be31fb75",
      /** iOS Google Sign-In configure용 Client ID */
      googleIosClientId:
        "430648671385-2l5bjp3apfjp0bed20646vk3orvj04e3.apps.googleusercontent.com",
      /** Web Google Sign-In configure용 Client ID (서버 idToken 검증용 audience) */
      googleWebClientId:
        "430648671385-fpd7ugcuko0dphopbt329mh9r7lml8bc.apps.googleusercontent.com",
      eas: {
        projectId: "32473cd1-e225-4303-b3b1-8c52103eded6",
      },
    },
    owner: "clodymobile",
  },
};

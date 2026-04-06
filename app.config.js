export default {
  expo: {
    name: "Clody_Mobile_Expo",
    slug: "clodymobileexpo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "clodymobileexpo",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.Clody.Clody",
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
          nativeAppKey: "eb5b3511f81201dba4850861989793f6",
          android: {
            authCodeHandlerActivity: true,
          },
          ios: {
            authCodeHandlerActivity: true,
          },
        },
      ],
      "@react-native-kakao/core",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "32473cd1-e225-4303-b3b1-8c52103eded6",
      },
    },
    owner: "clodymobile",
  },
};

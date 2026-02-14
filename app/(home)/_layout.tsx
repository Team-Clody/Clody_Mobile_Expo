import { useContext } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { AuthContext } from "../_layout";
import PagerView from "react-native-pager-view";
import { Slot, withLayoutContext } from "expo-router";
import type {
  ParamListBase,
  TabNavigationState,
} from "@react-navigation/native";
import KakaoLoginButton from "@/components/KakaoLoginButton";
import AppleLoginButton from "@/components/AppleLoginButton";
const { width } = Dimensions.get("window");
export default function HomeLayout() {
  const { login, logout, isLoggedIn } = useContext(AuthContext);
  return isLoggedIn ? (
    <Slot />
  ) : (
    <View style={styles.container}>
      <View style={styles.top}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          <View style={[styles.slide, { width }]}>
            <Text>슬라이드 1</Text>
          </View>

          <View style={[styles.slide, { width }]}>
            <Text>슬라이드 2</Text>
          </View>

          <View style={[styles.slide, { width }]}>
            <Text>슬라이드 3</Text>
          </View>
        </ScrollView>
      </View>
      <View style={styles.bottom}>
        <View>
          {Platform.OS === "android" && <KakaoLoginButton onPress={login} />}
          {Platform.OS === "ios" && (
            <View>
              <KakaoLoginButton onPress={login} />
              <AppleLoginButton onPress={login} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    height: 300,
  },
  slide: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  bottom: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

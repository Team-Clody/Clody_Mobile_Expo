import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import i18n from "@/app/i18n/i18n";
import IcHomeOn from "@/assets/icons/ic_home_on.svg";
import IcHomeOff from "@/assets/icons/ic_home_off.svg";
import IcListOn from "@/assets/icons/ic_list_on.svg";
import IcListOff from "@/assets/icons/ic_list_off.svg";
import IcMyOn from "@/assets/icons/ic_my_on.svg";
import IcMyOff from "@/assets/icons/ic_my_off.svg";

const ICON_SIZE = 28;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#000",
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="main"
        options={{
          title: i18n.t("home"),
          tabBarIcon: ({ focused }) =>
            focused ? (
              <IcHomeOn width={ICON_SIZE} height={ICON_SIZE} />
            ) : (
              <IcHomeOff width={ICON_SIZE} height={ICON_SIZE} />
            ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: i18n.t("calander"),
          tabBarIcon: ({ focused }) =>
            focused ? (
              <IcListOn width={ICON_SIZE} height={ICON_SIZE} />
            ) : (
              <IcListOff width={ICON_SIZE} height={ICON_SIZE} />
            ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: i18n.t("mypage"),
          tabBarIcon: ({ focused }) =>
            focused ? (
              <IcMyOn width={ICON_SIZE} height={ICON_SIZE} />
            ) : (
              <IcMyOff width={ICON_SIZE} height={ICON_SIZE} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#F0F2F5",
    backgroundColor: "#fff",
    paddingTop: 8,
    // 연한 회색 톤 그림자 (기본 elevation 8 대체)
    elevation: 1,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#B8BEC8",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: -3 },
        }
      : null),
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});

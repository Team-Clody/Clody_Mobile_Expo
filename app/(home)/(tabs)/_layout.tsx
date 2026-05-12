import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
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
    borderTopWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#fff",
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});

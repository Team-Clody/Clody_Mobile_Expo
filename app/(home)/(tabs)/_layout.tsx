import { Tabs } from "expo-router";
import { Image, StyleSheet } from "react-native";
import i18n from "@/app/i18n/i18n";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="main"
        options={{
          title: i18n.t("home"),
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("@/assets/icons/btn_home.png")}
              style={[styles.icon, { opacity: focused ? 1 : 0.5 }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: i18n.t("calander"),
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("@/assets/icons/btn_list.png")}
              style={[styles.icon, { opacity: focused ? 1 : 0.5 }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: i18n.t("mypage"),
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("@/assets/icons/btn_mypage.png")}
              style={[styles.icon, { opacity: focused ? 1 : 0.5 }]}
            />
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
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
});

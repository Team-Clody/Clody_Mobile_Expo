import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext } from "react";
import { HomeContext } from "./_layout";
import { useRouter } from "expo-router";
import { Image } from "react-native";
import i18n from "../i18n/i18n";

export default function MyPage() {
  const context = useContext(HomeContext);
  const router = useRouter();
  // 안전 처리
  if (!context) return null;

  const { form } = context;

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* 🔥 타이틀 */}
          <Text style={styles.title}>{i18n.t("mypage")}</Text>

          {/* 👤 프로필 + 클로버 */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/(home)/profile")}
            >
              <View style={styles.profileLeft}>
                <View style={styles.avatar} />
                <Text style={styles.name}>
                  {form.nickname || i18n.t("noNickname")}
                </Text>
              </View>
              <Text style={styles.arrow}>{">"}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row}>
              <Text style={styles.menuText}>{i18n.t("myCover")}</Text>

              <View style={styles.right}>
                <Image
                  source={require("@/assets/icons/btn_clover.png")}
                  style={{ width: 16, height: 16 }}
                />
                <Text style={styles.count}>{form.cloverCount ?? 0}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 📋 메뉴 그룹 */}
          <View style={styles.card}>
            <Menu label={i18n.t("notification")} />
            <Menu label={i18n.t("notice")} />
            <Menu label={i18n.t("support")} />
            <Menu label={i18n.t("faq")} />
            <Menu
              label={i18n.t("teamClody")}
              last
              onPress={() => router.push("/(home)/teamClody")}
            />
          </View>

          {/* ⚙️ 하단 그룹 */}
          <View style={styles.card}>
            <Menu label={i18n.t("terms")} />
            <Menu label={i18n.t("privacy")} />
            <Menu
              label={i18n.t("version")}
              right={i18n.t("latestVersion")}
              last
            />
          </View>
        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
}

/**
 * 📌 공통 메뉴 컴포넌트
 */
function Menu({
  label,
  right,
  last,
  onPress,
}: {
  label: string;
  right?: string;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.row]} onPress={onPress}>
      <Text style={styles.menuText}>{label}</Text>

      <View style={styles.right}>
        {right && <Text style={styles.subText}>{right}</Text>}
        <Text style={styles.arrow}>{">"}</Text>
      </View>
    </TouchableOpacity>
  );
}
function BottomNav() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.bottomNav}>
      <NavItem
        label={i18n.t("home")}
        icon={require("@/assets/icons/btn_home.png")}
        onPress={() => {}}
      />
      <NavItem
        label={i18n.t("calander")}
        icon={require("@/assets/icons/btn_list.png")}
        onPress={() => {}}
      />
      <NavItem
        label={i18n.t("mypage")}
        icon={require("@/assets/icons/btn_mypage.png")}
        onPress={() => {}}
        active
      />
    </SafeAreaView>
  );
}
function NavItem({
  label,
  icon,
  onPress,
  active,
}: {
  label: string;
  icon: any;
  onPress?: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Image
        source={icon}
        style={{ width: 22, height: 22, resizeMode: "contain" }}
      />

      <Text
        style={{
          fontSize: 11,
          marginTop: 4,
          color: active ? "#000" : "#8E8E93",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
/**
 * 🎨 스타일 (iOS 느낌)
 */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#EFEFF4",
  },
  container: {
    padding: 16,
  },

  // 🔤 타이틀
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },

  // 📦 카드
  card: {
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },

  // 📏 행
  row: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  border: {
    borderBottomWidth: 1,
    borderColor: "#E5E5EA",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 16,
  },

  // 👤 프로필
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D9D9D9",
  },

  name: {
    fontSize: 16,
    fontWeight: "500",
  },

  // 📝 텍스트
  menuText: {
    fontSize: 15,
    color: "#3C3C43",
  },

  subText: {
    fontSize: 13,
    color: "#8E8E93",
  },

  // 👉 오른쪽 영역
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  arrow: {
    fontSize: 16,
    color: "#C7C7CC",
  },

  // 🍀 클로버
  clover: {
    fontSize: 14,
  },

  count: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomNav: {
    flexDirection: "row",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#fff",
  },

  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

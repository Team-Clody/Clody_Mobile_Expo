import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { HomeContext } from "../../_layout";
import { useRouter } from "expo-router";
import { Icon } from "@/shared/components/Icon";
import i18n from "@/app/i18n/i18n";
import { typography } from "@/shared/theme/typography";

export default function MyPage() {
  const context = useContext(HomeContext);
  const router = useRouter();
  if (!context) return null;

  const { form } = context;

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{i18n.t("mypage")}</Text>

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
            <Icon.IcRightArrow width={7} height={12} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row}>
            <Text style={styles.menuText}>{i18n.t("myCover")}</Text>

            <Text style={styles.count}>
              {i18n.t("cloverCountWithUnit", { count: form.cloverCount ?? 0 })}
            </Text>
          </TouchableOpacity>
        </View>

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
    </View>
  );
}

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
        <Icon.IcRightArrow width={7} height={12} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#EFEFF4",
  },
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
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
  menuText: {
    ...typography.body9,
    color: "#1B1C20",
  },
  subText: {
    ...typography.body9,
    color: "#8791A0",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  count: {
    ...typography.body9,
    color: "#1B1C20",
  },
});

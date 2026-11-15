import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { typography } from "@/shared/theme/typography";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { HomeContext } from "../../_layout";

export default function MyPage() {
  const context = useContext(HomeContext);
  const router = useRouter();
  if (!context) return null;

  const { form } = context;

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{i18n.t("mypage")}</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.row, styles.profileRow]}
            onPress={() => router.push("/(home)/profile")}
          >
            <View style={styles.profileLeft}>
              <Icon.IcProfile width={42} height={42} />
              <Text style={styles.name}>
                {form.nickname || i18n.t("noNickname")}
              </Text>
            </View>
            <Icon.IcRightArrow width={7} height={12} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.row, styles.cloverRow]}>
            <Text style={styles.menuText}>{i18n.t("myCover")}</Text>

            <View style={styles.cloverRight}>
              <Icon.IcClover width={16} height={16} />
              <Text style={styles.count}>
                {i18n.t("cloverCountWithUnit", {
                  count: form.cloverCount ?? 0,
                })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.settingsCard]}>
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
      </ScrollView>
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
    backgroundColor: "#F2F3F6",
  },
  container: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  title: {
    ...typography.head2,
    height: 32,
    paddingTop: 3,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: 14,
    height: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileRow: { height: 70 },
  cloverRow: { height: 44 },
  settingsCard: { paddingVertical: 2 },
  border: {
    borderBottomWidth: 1,
    borderColor: "#E5E5EA",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 14,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    ...typography.body1,
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
  cloverRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  count: {
    ...typography.body9,
    color: "#1B1C20",
  },
});

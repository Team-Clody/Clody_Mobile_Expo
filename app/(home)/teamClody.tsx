import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";

import { useRouter } from "expo-router";
import i18n from "../i18n/i18n";
import { typography } from "@/shared/theme/typography";
import { Icon } from "@/shared/components/Icon";
export default function Profile() {
  const router = useRouter();

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon.IcBack width={28} height={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{i18n.t("teamClody")}</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.infoCard}>
          <InfoRow
            label={i18n.t("instagram")}
            value={"@clody_official_"}
            arrow
            onPress={() => {}}
          />
          <InfoRow
            label={i18n.t("supportTitle")}
            value={i18n.t("supportContent")}
            arrow
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  arrow,
  last,
  onPress,
}: {
  label: string;
  value: string;
  arrow?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <>
      <Pressable onPress={onPress}>
        <View style={[styles.row]}>
          <Text style={styles.label}>{label}</Text>

          <View style={styles.valueWrap}>
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
            {arrow ? (
              <Icon.IcRightArrow width={7} height={12} style={styles.arrow} />
            ) : null}
          </View>
        </View>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F2F3F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#F2F3F6",
  },

  header: {
    height: 32,
    marginTop: 4,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#111111",
  },
  headerRight: {
    width: 28,
  },

  infoCard: {
    marginTop: 25,
    backgroundColor: "#F2F3F6",
  },

  row: {
    height: 49,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F2F3F6",
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E3E3E8",
  },

  label: {
    ...typography.body9,
    color: "#4A4C54",
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "55%",
  },
  value: {
    ...typography.body9,
    color: "#4A4C54",
    textAlign: "right",
  },
  arrow: {
    marginLeft: 8,
  },

  sectionDivider: {
    height: 10,
    backgroundColor: "#E9E9EE",
    marginTop: 20,
  },

  actionRow: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 15,
    backgroundColor: "#F2F3F6",
  },
  actionText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#3F3F46",
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  modalDesc: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  logoutBtn: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelText: {
    color: "#374151",
    fontWeight: "500",
  },

  logoutText: {
    color: "white",
    fontWeight: "600",
  },
  withdrawCancelBtn: {
    flex: 1,
    backgroundColor: "#EF4444", // 빨강
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  withdrawCancelText: {
    color: "white",
    fontWeight: "600",
  },

  withdrawBtn: {
    flex: 1,
    backgroundColor: "#E5E7EB", // 회색
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  withdrawText: {
    color: "#6B7280",
    fontWeight: "600",
  },
});

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { HomeContext } from "./_layout";
import { AuthContext } from "../_layout";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Modal } from "react-native";
import i18n from "../i18n/i18n";
import BottomToast from "@/components/BottomToast";
export default function Profile() {
  const context = useContext(HomeContext);
  const { logout, revoke } = useContext(AuthContext);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.toast) {
      setToastMessage(params.toast as string);
      setToastVisible(true);
    }
  }, []);
  const router = useRouter();

  if (!context) return null;

  const { form } = context;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
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
    </SafeAreaView>
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
            {arrow ? <Text style={styles.arrow}>{">"}</Text> : null}
          </View>
        </View>
      </Pressable>
    </>
  );
}

function formatDate(date: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatGender(gender: string) {
  if (gender === "male") return i18n.t("male");
  if (gender === "female") return i18n.t("female");
  return "";
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F3F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F3F6",
  },

  header: {
    height: 56,
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
  backIcon: {
    fontSize: 30,
    lineHeight: 30,
    color: "#111111",
    fontWeight: "300",
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
    marginTop: 18,
    backgroundColor: "#F3F3F6",
  },

  row: {
    minHeight: 46,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F3F6",
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E3E3E8",
  },

  label: {
    fontSize: 16,
    lineHeight: 22,
    color: "#4A4A4A",
    fontWeight: "400",
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "55%",
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
    color: "#4A4A4A",
    fontWeight: "400",
    textAlign: "right",
  },
  arrow: {
    marginLeft: 8,
    fontSize: 18,
    lineHeight: 18,
    color: "#9A9AA2",
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
    backgroundColor: "#F3F3F6",
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

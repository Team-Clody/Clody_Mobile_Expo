import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { useCallback, useContext, useEffect, useState } from "react";
import { HomeContext } from "./_layout";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Icon } from "@/shared/components/Icon";
import BottomToast from "@/components/BottomToast";
import { AuthAPI } from "@/api/authAPI";
import i18n from "@/app/i18n/i18n";
import { useApp } from "@/store/useAppStore";
import { tokenStorage } from "@/shared/storage/tokenStorage";
import { typography } from "@/shared/theme/typography";

export default function Profile() {
  const context = useContext(HomeContext);
  const { setIsLoggedIn } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const toast = params.toast;
    if (typeof toast === "string" && toast.length > 0) {
      setToastMessage(toast);
      setToastVisible(true);
    }
  }, [params.toast]);

  const handleLogout = useCallback(async () => {
    setShowLogoutModal(false);
    try {
      await tokenStorage.clearTokens();
      setIsLoggedIn(false);
      router.replace("/introduce");
    } catch (e) {
      console.error(e);
      Alert.alert("", "로그아웃 처리 중 오류가 났어요. 다시 시도해 주세요.");
    }
  }, [router, setIsLoggedIn]);

  const handleRevoke = useCallback(async () => {
    setShowWithdrawModal(false);
    try {
      await AuthAPI.deleteUser();
      await tokenStorage.clearTokens();
      setIsLoggedIn(false);
      router.replace("/introduce");
    } catch (e) {
      console.error(e);
      Alert.alert("", "회원탈퇴 처리에 실패했어요. 다시 시도해 주세요.");
    }
  }, [router, setIsLoggedIn]);

  if (!context) return null;

  const { form } = context;

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon.IcLeftArrow width={9} height={16} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{i18n.t("profileTitle")}</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.infoCard}>
          <InfoRow
            label={i18n.t("nickname")}
            value={form.nickname || ""}
            arrow
            onPress={() => router.push("/(home)/nickname")}
          />
          <InfoRow label={i18n.t("email")} value={form.email || ""} />
          <InfoRow
            label={i18n.t("birthdate")}
            value={formatDate(form.birthDate)}
          />
          <InfoRow
            label={i18n.t("gender")}
            value={formatGender(form.gender)}
            last
          />
        </View>

        <View style={styles.sectionDivider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setShowLogoutModal(true)}
        >
          <Text style={styles.actionText}>{i18n.t("logout")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setShowWithdrawModal(true)}
        >
          <Text style={styles.actionText}>{i18n.t("withdraw")}</Text>
        </TouchableOpacity>
      </View>
      <Modal transparent visible={showLogoutModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalDisplayTitle}>
              {i18n.t("logoutTitle")}
            </Text>

            <Text style={styles.modalDesc}>{i18n.t("logoutDesc")}</Text>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelText}>{i18n.t("cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  void handleLogout();
                }}
              >
                <Text style={styles.logoutText}>{i18n.t("logout")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal transparent visible={showWithdrawModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalDisplayTitle}>
              {i18n.t("withdrawTitle")}
            </Text>

            <Text style={styles.modalDesc}>{i18n.t("withdrawDesc")}</Text>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.withdrawCancelBtn}
                onPress={() => setShowWithdrawModal(false)}
              >
                <Text style={styles.withdrawCancelText}>
                  {i18n.t("cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => {
                  void handleRevoke();
                }}
              >
                <Text style={styles.withdrawText}>
                  {i18n.t("withdrawConfirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <BottomToast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
  },

  row: {
    minHeight: 46,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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

  modalDisplayTitle: {
    ...typography.display3,
    textAlign: "center",
    color: "#1B1C20",
  },

  modalDesc: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  modalActionButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelBtn: {
    width: 139,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutBtn: {
    width: 139,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
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
    width: 139,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },

  withdrawCancelText: {
    color: "white",
    fontWeight: "600",
  },

  withdrawBtn: {
    width: 139,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  withdrawText: {
    color: "#6B7280",
    fontWeight: "600",
  },
});

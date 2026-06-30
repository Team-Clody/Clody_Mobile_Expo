import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { useContext, useEffect, useState } from "react";
import { HomeContext } from "./_layout";
import { useRouter } from "expo-router";
import { Modal } from "react-native";
import { Icon } from "@/shared/components/Icon";
import i18n from "../i18n/i18n";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const KEYBOARD_BUTTON_GAP = 12;

export default function Profile() {
  const context = useContext(HomeContext);
  if (!context) return null;
  const { form, setForm } = context;
  const [isValid, setIsValid] = useState(false);
  const [nickname, setNickname] = useState("");
  const router = useRouter();
  const [keyboardShow, setKeyboardShow] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      setKeyboardShow(true);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      setKeyboardShow(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
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
          <Text style={styles.headerTitle}>{i18n.t("nicknameChange")}</Text>

          <View style={styles.headerRight} />
        </View>
        <View
          style={[
            styles.inputWrap,
            nickname.length !== 0 && !isValid && { borderColor: "#FF4D4F" },
          ]}
        >
          <TextInput
            value={nickname}
            onChangeText={(text) => {
              if (/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ]{1,10}$/.test(text)) {
                setIsValid(true);
              } else {
                setIsValid(false);
              }
              setNickname(text);
            }}
            placeholder={form.nickname}
            placeholderTextColor="#9CA3AF"
            maxLength={10}
            style={styles.input}
          />

          {nickname.length >= 0 && (
            <Pressable onPress={() => setNickname("")}>
              <Ionicons name="close-circle" size={20} color="#C7CDD6" />
            </Pressable>
          )}
        </View>
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {
            <Text
              style={[
                styles.errorText,
                (nickname.length === 0 || isValid) && styles.errorHidden,
              ]}
            >
              {i18n.t("nicknameError")}
            </Text>
          }
          <Text style={styles.counter}>
            <Text style={styles.counterCurrent}>{nickname.length}</Text>
            <Text style={styles.counterTotal}>/10</Text>
          </Text>
        </View>
        <View
          style={[
            styles.bottomButtonWrap,
            {
              bottom: keyboardShow ? keyboardHeight + KEYBOARD_BUTTON_GAP : 0,
            },
          ]}
        >
          <Pressable
            disabled={!isValid}
            style={[
              styles.button,
              { backgroundColor: isValid ? "#2B2F36" : "#E5E7EB" },
            ]}
            onPress={async () => {
              const accessToken = await SecureStore.getItemAsync("accessToken");
              const res = await axios.patch(
                "https://test.clodycorp.com/api/v1/user/nickname",
                {
                  name: nickname,
                },
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                },
              );

              const name = res.data.data;
              console.log(name);
              setForm({ ...form, nickname });
              router.replace({
                pathname: "/profile",
                params: { toast: i18n.t("nicknameSuccess") },
              });
            }}
          >
            <Text
              style={{
                color: isValid ? "#fff" : "#757980",
                fontSize: 18,
              }}
            >
              {i18n.t("nicknameSubmit")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
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
  inputWrap: {
    marginTop: 30,
    marginRight: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#929ca0",
    borderRadius: 6,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  input: {
    fontFamily: "PretendardMedium",
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  counter: {
    marginTop: 4,
    marginRight: 10,
    fontSize: 14,
    textAlign: "right",
  },
  counterCurrent: {
    color: "#1B1C20",
  },
  counterTotal: {
    color: "#9CA3AF",
  },
  errorText: {
    marginTop: 6,
    marginLeft: 10,
    fontSize: 13,
    color: "#FF4D4F",
    fontFamily: "PretendardMedium",
  },
  errorHidden: {
    opacity: 0, // 🔥 자리 유지하면서 안보이게
  },
  button: {
    height: 54,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomButtonWrap: {
    position: "absolute",
    left: 14,
    right: 14,
  },
});

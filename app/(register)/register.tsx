import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useApp } from "@/lib/store";
import { BASE_URL } from "@/shared/http";
import { tokenStorage } from "@/shared/storage/tokenStorage";
import { getLanguageCode } from "@/shared/utils/locale";
import authService from "@/services/authService";
import IcBack from "@/assets/icons/ic_back.svg";
import IcCheckGreen from "@/assets/icons/ic_check_green.svg";
import IcCheckGray from "@/assets/icons/ic_check_gray.svg";
import BirthPicker, { BirthPickerValue } from "@/components/BirthPicker";
import ReminderTimeBottomSheet, {
  ReminderTimeValue,
} from "@/components/ReminderTimeBottomSheet";

type Step = 0 | 1 | 2 | 3;
type Gender = "male" | "female" | "none";
type PlatformType = "kakao" | "google" | "apple";
const NICKNAME_FINAL_REGEX = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ]{1,10}$/;

function normalizeBirthDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (!/^\d{6}$/.test(trimmed)) return null;

  const yy = Number(trimmed.slice(0, 2));
  const mm = trimmed.slice(2, 4);
  const dd = trimmed.slice(4, 6);
  const currentYY = new Date().getFullYear() % 100;
  const fullYear = yy <= currentYY ? `20${trimmed.slice(0, 2)}` : `19${trimmed.slice(0, 2)}`;
  return `${fullYear}-${mm}-${dd}`;
}

function normalizeKoreanBirthDateFromRaw(value: string): string | null {
  if (!/^\d{7}$/.test(value)) return null;
  const yy = Number(value.slice(0, 2));
  const mm = Number(value.slice(2, 4));
  const dd = Number(value.slice(4, 6));
  const genderDigit = Number(value[6]);
  if (genderDigit < 1 || genderDigit > 8) return null;

  const yyyy = (genderDigit <= 4 ? 1900 : 2000) + yy;
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function getKoreanBirthValidationError(value: string): string {
  const genericError = "올바른 생년월일을 입력해주세요";
  if (value.length < 7) return "";
  if (!/^\d{7}$/.test(value)) return genericError;

  const genderDigit = Number(value[6]);
  if (genderDigit < 1 || genderDigit > 8) {
    return genericError;
  }

  const yy = Number(value.slice(0, 2));
  const mm = Number(value.slice(2, 4));
  const dd = Number(value.slice(4, 6));
  if (mm < 1 || mm > 12) return genericError;
  if (dd < 1 || dd > 31) return genericError;

  const fullYear = genderDigit <= 4 ? 1900 + yy : 2000 + yy;
  if (fullYear < 1900) return genericError;

  const maxDay = new Date(fullYear, mm, 0).getDate();
  if (dd > maxDay) return genericError;

  const parsed = new Date(fullYear, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed.getTime() > today.getTime()) return genericError;

  return "";
}

export default function RegisterScreen() {
  const { setIsLoggedIn } = useApp();
  const isKorean = useMemo(() => getLanguageCode() === "ko", []);

  const [step, setStep] = useState<Step>(0);
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [koreanBirthRaw, setKoreanBirthRaw] = useState("");
  const [koreanBirthError, setKoreanBirthError] = useState("");
  const [gender, setGender] = useState<Gender>("none");
  const [reminderTime, setReminderTime] = useState("09:30");
  const [reminderValue, setReminderValue] = useState<ReminderTimeValue>(
    isKorean
      ? { period: "오전", hour: "09", minute: "30" }
      : { period: "PM", hour: "09", minute: "30" },
  );
  const [reminderSheetOpen, setReminderSheetOpen] = useState(false);
  const [birthPickerOpen, setBirthPickerOpen] = useState(false);
  const [birthPickerValue, setBirthPickerValue] = useState<BirthPickerValue>({
    ampm: "24",
    hour: "September",
    minute: "1999",
  });
  const [submitting, setSubmitting] = useState(false);
  const [englishGenderChosen, setEnglishGenderChosen] = useState(false);
  const koreanBirthInputRef = useRef<TextInput>(null);

  const finalStep = isKorean ? 2 : 3;

  const nicknameValid = NICKNAME_FINAL_REGEX.test(nickname);
  const showNicknameError = nickname.length > 0 && !nicknameValid;

  const birthDisplay = useMemo(() => {
    if (!birthDate) return "";
    const parsed = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [birthDate]);
  const reminderDisplay = useMemo(() => {
    const hourNumber = Number(reminderValue.hour || "0");
    const minuteText = (reminderValue.minute || "0").padStart(2, "0");
    if (isKorean) {
      const minuteNumber = Number(reminderValue.minute || "0");
      return `${reminderValue.period} ${hourNumber}시 ${minuteNumber}분`;
    }
    return `${hourNumber}:${minuteText} ${reminderValue.period}`;
  }, [reminderValue, isKorean]);

  const handleNicknameChange = (text: string) => {
    setNickname(text);
  };

  const handleKoreanBirthChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, "").slice(0, 7);
    setKoreanBirthRaw(numbersOnly);
    setBirthDate(numbersOnly.slice(0, 6));
    setKoreanBirthError(getKoreanBirthValidationError(numbersOnly));

    if (numbersOnly.length === 7) {
      const digit = Number(numbersOnly[6]);
      if ([1, 3, 5, 7].includes(digit)) setGender("male");
      else if ([2, 4, 6, 8].includes(digit)) setGender("female");
      else setGender("none");
      return;
    }
    setGender("none");
  };

  const submitSignup = async () => {
    if (!nicknameValid) {
      Alert.alert(
        isKorean ? "입력 확인" : "Check your input",
        isKorean
          ? "닉네임은 한글, 영문, 숫자만 1~10자로 입력해 주세요."
          : "Nickname must be 1-10 chars (letters/numbers).",
      );
      return;
    }

    setSubmitting(true);
    try {
      const [platformRaw, email, kakaoToken, googleToken] = await Promise.all([
        AsyncStorage.getItem("platform"),
        AsyncStorage.getItem("email"),
        AsyncStorage.getItem("kakao_accessToken"),
        AsyncStorage.getItem("google_accessToken"),
      ]);

      const platform = platformRaw as PlatformType | null;
      const authCode =
        platform === "kakao"
          ? kakaoToken
          : platform === "google"
            ? googleToken
            : null;

      if (!platform || !email || !authCode) {
        throw new Error("SIGNUP_CONTEXT_MISSING");
      }

      const fcmToken = await authService.getPushToken();
      const payload = {
        platform,
        fcmToken: fcmToken ? fcmToken : null,
        name: nickname,
        gender,
        birthDate: isKorean
          ? normalizeKoreanBirthDateFromRaw(koreanBirthRaw)
          : normalizeBirthDate(birthDate),
        email,
      };

      const res = await axios.post(`${BASE_URL}/api/v1/auth/signup`, payload, {
        headers: { Authorization: `Bearer ${authCode}` },
      });

      const accessToken = res.data?.data?.accessToken as string | undefined;
      const refreshToken = res.data?.data?.refreshToken as string | undefined;
      if (!accessToken || !refreshToken) {
        throw new Error("TOKEN_MISSING");
      }

      await tokenStorage.saveTokens(accessToken, refreshToken);
      await Promise.all([
        AsyncStorage.removeItem("kakao_accessToken"),
        AsyncStorage.removeItem("google_accessToken"),
      ]);

      setIsLoggedIn(true);
      router.replace("/(home)/(tabs)/main");
    } catch (error) {
      console.error(error);
      Alert.alert(
        isKorean ? "회원가입 실패" : "Sign-up failed",
        isKorean
          ? "회원가입을 완료할 수 없습니다. 잠시 후 다시 시도해 주세요."
          : "We couldn't complete sign-up. Please try again.",
      );
      if ((error as { message?: string }).message === "SIGNUP_CONTEXT_MISSING") {
        router.replace("/introduce");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step < finalStep) {
      setStep((prev) => (prev + 1) as Step);
      return;
    }
    await submitSignup();
  };

  const handleSkip = async () => {
    if (step === 1) {
      setBirthDate("");
      setKoreanBirthRaw("");
      setKoreanBirthError("");
      setGender("none");
      setEnglishGenderChosen(false);
      setStep(2);
      return;
    }

    if (isKorean && step === 2) {
      await submitSignup();
      return;
    }

    if (!isKorean && step === 2) {
      setGender("none");
      setEnglishGenderChosen(true);
      setStep(3);
      return;
    }

    if (!isKorean && step === 3) {
      await submitSignup();
    }
  };

  const handleBirthSave = () => {
    const monthItems = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = monthItems.indexOf(birthPickerValue.hour);
    if (monthIndex < 0) {
      setBirthPickerOpen(false);
      return;
    }
    const mm = String(monthIndex + 1).padStart(2, "0");
    const dd = birthPickerValue.ampm.padStart(2, "0");
    const yyyy = birthPickerValue.minute;
    setBirthDate(`${yyyy}-${mm}-${dd}`);
    setBirthPickerOpen(false);
  };

  const handleBirthPickerChange = useCallback((value: BirthPickerValue) => {
    setBirthPickerValue(value);
  }, []);

  const handleReminderConfirm = useCallback((value: ReminderTimeValue) => {
    setReminderValue(value);
    const isPM = value.period === "오후" || value.period === "PM";
    const isAM = value.period === "오전" || value.period === "AM";
    let hour24 = Number(value.hour);
    if (isPM && hour24 < 12) hour24 += 12;
    if (isAM && hour24 === 12) hour24 = 0;
    setReminderTime(
      `${String(hour24).padStart(2, "0")}:${value.minute.padStart(2, "0")}`,
    );
    setReminderSheetOpen(false);
  }, []);

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => (prev - 1) as Step);
      return;
    }
    router.replace("/introduce");
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} hitSlop={12}>
            <IcBack width={24} height={24} />
          </TouchableOpacity>
          {((isKorean && (step === 1 || step === 2)) ||
            (!isKorean && (step === 1 || step === 2 || step === 3))) ? (
            <Pressable style={styles.skipWrap} onPress={() => void handleSkip()}>
              <Text style={styles.skipText}>{isKorean ? "건너뛰기" : "Skip"}</Text>
            </Pressable>
          ) : (
            <View style={styles.headerRightPlaceholder} />
          )}
        </View>

        {step === 0 && (
          <View style={styles.section}>
            <Text style={styles.title}>
              {isKorean ? "만나서 반가워요\n어떻게 불러드릴까요?" : "Nice to meet you!\nWhat should I call you?"}
            </Text>
            <Text style={styles.subtitle}>
              {isKorean ? "프로필에 보일 닉네임이에요" : "Nickname shown on your profile"}
            </Text>
            <View style={[styles.inputWrap, showNicknameError && styles.inputError]}>
              <TextInput
                value={nickname}
                onChangeText={handleNicknameChange}
                placeholder={isKorean ? "닉네임을 입력해주세요." : "Please enter your nickname"}
                placeholderTextColor="#757980"
                style={[styles.input, styles.nicknameInput]}
                maxLength={10}
              />
              {nickname.length > 0 ? (
                <Pressable
                  onPress={() => setNickname("")}
                  hitSlop={10}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#C7CDD6" />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.nicknameMetaRow}>
              {showNicknameError ? (
                <Text style={styles.errorText}>
                  {isKorean
                    ? "닉네임은 한글,영문,숫자만 가능해요."
                    : "Only Korean, English letters, and numbers are allowed."}
                </Text>
              ) : null}
              <Text style={styles.counterText}>{nickname.length}/10</Text>
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.title}>
              {isKorean ? "생년월일/성별을\n입력해 주세요" : "When is\nyour birthday?"}
            </Text>
            <Text style={styles.subtitle}>
              {isKorean
                ? "맞춤형 감사일기 소재를 추천하는 데 필요해요"
                : "Used to recommend gratitude prompts tailored to you."}
            </Text>
            {isKorean ? (
              <Pressable
                style={[
                  styles.inputWrap,
                  styles.koreanBirthWrap,
                  !!koreanBirthError && styles.inputError,
                ]}
                onPress={() => koreanBirthInputRef.current?.focus()}
              >
                <TextInput
                  ref={koreanBirthInputRef}
                  value={koreanBirthRaw}
                  onChangeText={handleKoreanBirthChange}
                  style={styles.koreanBirthHiddenInput}
                  keyboardType="number-pad"
                  maxLength={7}
                  caretHidden
                  selectionColor="transparent"
                />
                <View style={styles.koreanBirthFront}>
                  <Text
                    style={[
                      styles.koreanBirthInput,
                      !koreanBirthRaw && styles.koreanBirthPlaceholder,
                    ]}
                  >
                    {koreanBirthRaw.slice(0, 6) || "생년월일 6자리"}
                  </Text>
                </View>
                <View style={styles.koreanBirthHyphenWrap}>
                  <Text style={styles.koreanBirthHyphen}>-</Text>
                </View>
                <View style={styles.koreanBirthMaskWrap}>
                  <Text
                    style={[
                      styles.koreanBirthMaskLeadDot,
                      koreanBirthRaw.length >= 7 && styles.koreanBirthMaskLeadDotFilled,
                    ]}
                  >
                    ●
                  </Text>
                  <Text style={styles.koreanBirthMaskDot}>●</Text>
                  <Text style={styles.koreanBirthMaskDot}>●</Text>
                  <Text style={styles.koreanBirthMaskDot}>●</Text>
                  <Text style={styles.koreanBirthMaskDot}>●</Text>
                  <Text style={styles.koreanBirthMaskDot}>●</Text>
                  <Text style={styles.koreanBirthMaskDot}>●</Text>
                </View>
              </Pressable>
            ) : (
              <Pressable style={styles.inputWrap} onPress={() => setBirthPickerOpen(true)}>
                <View style={styles.birthInputInner}>
                  <Text style={[styles.birthInputText, !birthDisplay && styles.birthPlaceholderText]}>
                    {birthDisplay || "Date of Birth"}
                  </Text>
                </View>
              </Pressable>
            )}
            {isKorean && !!koreanBirthError ? (
              <Text style={styles.koreanBirthErrorText}>{koreanBirthError}</Text>
            ) : null}
          </View>
        )}

        {((isKorean && step === 2) || (!isKorean && step === 3)) && (
          <View style={styles.section}>
            <Text style={styles.title}>
              {isKorean ? "몇 시에 감사일기\n작성 알림을 드릴까요?" : "What time would you\nlike us to remind you to write?"}
            </Text>
            <Text style={styles.subtitle}>
              {isKorean
                ? "잊지 않고 감사일기를 작성할 수 있도록 알림을 보내드려요"
                : "Clody will remind you to write your gratitude journal."}
            </Text>
            <Pressable
              style={styles.timeSelector}
              onPress={() => setReminderSheetOpen(true)}
            >
              <Text style={styles.timeSelectorText}>{reminderDisplay}</Text>
              <Ionicons name="chevron-down" size={18} color="#98A2B3" />
            </Pressable>
          </View>
        )}

        {!isKorean && step === 2 && (
          <View style={styles.section}>
            <Text style={styles.title}>How do you identify{"\n"}your gender?</Text>
            <Text style={styles.subtitle}>
              Used to recommend gratitude prompts tailored to you.
            </Text>
            <View style={styles.genderSpacer} />
            <View style={styles.genderList}>
              <Pressable
                style={[
                  styles.genderRow,
                  gender === "female" && englishGenderChosen && styles.genderRowSelected,
                ]}
                onPress={() => {
                  setGender("female");
                  setEnglishGenderChosen(true);
                }}
              >
                <Text
                  style={[
                    styles.genderRowLabel,
                    gender === "female" && englishGenderChosen && styles.genderRowLabelSelected,
                  ]}
                >
                  Female
                </Text>
                {gender === "female" && englishGenderChosen ? (
                  <IcCheckGreen width={22} height={22} />
                ) : (
                  <IcCheckGray width={22} height={22} />
                )}
              </Pressable>
              <Pressable
                style={[
                  styles.genderRow,
                  gender === "male" && englishGenderChosen && styles.genderRowSelected,
                ]}
                onPress={() => {
                  setGender("male");
                  setEnglishGenderChosen(true);
                }}
              >
                <Text
                  style={[
                    styles.genderRowLabel,
                    gender === "male" && englishGenderChosen && styles.genderRowLabelSelected,
                  ]}
                >
                  Male
                </Text>
                {gender === "male" && englishGenderChosen ? (
                  <IcCheckGreen width={22} height={22} />
                ) : (
                  <IcCheckGray width={22} height={22} />
                )}
              </Pressable>
              <Pressable
                style={[
                  styles.genderRow,
                  gender === "none" && englishGenderChosen && styles.genderRowSelected,
                ]}
                onPress={() => {
                  setGender("none");
                  setEnglishGenderChosen(true);
                }}
              >
                <Text
                  style={[
                    styles.genderRowLabel,
                    gender === "none" && englishGenderChosen && styles.genderRowLabelSelected,
                  ]}
                >
                  Specify another
                </Text>
                {gender === "none" && englishGenderChosen ? (
                  <IcCheckGreen width={22} height={22} />
                ) : (
                  <IcCheckGray width={22} height={22} />
                )}
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.bottomWrap}>
          <Pressable
            style={[
              styles.nextButton,
              ((step === 0 && !nicknameValid) ||
                (step === 1 &&
                  (isKorean ? koreanBirthRaw.length !== 7 || !!koreanBirthError : !birthDate)) ||
                (!isKorean && step === 2 && !englishGenderChosen) ||
                submitting)
                ? styles.nextButtonDisabled
                : null,
            ]}
            disabled={
              (step === 0 && !nicknameValid) ||
              (step === 1 &&
                (isKorean ? koreanBirthRaw.length !== 7 || !!koreanBirthError : !birthDate)) ||
              (!isKorean && step === 2 && !englishGenderChosen) ||
              submitting
            }
            onPress={() => {
              void handleNext();
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextText}>{isKorean ? "다음" : "Next"}</Text>
            )}
          </Pressable>
        </View>

        <ReminderTimeBottomSheet
          visible={reminderSheetOpen}
          initialValue={reminderValue}
          onClose={() => setReminderSheetOpen(false)}
          onConfirm={handleReminderConfirm}
          locale={isKorean ? "ko" : "en"}
        />

        <Modal visible={!isKorean && birthPickerOpen} transparent animationType="fade">
          <View style={styles.modalDim}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setBirthPickerOpen(false)}
            />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {isKorean ? "생년월일을 선택해 주세요" : "Please select your date of birth"}
              </Text>
              <BirthPicker
                itemHeight={36}
                initValue={birthPickerValue}
                onTimeChange={handleBirthPickerChange}
              />
              <Pressable
                style={[styles.confirmButton, styles.birthConfirmButton]}
                onPress={handleBirthSave}
              >
                <Text style={styles.confirmText}>{isKorean ? "저장" : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRightPlaceholder: { width: 40 },
  skipWrap: { minWidth: 40, alignItems: "flex-end" },
  skipText: {
    fontFamily: "PretendardSemiBold",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.26,
    color: "#4A4C54",
    textAlign: "right",
  },
  section: { flex: 1, paddingTop: 12 },
  title: {
    fontFamily: "PretendardBold",
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: -0.48,
    color: "#282A31",
    marginTop: 6,
  },
  subtitle: {
    fontFamily: "PretendardRegular",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.26,
    color: "#6B7684",
    marginTop: 8,
    marginBottom: 24,
  },
  inputWrap: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E6EC",
    paddingHorizontal: 14,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    height: "100%",
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    color: "#17181C",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  nicknameInput: {
    fontFamily: "PretendardMedium",
    letterSpacing: -0.05,
    paddingTop: 0,
    paddingBottom: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  inputError: { borderColor: "#FF4D4F" },
  birthInputText: {
    fontFamily: "PretendardMedium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.28,
    color: "#212124",
    includeFontPadding: false,
  },
  birthInputInner: {
    flex: 1,
    justifyContent: "center",
  },
  koreanBirthInput: {
    fontFamily: "PretendardMedium",
    letterSpacing: -0.28,
    fontSize: 14,
    lineHeight: 20,
    color: "#212124",
    includeFontPadding: false,
    paddingTop: 0,
    paddingBottom: 0,
  },
  koreanBirthWrap: {
    justifyContent: "center",
    position: "relative",
  },
  koreanBirthHiddenInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: "100%",
  },
  koreanBirthFront: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 20,
  },
  koreanBirthPlaceholder: {
    fontFamily: "PretendardMedium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.28,
    includeFontPadding: false,
    color: "#8791A0",
  },
  koreanBirthHyphen: {
    fontFamily: "PretendardMedium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.28,
    color: "#8791A0",
    includeFontPadding: false,
  },
  koreanBirthHyphenWrap: {
    position: "absolute",
    left: "50%",
    marginLeft: -12,
    width: 24,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  koreanBirthMaskWrap: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    paddingRight: 2,
  },
  koreanBirthMaskLeadDot: {
    color: "#8A93A2",
    fontSize: 12,
    lineHeight: 16,
  },
  koreanBirthMaskLeadDotFilled: {
    color: "#212124",
  },
  koreanBirthMaskDot: {
    color: "#212124",
    fontSize: 12,
    lineHeight: 16,
  },
  koreanBirthErrorText: {
    marginTop: 8,
    fontFamily: "PretendardRegular",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.24,
    color: "#FF4D4F",
  },
  birthPlaceholderText: {
    fontFamily: "PretendardMedium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.28,
    color: "#8791A0",
  },
  nicknameMetaRow: {
    marginTop: 8,
    minHeight: 22,
    width: "100%",
    position: "relative",
  },
  errorText: {
    fontSize: 13,
    color: "#FF4D4F",
    paddingRight: 56,
  },
  counterText: {
    fontFamily: "PretendardRegular",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.32,
    color: "#757980",
    position: "absolute",
    right: 0,
    top: 0,
    textAlign: "right",
  },
  timeSelector: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4E6EC",
    justifyContent: "center",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  timeSelectorText: { fontSize: 16, color: "#111827", flex: 1 },
  genderSpacer: {
    flex: 1,
  },
  genderList: {
    gap: 10,
    paddingBottom: 8,
  },
  genderRow: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E6EC",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  genderRowSelected: {
    borderColor: "#00974E",
    borderWidth: 1.5,
  },
  genderRowLabel: {
    fontFamily: "PretendardSemiBold",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.32,
    color: "#282A31",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  genderRowLabelSelected: {
    color: "#00974E",
  },
  bottomWrap: { paddingBottom: 24 },
  nextButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#20232A",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonDisabled: { backgroundColor: "#E5E7EB" },
  nextText: {
    fontFamily: "PretendardSemiBold",
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.32,
  },
  modalDim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#20242B", marginBottom: 14 },
  confirmButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#20232A",
    justifyContent: "center",
    alignItems: "center",
  },
  birthConfirmButton: {
    marginTop: 12,
  },
  confirmText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});

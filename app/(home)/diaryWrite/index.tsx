import { DiaryAPI } from "@/api/diaryAPI";
import i18n from "@/app/i18n/i18n";
import { Toast } from "@/shared/components/Toast";
import { isDiaryWritableDate } from "@/shared/utils/diaryDate";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";
import { isAxiosError } from "axios";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddEntryButton } from "./_components/AddEntryButton";
import { ConfirmModal } from "./_components/ConfirmModal";
import { DeleteEntrySheet } from "./_components/DeleteEntrySheet";
import { DiaryEntryInput } from "./_components/DiaryEntryInput";
import { DiaryWriteHeader } from "./_components/DiaryWriteHeader";
import { NoticeBanner } from "./_components/NoticeBanner";
import { MIN_ENTRY_LENGTH } from "./_constants";
import { useDiaryEntries } from "./_hooks/useDiaryEntries";

const NOTICE_DISMISSED_KEY = "diaryWriteNoticeDismissed";
const TOAST_NAVIGATE_DELAY = 1200;

function parseDateParam(dateParam?: string): Date {
  if (dateParam) {
    const [year, month, day] = dateParam.split("-").map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }
  return new Date();
}

export default function DiaryWrite() {
  const { date: dateParam, draft } = useLocalSearchParams<{
    date?: string;
    draft?: string;
  }>();
  const insets = useSafeAreaInsets();
  const isKo = !!i18n.locale?.startsWith("ko");

  const {
    entries,
    canAddEntry,
    addEntry,
    removeEntry,
    updateEntry,
    loadEntries,
    filledEntries,
    isAllEmpty,
  } = useDiaryEntries();

  const [isNoticeVisible, setIsNoticeVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [invalidEntryIds, setInvalidEntryIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 진입 시점 스냅샷 — 변경이 없으면 뒤로가기 시 팝업 없이 나감 (v1 정책)
  const initialTextsRef = useRef(JSON.stringify(["", "", ""]));

  const diaryDate = useMemo(() => parseDateParam(dateParam), [dateParam]);
  const dateKey = useMemo(() => {
    const d = diaryDate;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, [diaryDate]);
  const dateTitle = diaryDate.toLocaleDateString(
    isKo ? "ko-KR" : "en-US",
    isKo
      ? { month: "long", day: "numeric", weekday: "long" }
      : { weekday: "long", month: "long", day: "numeric" },
  );

  useEffect(() => {
    SecureStore.getItemAsync(NOTICE_DISMISSED_KEY).then((dismissed) => {
      if (!dismissed) setIsNoticeVisible(true);
    });
  }, []);

  // 이어쓰기: 임시저장된 일기 프리필
  useEffect(() => {
    if (draft !== "1") return;
    DiaryAPI.getDraft(
      diaryDate.getFullYear(),
      diaryDate.getMonth() + 1,
      diaryDate.getDate(),
    )
      .then(({ draftDiaries }) => {
        loadEntries(draftDiaries);
        initialTextsRef.current = JSON.stringify(
          draftDiaries.length > 0 ? draftDiaries : [""],
        );
      })
      .catch((error) => console.warn("[diaryWrite] 임시저장 불러오기 실패", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(
    () => () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
    },
    [],
  );

  const dismissNotice = () => {
    setIsNoticeVisible(false);
    SecureStore.setItemAsync(NOTICE_DISMISSED_KEY, "true");
  };

  const showRequestError = (error: unknown) => {
    const isNetworkError = isAxiosError(error) && !error.response;
    setToastMessage(
      isNetworkError
        ? isKo
          ? "서비스 접속이 원활하지 않아요."
          : "Couldn't connect to the service."
        : isKo
          ? "일시적인 오류가 발생했어요."
          : "Something went wrong.",
    );
  };

  // 딥링크 등으로 히스토리 없이 진입한 경우 홈으로 폴백
  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/main");
    }
  };

  const showToastThenGoHome = (message: string) => {
    setToastMessage(message);
    navigateTimerRef.current = setTimeout(goHome, TOAST_NAVIGATE_DELAY);
  };

  // 변경사항이 없으면 팝업 없이 바로 나감 (v1 정책)
  const handlePressBack = () => {
    const current = JSON.stringify(entries.map((entry) => entry.text));
    if (current === initialTextsRef.current) {
      goHome();
    } else {
      setIsDraftModalOpen(true);
    }
  };

  // 안드로이드 하드웨어 백버튼도 임시저장 팝업을 거치도록 (스와이프 백은 gestureEnabled로 차단)
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handlePressBack();
      return true;
    });
    return () => sub.remove();
  });

  // 임시저장: 빈 리스트 포함 그대로 저장
  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    setIsDraftModalOpen(false);
    setIsSubmitting(true);
    try {
      await DiaryAPI.saveDraft(
        dateKey,
        entries.map((entry) => entry.text),
      );
      showToastThenGoHome(
        isKo ? "임시저장이 완료됐어요." : "Your draft has been saved.",
      );
    } catch (error) {
      console.warn("[diaryWrite] 임시저장 실패", error);
      showRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitWithoutSaving = () => {
    setIsDraftModalOpen(false);
    goHome();
  };

  const handlePressSend = () => {
    if (isAllEmpty) {
      setToastMessage(
        isKo
          ? "빈 칸을 채워야 보낼 수 있어요."
          : "Fill in the blanks before sending.",
      );
      return;
    }
    const underMinIds = entries
      .filter((entry) => {
        const length = entry.text.trim().length;
        return length > 0 && length < MIN_ENTRY_LENGTH;
      })
      .map((entry) => entry.id);
    setInvalidEntryIds(underMinIds);
    if (underMinIds.length > 0) return;

    setIsSendModalOpen(true);
  };

  // 보내기: 빈 리스트는 삭제하고 작성된 리스트 순서를 당겨서 전송
  const handleConfirmSend = async () => {
    if (isSubmitting) return;
    setIsSendModalOpen(false);
    setIsSubmitting(true);
    try {
      const result = await DiaryAPI.postDiary(
        dateKey,
        filledEntries.map((entry) => entry.text),
      );
      if (result.replyType === "DELETED" || !isDiaryWritableDate(diaryDate)) {
        goHome();
        return;
      }
      // TODO: 답장 대기 화면으로 이동 (미구현 — 우선 홈으로)
      goHome();
    } catch (error) {
      console.warn("[diaryWrite] 보내기 실패", error);
      showRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = () => {
    if (deleteTargetId) removeEntry(deleteTargetId);
    setDeleteTargetId(null);
  };

  // 루트 SafeAreaView가 bottom 인셋을 이미 적용하므로 키보드 높이에서 제외
  const addButtonBottom = keyboardVisible
    ? (Platform.OS === "ios" ? Math.max(keyboardHeight - insets.bottom, 0) : 0) +
      12
    : 20;

  return (
    // 상단 인셋은 루트 _layout의 SafeAreaView가 처리하므로 여기서 더하지 않음
    <View style={styles.container}>
      {/* iOS 스와이프 백이 임시저장 팝업을 우회하지 않도록 차단 */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <DiaryWriteHeader
        isKo={isKo}
        onPressBack={handlePressBack}
        onPressSaveDraft={handleSaveDraft}
        onPressSend={handlePressSend}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Typo.Display
            variant="display2"
            color="gray1000"
            style={styles.title}
          >
            {dateTitle}
          </Typo.Display>

          {isNoticeVisible && (
            <View style={styles.bannerWrap}>
              <NoticeBanner isKo={isKo} onDismiss={dismissNotice} />
            </View>
          )}

          <View style={styles.entryList}>
            {entries.map((entry, index) => (
              <DiaryEntryInput
                key={entry.id}
                index={index}
                value={entry.text}
                isKo={isKo}
                invalid={invalidEntryIds.includes(entry.id)}
                onChangeText={(text) => {
                  updateEntry(entry.id, text);
                  if (invalidEntryIds.includes(entry.id)) {
                    setInvalidEntryIds((prev) =>
                      prev.filter((id) => id !== entry.id),
                    );
                  }
                }}
                onPressMore={() => setDeleteTargetId(entry.id)}
              />
            ))}
          </View>
        </ScrollView>

        <AddEntryButton
          isKo={isKo}
          compact={keyboardVisible}
          disabled={!canAddEntry}
          onPress={addEntry}
          style={{
            position: "absolute",
            right: 20,
            bottom: addButtonBottom,
          }}
        />
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={isSendModalOpen}
        title={isKo ? "일기를 로디에게 보낼까요?" : "Send your diary to Rody?"}
        description={
          isKo
            ? "보낸 일기는 수정이 어려워요."
            : "Sent diaries can't be edited."
        }
        cancelLabel={isKo ? "취소" : "Cancel"}
        confirmLabel={isKo ? "보내기" : "Send"}
        confirmVariant="green"
        onCancel={() => setIsSendModalOpen(false)}
        onConfirm={handleConfirmSend}
      />

      <ConfirmModal
        visible={isDraftModalOpen}
        title={
          isKo
            ? "지금까지 쓴 일기를 임시저장할까요?"
            : "Save your diary as a draft?"
        }
        description={
          isKo
            ? "나가기를 누르면 작성 중인 내용이 모두 사라져요."
            : "If you leave, everything you wrote will be lost."
        }
        cancelLabel={isKo ? "나가기" : "Leave"}
        confirmLabel={isKo ? "임시저장" : "Save draft"}
        confirmVariant="dark"
        onCancel={handleExitWithoutSaving}
        onConfirm={handleSaveDraft}
      />

      <DeleteEntrySheet
        visible={deleteTargetId !== null}
        isKo={isKo}
        onDelete={handleDeleteEntry}
        onClose={() => setDeleteTargetId(null)}
      />

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={palette.gray400} />
        </View>
      )}

      <Toast
        message={toastMessage ?? ""}
        visible={toastMessage !== null}
        onHide={() => setToastMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.gray0,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  title: {
    marginTop: 4,
  },
  bannerWrap: {
    marginTop: 14,
  },
  entryList: {
    marginTop: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
});

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
import { AdTooltip } from "./_components/AdTooltip";
import { ConfirmModal } from "./_components/ConfirmModal";
import { DeleteEntrySheet } from "./_components/DeleteEntrySheet";
import { DiaryEntryInput } from "./_components/DiaryEntryInput";
import { DiaryWriteHeader } from "./_components/DiaryWriteHeader";
import { DraggableEntryList } from "./_components/DraggableEntryList";
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
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const insets = useSafeAreaInsets();
  const isKo = !!i18n.locale?.startsWith("ko");

  const {
    entries,
    canAddEntry,
    addEntry,
    removeEntry,
    moveEntry,
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
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "warning";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
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

  // 진입 시 임시저장 조회 — 내용이 있으면 프리필 (없거나 실패하면 빈 칸 유지)
  useEffect(() => {
    DiaryAPI.getDraft(
      diaryDate.getFullYear(),
      diaryDate.getMonth() + 1,
      diaryDate.getDate(),
    )
      .then(({ draftDiaries }) => {
        if (draftDiaries.length === 0) return;
        loadEntries(draftDiaries);
        initialTextsRef.current = JSON.stringify(draftDiaries);
      })
      .catch((error) => console.warn("[diaryWrite] 임시저장 불러오기 실패", error))
      .finally(() => setIsLoadingDraft(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

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
    setToast({
      message: isNetworkError
        ? i18n.t("diaryWrite.toast.networkError")
        : i18n.t("diaryWrite.toast.genericError"),
      variant: "warning",
    });
  };

  // 딥링크 등으로 히스토리 없이 진입한 경우 홈으로 폴백
  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(home)/(tabs)/main");
    }
  };

  const showToastThenGoHome = (message: string) => {
    setToast({ message, variant: "success" });
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
      showToastThenGoHome(i18n.t("diaryWrite.toast.draftSaved"));
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
      setToast({
        message: i18n.t("diaryWrite.toast.emptyEntry"),
        variant: "warning",
      });
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
      router.replace({
        pathname: "/(home)/reply/[date]",
        params: { date: dateKey, status: "UNREADY", source: "diaryWrite" },
      });
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
          scrollEnabled={!isReordering}
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
              <NoticeBanner onDismiss={dismissNotice} />
            </View>
          )}

          <View style={styles.entryList}>
            <DraggableEntryList
              ids={entries.map((entry) => entry.id)}
              onMove={moveEntry}
              onDragStateChange={setIsReordering}
              renderEntry={(index) => {
                const entry = entries[index];
                return (
                  <DiaryEntryInput
                    index={index}
                    value={entry.text}
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
                );
              }}
            />
          </View>
        </ScrollView>

        <View
          style={[styles.addButtonWrap, { bottom: addButtonBottom }]}
          pointerEvents="box-none"
        >
          {!canAddEntry && <AdTooltip style={styles.adTooltip} />}
          <AddEntryButton
            compact={keyboardVisible}
            disabled={!canAddEntry}
            onPress={addEntry}
          />
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={isSendModalOpen}
        title={i18n.t("diaryWrite.sendPopup.title")}
        description={i18n.t("diaryWrite.sendPopup.description")}
        cancelLabel={i18n.t("diaryWrite.sendPopup.cancel")}
        confirmLabel={i18n.t("diaryWrite.sendPopup.confirm")}
        confirmVariant="green"
        onCancel={() => setIsSendModalOpen(false)}
        onConfirm={handleConfirmSend}
      />

      <ConfirmModal
        visible={isDraftModalOpen}
        title={i18n.t("diaryWrite.draftPopup.title")}
        description={i18n.t("diaryWrite.draftPopup.description")}
        cancelLabel={i18n.t("diaryWrite.draftPopup.cancel")}
        confirmLabel={i18n.t("diaryWrite.draftPopup.confirm")}
        confirmVariant="dark"
        onCancel={handleExitWithoutSaving}
        onConfirm={handleSaveDraft}
      />

      <DeleteEntrySheet
        visible={deleteTargetId !== null}
        onDelete={handleDeleteEntry}
        onClose={() => setDeleteTargetId(null)}
      />

      {(isSubmitting || isLoadingDraft) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={palette.gray400} />
        </View>
      )}

      <Toast
        message={toast?.message ?? ""}
        visible={toast !== null}
        variant={toast?.variant}
        onHide={() => setToast(null)}
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
  addButtonWrap: {
    position: "absolute",
    right: 20,
    alignItems: "center",
  },
  adTooltip: {
    marginBottom: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
});

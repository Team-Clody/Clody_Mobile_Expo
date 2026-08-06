import i18n from "@/app/i18n/i18n";
import { Toast } from "@/shared/components/Toast";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import {
  MIN_ENTRY_LENGTH,
  NOTICE_BANNER_DISMISSED_KEY,
  SCREEN_HORIZONTAL_PADDING,
} from "./_constants";
import { useDiaryEntries } from "./_hooks/useDiaryEntries";

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
    updateEntry,
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
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const diaryDate = useMemo(() => parseDateParam(dateParam), [dateParam]);
  const dateTitle = diaryDate.toLocaleDateString(
    isKo ? "ko-KR" : "en-US",
    isKo
      ? { month: "long", day: "numeric", weekday: "long" }
      : { weekday: "long", month: "long", day: "numeric" },
  );

  useEffect(() => {
    SecureStore.getItemAsync(NOTICE_BANNER_DISMISSED_KEY).then((dismissed) => {
      if (!dismissed) setIsNoticeVisible(true);
    });
  }, []);

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
    SecureStore.setItemAsync(NOTICE_BANNER_DISMISSED_KEY, "true");
  };

  const showToastThenGoHome = (message: string) => {
    setToastMessage(message);
    navigateTimerRef.current = setTimeout(() => {
      router.back();
    }, TOAST_NAVIGATE_DELAY);
  };

  // 임시저장: 빈 리스트 포함 그대로 저장
  const handleSaveDraft = () => {
    setIsDraftModalOpen(false);
    // TODO: 임시저장 API 연결
    console.log("[diaryWrite] 임시저장", {
      date: dateParam,
      contents: entries.map((entry) => entry.text),
    });
    showToastThenGoHome(
      isKo ? "임시저장이 완료됐어요." : "Your draft has been saved.",
    );
  };

  const handleExitWithoutSaving = () => {
    setIsDraftModalOpen(false);
    router.back();
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
  const handleConfirmSend = () => {
    setIsSendModalOpen(false);
    // TODO: 일기 전송 API 연결 + 답장 대기 화면으로 이동
    console.log("[diaryWrite] 보내기", {
      date: dateParam,
      contents: filledEntries.map((entry) => entry.text),
    });
    router.back();
  };

  const handleDeleteEntry = () => {
    if (deleteTargetId) removeEntry(deleteTargetId);
    setDeleteTargetId(null);
  };

  const addButtonBottom = keyboardVisible
    ? (Platform.OS === "ios" ? keyboardHeight : 0) + 12
    : insets.bottom + 20;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <DiaryWriteHeader
        isKo={isKo}
        onPressBack={() => setIsDraftModalOpen(true)}
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
            right: SCREEN_HORIZONTAL_PADDING,
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
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
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
});

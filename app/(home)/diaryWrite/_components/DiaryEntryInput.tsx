import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { MIN_ENTRY_LENGTH } from "../_constants";

type DiaryEntryInputProps = {
  index: number;
  value: string;
  // 보내기 시도 시 2자 미만으로 걸러진 항목 표시용
  invalid: boolean;
  // 드래그 중 그림자 표시용 (iOS는 DraggableRow의 레이어 그림자를 사용)
  dragging?: boolean;
  onChangeText: (text: string) => void;
  onPressMore: () => void;
};

export function DiaryEntryInput({
  index,
  value,
  invalid,
  dragging,
  onChangeText,
  onPressMore,
}: DiaryEntryInputProps) {
  const isKo = !!i18n.locale?.startsWith("ko");
  const [isFocused, setIsFocused] = useState(false);
  // 2자 미만 에러는 endEditing(blur) 시점에 검사해서 노출
  const [isUnderMin, setIsUnderMin] = useState(false);

  // v1 정책: 한글 50자 / 영문 100자 (공백·개행 포함)
  const maxLength = isKo ? 50 : 100;
  const isMaxReached = value.length >= maxLength;
  const hasError = isMaxReached || invalid || isUnderMin;

  const checkUnderMin = (text: string) => {
    const length = text.trim().length;
    return length > 0 && length < MIN_ENTRY_LENGTH;
  };

  const borderColor = hasError
    ? palette.red500
    : isFocused
      ? "#00D15A" // 디자인 포커스 그린 (광고 툴팁 강조색과 동일)
      : palette.gray100;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrap,
          { borderColor },
          Platform.OS === "android" && dragging && styles.inputWrapDragging,
        ]}
      >
        <Typo.Body
          variant="body11"
          color={value.length > 0 ? "gray1000" : "gray300"}
          style={styles.numberLabel}
        >
          {index + 1}.
        </Typo.Body>
        <TextInput
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            // 에러 노출 중에는 2자 이상 입력 시 즉시 해제
            if (isUnderMin && !checkUnderMin(text)) setIsUnderMin(false);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setIsUnderMin(checkUnderMin(value));
          }}
          placeholder={i18n.t("diaryWrite.entryPlaceholder")}
          placeholderTextColor={palette.gray300}
          maxLength={maxLength}
          multiline
          autoCapitalize="none"
          spellCheck={false}
          style={styles.input}
        />
        <Pressable
          onPress={onPressMore}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("diaryWrite.more")}
          style={styles.moreButton}
        >
          <Icon.IcKebob width={24} height={24} />
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <Typo.Caption
          variant="caption3"
          color="red500"
          style={!hasError && styles.hidden}
        >
          {i18n.t("diaryWrite.entryLengthError", {
            min: MIN_ENTRY_LENGTH,
            max: maxLength,
          })}
        </Typo.Caption>
        <View style={styles.counterRow}>
          <Typo.Body variant="body12" lineHeight={1.5} color="gray400">
            {value.length}
          </Typo.Body>
          <Typo.Body variant="body12" lineHeight={1.5} color="gray200">
            {` / ${maxLength}`}
          </Typo.Body>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: palette.gray0,
    minHeight: 48,
    padding: 12,
  },
  // 안드로이드 elevation은 투명한 row 래퍼에 사각 그림자를 만들어 흰 입력칸에 직접 적용
  inputWrapDragging: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 6,
        blurRadius: 12,
        color: "rgba(0, 0, 0, 0.14)",
      },
    ],
  },
  numberLabel: {
    marginRight: 4,
    paddingTop: 1,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: "PretendardMedium",
    fontSize: 13,
    lineHeight: 18,
    color: palette.gray1000,
    textAlignVertical: "top",
  },
  moreButton: {
    marginLeft: 8,
    alignSelf: "center",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    paddingHorizontal: 2,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hidden: {
    opacity: 0,
  },
});

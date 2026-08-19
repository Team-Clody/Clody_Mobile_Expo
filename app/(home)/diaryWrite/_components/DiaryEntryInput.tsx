import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";
import { MIN_ENTRY_LENGTH } from "../_constants";

type DiaryEntryInputProps = {
  index: number;
  value: string;
  // 보내기 시도 시 2자 미만으로 걸러진 항목 표시용
  invalid: boolean;
  onChangeText: (text: string) => void;
  onPressMore: () => void;
};

export function DiaryEntryInput({
  index,
  value,
  invalid,
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
      ? palette.accentPrimary500
      : palette.gray100;

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrap, { borderColor }]}>
        <Typo.Body
          variant="body9"
          color={value.length > 0 ? "gray800" : "gray300"}
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
          <Icon.IcKebob width={16} height={16} />
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
          <Typo.Caption variant="caption3" color="gray600">
            {value.length}
          </Typo.Caption>
          <Typo.Caption variant="caption3" color="gray300">
            {` / ${maxLength}`}
          </Typo.Caption>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: palette.gray0,
    paddingHorizontal: 14,
    paddingVertical: 13,
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
    fontSize: 15,
    lineHeight: 20,
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
    marginTop: 5,
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

import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/shared/components/Icon";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";
import { MAX_ENTRY_LENGTH, MIN_ENTRY_LENGTH } from "../_constants";

type DiaryEntryInputProps = {
  index: number;
  value: string;
  isKo: boolean;
  // 보내기 시도 시 2자 미만으로 걸러진 항목 표시용
  invalid: boolean;
  onChangeText: (text: string) => void;
  onPressMore: () => void;
};

export function DiaryEntryInput({
  index,
  value,
  isKo,
  invalid,
  onChangeText,
  onPressMore,
}: DiaryEntryInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const isMaxReached = value.length >= MAX_ENTRY_LENGTH;
  const hasError = isMaxReached || invalid;

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
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            isKo
              ? "일상 속 작은 감사함을 적어보세요."
              : "Write a small gratitude from your day."
          }
          placeholderTextColor={palette.gray300}
          maxLength={MAX_ENTRY_LENGTH}
          multiline
          style={styles.input}
        />
        <Pressable
          onPress={onPressMore}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isKo ? "더보기" : "More options"}
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
          {isKo
            ? `${MIN_ENTRY_LENGTH}~${MAX_ENTRY_LENGTH}자까지 입력할 수 있어요.`
            : `You can enter ${MIN_ENTRY_LENGTH}–${MAX_ENTRY_LENGTH} characters.`}
        </Typo.Caption>
        <View style={styles.counterRow}>
          <Typo.Caption
            variant="caption3"
            color={hasError ? "red500" : "gray600"}
          >
            {value.length}
          </Typo.Caption>
          <Typo.Caption
            variant="caption3"
            color={hasError ? "red500" : "gray300"}
            style={hasError && styles.counterMaxError}
          >
            {` / ${MAX_ENTRY_LENGTH}`}
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
  counterMaxError: {
    opacity: 0.4,
  },
  hidden: {
    opacity: 0,
  },
});

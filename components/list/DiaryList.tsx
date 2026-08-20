import type {
  DiaryItem,
  ReplyStatus,
} from "@/api/dto/list/response/getCalendarListResponseDTO";
import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { HStack } from "@/shared/components/stack/HStack";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";
import { isKoreanLocale } from "@/shared/utils/locale";
import React, { useMemo } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import type { SvgProps } from "react-native-svg";
import { PromptHeader } from "./PromptHeader";

const DAY_NAMES = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
} as const;

function getCloverIcon(
  replyStatus: ReplyStatus,
  diaryCount: number,
  isDeleted: boolean,
): React.FC<SvgProps> {
  if (isDeleted) return Icon.IcCloverNone;

  switch (replyStatus) {
    case "READY_NOT_READ":
      return Icon.IcCloverUnread;
    case "HAS_DRAFT":
      return Icon.IcCloverIng;
    case "INVALID_DRAFT":
      return Icon.IcCloverNot;
    case "READY_READ":
      if (diaryCount >= 5) return Icon.IcCloverFull;
      if (diaryCount >= 3) return Icon.IcCloverMedium;
      return Icon.IcCloverLow;
    case "UNREADY":
    default:
      return Icon.IcCloverNone;
  }
}

function getDateParts(date: string, isKo: boolean) {
  const dateObject = new Date(`${date}T00:00:00`);
  return {
    dayNumber: dateObject.getDate(),
    weekday: DAY_NAMES[isKo ? "ko" : "en"][dateObject.getDay()],
  };
}

interface DiarySectionProps {
  diary: DiaryItem;
  isKo: boolean;
  onPressReply?: (date: string) => void;
  onPressMore?: (date: string) => void;
}

function DiarySection({
  diary,
  isKo,
  onPressReply,
  onPressMore,
}: DiarySectionProps) {
  const { dayNumber, weekday } = getDateParts(diary.date, isKo);
  const CloverIcon = getCloverIcon(
    diary.replyStatus,
    diary.diaryCount,
    diary.isDeleted,
  );

  return (
    <View style={styles.section}>
      <HStack style={styles.sectionHeader}>
        <HStack alignment={4} style={styles.dateGroup}>
          <View style={styles.cloverContainer}>
            <CloverIcon width={16.47} height={16.47} />
          </View>
          <HStack alignment={4} style={styles.dateTextGroup}>
            <Typo.Body variant="body3" color="gray500">
              {dayNumber}
            </Typo.Body>
            <Typo.Body variant="body3" color="gray500">
              {weekday}
            </Typo.Body>
          </HStack>
        </HStack>

        <HStack alignment={4} style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18n.t("list.reply")}
            accessibilityState={{ disabled: !onPressReply }}
            disabled={!onPressReply}
            hitSlop={4}
            onPress={() => onPressReply?.(diary.date)}
            style={styles.replyButton}
          >
            <Typo.Body variant="body5" color="gray600">
              {i18n.t("list.reply")}
            </Typo.Body>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18n.t("list.more")}
            accessibilityState={{ disabled: !onPressMore }}
            disabled={!onPressMore}
            hitSlop={4}
            onPress={() => onPressMore?.(diary.date)}
            style={styles.moreButton}
          >
            <Icon.IcKebob width={24} height={24} />
          </Pressable>
        </HStack>
      </HStack>

      <View style={styles.entries}>
        {diary.diary.map((entry, index) => (
          <HStack
            key={`${diary.date}-${index}`}
            style={[
              styles.entry,
              index < diary.diary.length - 1 && styles.entrySpacing,
            ]}
          >
            <Typo.Body variant="body10" color="gray900" style={styles.index}>
              {index + 1}.
            </Typo.Body>
            <Typo.Body variant="body10" color="gray900" style={styles.content}>
              {entry.content}
            </Typo.Body>
          </HStack>
        ))}
      </View>
    </View>
  );
}

interface DiaryListProps {
  diaries: DiaryItem[];
  prompt?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPressWrite?: () => void;
  onPressReply?: (date: string) => void;
  onPressMore?: (date: string) => void;
}

export function DiaryList({
  diaries,
  prompt,
  refreshing = false,
  onRefresh,
  onPressWrite,
  onPressReply,
  onPressMore,
}: DiaryListProps) {
  const isKo = isKoreanLocale();
  const orderedDiaries = useMemo(
    () => [...diaries].sort((a, b) => a.date.localeCompare(b.date)),
    [diaries],
  );

  return (
    <FlatList
      data={orderedDiaries}
      keyExtractor={(diary) => diary.date}
      renderItem={({ item }) => (
        <DiarySection
          diary={item}
          isKo={isKo}
          onPressReply={onPressReply}
          onPressMore={onPressMore}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      ListHeaderComponent={
        <PromptHeader prompt={prompt} onPressWrite={onPressWrite} />
      }
      ListHeaderComponentStyle={styles.listHeader}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.accentPrimary500}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 32,
  },
  listHeader: {
    marginBottom: 16,
  },
  section: {
    marginHorizontal: 20,
  },
  sectionHeader: {
    height: 28,
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateGroup: {
    gap: 8,
  },
  dateTextGroup: {
    gap: 4,
  },
  cloverContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.gray50,
  },
  controls: {
    gap: 10,
  },
  replyButton: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.gray50,
  },
  moreButton: {
    width: 24,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  entries: {
    marginTop: 12,
  },
  entry: {
    alignItems: "flex-start",
    gap: 8,
  },
  entrySpacing: {
    marginBottom: 10,
  },
  index: {
    width: 14,
    textAlign: "right",
  },
  content: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: "#EEEEEE",
  },
});

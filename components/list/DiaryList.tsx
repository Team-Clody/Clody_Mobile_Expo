import {
  DiaryItem,
  ReplyStatus,
} from "@/api/dto/list/response/getCalendarListResponseDTO";
import { Icon } from "@/shared/components/Icon";
import { HStack } from "@/shared/components/stack/HStack";
import { VStack } from "@/shared/components/stack/VStack";
import { Typo } from "@/shared/components/typo/Typo";
import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SvgProps } from "react-native-svg";
import { PromptHeader } from "./PromptHeader";

type ListHeaderItem = {
  type: "header";
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  replyStatus: ReplyStatus;
  diaryCount: number;
  isDeleted: boolean;
};
type ListDiaryContentItem = {
  type: "content";
  index: number;
  content: string;
  dateKey: string;
};
type ListDividerItem = {
  type: "divider";
  dateKey: string;
};
type ListItem = ListHeaderItem | ListDiaryContentItem | ListDividerItem;

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function buildFlatListData(diaries: DiaryItem[]): ListItem[] {
  const items: ListItem[] = [];
  for (let i = 0; i < diaries.length; i++) {
    const diary = diaries[i];
    const dateObj = new Date(diary.date + "T00:00:00");
    const dayOfWeek = DAY_NAMES[dateObj.getDay()];
    const dayNumber = dateObj.getDate();

    items.push({
      type: "header",
      date: diary.date,
      dayNumber,
      dayOfWeek: `${dayOfWeek}요일`,
      replyStatus: diary.replyStatus,
      diaryCount: diary.diaryCount,
      isDeleted: diary.isDeleted,
    });

    diary.diary.forEach((entry, idx) => {
      items.push({
        type: "content",
        index: idx + 1,
        content: entry.content,
        dateKey: diary.date,
      });
    });

    if (i < diaries.length - 1) {
      items.push({ type: "divider", dateKey: diary.date });
    }
  }
  return items;
}

function getCloverIcon(
  replyStatus: ReplyStatus,
  diaryCount: number,
  isDeleted: boolean,
): React.FC<SvgProps> {
  if (isDeleted) return Icon.IcCloverNone;

  switch (replyStatus) {
    case "UNREADY":
      return Icon.IcCloverNone;
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
    default:
      return Icon.IcCloverNone;
  }
}

function renderListItem({ item }: { item: ListItem }) {
  if (item.type === "divider") {
    return <View style={styles.divider} />;
  }

  if (item.type === "header") {
    return (
      <HStack
        style={{
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 15,
        }}
      >
        <HStack alignment={4} style={{ gap: 7 }}>
          <View style={styles.dayIconContainer}>
            {React.createElement(
              getCloverIcon(item.replyStatus, item.diaryCount, item.isDeleted),
              { width: 24, height: 24 },
            )}
            <View style={styles.dayNumberOverlay}>
              <Typo.Body variant="body12" style={{ color: "#FFFFFF" }}>
                {item.dayNumber}
              </Typo.Body>
            </View>
          </View>
          <Typo.Body variant="body5" style={{ color: "#6B7684" }}>
            {item.dayOfWeek}
          </Typo.Body>
        </HStack>

        <HStack style={{ gap: 8 }}>
          <Pressable
            onPress={() => alert("답장확인")}
            style={styles.replyButton}
          >
            <Typo.Body variant="body12" style={{ color: "#4A4C54" }}>
              답장확인
            </Typo.Body>
          </Pressable>
          <Pressable onPress={() => alert("더보기")}>
            <Image
              source={require("@/assets/images/ic_more_vertical.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>
        </HStack>
      </HStack>
    );
  }

  return (
    <HStack
      style={{ paddingHorizontal: 20, gap: 10, alignItems: "flex-start" }}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{item.index}</Text>
      </View>
      <VStack style={{ flex: 1, paddingBottom: 10 }}>
        <Typo.Body variant="body10" style={{ color: "#212124" }}>
          {item.content}
        </Typo.Body>
      </VStack>
    </HStack>
  );
}

interface DiaryListProps {
  diaries: DiaryItem[];
  prompt?: string;
}

export function DiaryList({ diaries, prompt }: DiaryListProps) {
  const flatListData = buildFlatListData(diaries);

  return (
    <FlatList
      data={flatListData}
      keyExtractor={(item, index) => {
        if (item.type === "header") return `header-${item.date}`;
        if (item.type === "divider") return `divider-${item.dateKey}`;
        return `content-${item.dateKey}-${item.index}`;
      }}
      renderItem={renderListItem}
      ListHeaderComponent={<PromptHeader prompt={prompt} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}

const styles = StyleSheet.create({
  dayIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumberOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  replyButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    height: 24,
    backgroundColor: "#F2F3F6",
    borderRadius: 5,
  },
  numberBadge: {
    width: 16,
    height: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  numberText: {
    fontFamily: "PretendardSemiBold",
    fontWeight: "600",
    fontSize: 10.67,
    lineHeight: 14.93,
    letterSpacing: -0.21,
    color: "#565F6B",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 20,
    marginTop: 14,
  },
});

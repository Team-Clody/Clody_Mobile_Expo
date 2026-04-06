import { DiaryItem } from "@/api/dto/list/response/getCalendarListResponseDTO";
import { Icon } from "@/shared/components/Icon";
import { Typo } from "@/shared/components/typo/Typo";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { PromptHeader } from "./PromptHeader";

type ListHeaderItem = {
  type: "header";
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  replyStatus: string;
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
      items.push({
        type: "divider",
        dateKey: diary.date,
      });
    }
  }
  return items;
}

function renderListItem({ item }: { item: ListItem }) {
  if (item.type === "divider") {
    return <View style={styles.divider} />;
  }

  if (item.type === "header") {
    return (
      <View style={styles.dateHeaderContainer}>
        <View style={styles.headerLeft}>
          <View style={styles.dayIconContainer}>
            <Icon.IcClover width={24} height={24} />
            <View style={styles.dayNumberOverlay}>
              <Typo.Body variant="body12" style={{ color: "#FFFFFF" }}>
                {item.dayNumber}
              </Typo.Body>
            </View>
          </View>
          <Typo.Body variant="body5" style={{ color: "#6B7684" }}>
            {item.dayOfWeek}
          </Typo.Body>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => alert("답장확인")}
            style={styles.replyButton}
          >
            <Typo.Body variant="body12" style={{ color: "#4A4C54" }}>
              답장확인
            </Typo.Body>
          </Pressable>

          <Pressable onPress={() => alert("더보기")} style={styles.moreButton}>
            <Text style={styles.moreButtonText}>⋮</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.contentRow}>
      <View style={styles.contentNumberContainer}>
        <Text style={styles.contentNumberText}>{item.index}</Text>
      </View>
      <View style={styles.contentTextContainer}>
        <Typo.Body variant="body10" style={{ color: "#212124" }}>
          {item.content}
        </Typo.Body>
      </View>
    </View>
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
  dateHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    height: 24,
    backgroundColor: "#F2F3F6",
    borderRadius: 5,
  },
  moreButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  moreButtonText: {
    fontSize: 18,
    color: "#8791A0",
    lineHeight: 24,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    gap: 10,
  },
  contentNumberContainer: {
    width: 16,
    height: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  contentNumberText: {
    fontFamily: "PretendardSemiBold",
    fontWeight: "600",
    fontSize: 10.67,
    lineHeight: 14.93,
    letterSpacing: -0.21,
    color: "#565F6B",
    textAlign: "center",
  },
  contentTextContainer: {
    flex: 1,
    paddingBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 20,
    marginTop: 14,
  },
});

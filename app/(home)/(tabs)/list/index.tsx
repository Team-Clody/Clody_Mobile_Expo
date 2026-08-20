import type { DiaryItem } from "@/api/dto/list/response/getCalendarListResponseDTO";
import { ListAPI } from "@/api/listAPI";
import { DiaryList } from "@/components/list/DiaryList";
import { Icon } from "@/shared/components/Icon";
import {
  MonthPickerBottomSheet,
  type MonthPickerValue,
} from "@/shared/components/MonthPickerBottomSheet";
import { HStack } from "@/shared/components/stack/HStack";
import { Typo } from "@/shared/components/typo/Typo";
import { useJournalPrompt } from "@/shared/hooks/useJournalPrompt";
import { palette } from "@/shared/theme/palette";
import { isKoreanLocale } from "@/shared/utils/locale";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

function formatMonthTitle(year: number, month: number, isKo: boolean) {
  if (isKo) return `${year}년 ${month}월`;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, 1));
}

export default function ListScreen() {
  const router = useRouter();
  const todayRef = useRef(new Date());
  const requestIdRef = useRef(0);
  const isKo = isKoreanLocale();
  const today = todayRef.current;

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [prompt, setPrompt] = useState("");
  useJournalPrompt(today, setPrompt);

  const fetchCalendarList = useCallback(async (year: number, month: number) => {
    const requestId = ++requestIdRef.current;
    try {
      const data = await ListAPI.getCalendarList(year, month);
      if (requestId === requestIdRef.current) {
        setDiaries(data.diaries ?? []);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) setDiaries([]);
      console.warn("[list] calendar list request failed", error);
    }
  }, []);

  useEffect(() => {
    void fetchCalendarList(selectedYear, selectedMonth);
  }, [fetchCalendarList, selectedMonth, selectedYear]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCalendarList(selectedYear, selectedMonth);
    setIsRefreshing(false);
  }, [fetchCalendarList, selectedMonth, selectedYear]);

  const handleMonthConfirm = (value: MonthPickerValue) => {
    setSelectedYear(value.year);
    setSelectedMonth(value.month);
    setIsMonthPickerVisible(false);
  };

  const handlePressWrite = () => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");
    router.push({
      pathname: "/(home)/diaryWrite",
      params: { date: `${year}-${month}-${date}` },
    });
  };

  const handlePressReply = (date: string) => {
    router.push({ pathname: "/(home)/reply/[date]", params: { date } });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={formatMonthTitle(
            selectedYear,
            selectedMonth,
            isKo,
          )}
          hitSlop={8}
          onPress={() => setIsMonthPickerVisible(true)}
        >
          <HStack alignment={4} style={styles.monthTitle}>
            <Typo.Head variant="head1" color="gray800">
              {formatMonthTitle(selectedYear, selectedMonth, isKo)}
            </Typo.Head>
            <Icon.IcDropdown width={24} height={24} />
          </HStack>
        </Pressable>
      </View>

      <DiaryList
        diaries={diaries}
        prompt={prompt}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onPressWrite={handlePressWrite}
        onPressReply={handlePressReply}
      />

      <MonthPickerBottomSheet
        visible={isMonthPickerVisible}
        initialValue={{ year: selectedYear, month: selectedMonth }}
        onConfirm={handleMonthConfirm}
        onClose={() => setIsMonthPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.gray0,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  monthTitle: {
    gap: 4,
  },
});

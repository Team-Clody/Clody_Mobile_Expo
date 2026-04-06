import { DiaryItem } from "@/api/dto/list/response/getCalendarListResponseDTO";
import { ListAPI } from "@/api/listAPI";
import { DiaryList } from "@/components/list/DiaryList";
import { Icon } from "@/shared/components/Icon";
import {
  MonthPickerBottomSheet,
  MonthPickerValue,
} from "@/shared/components/MonthPickerBottomSheet";
import { HStack } from "@/shared/components/stack/HStack";
import { Typo } from "@/shared/components/typo/Typo";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_DIARIES: DiaryItem[] = [
  {
    diaryCount: 3,
    replyStatus: "READY_READ",
    date: "2026-04-03",
    diary: [
      {
        content:
          "친구들이 나랑 놀아줘서 감사해 친구들이 나랑 클로디를 만들 수 있어서 감사해",
      },
      { content: "클로디를 만들 수 있어서 감사해" },
      { content: "건강한 식사를 할 수 있어 감사해" },
    ],
    isDeleted: false,
  },
  {
    diaryCount: 3,
    replyStatus: "READY_NOT_READ",
    date: "2026-04-04",
    diary: [
      {
        content:
          "친구들이 나랑 놀아줘서 감사해 친구들이 나랑 클로디를 만들 수 있어서 감사해",
      },
      { content: "클로디를 만들 수 있어서 감사해" },
      { content: "건강한 식사를 할 수 있어 감사해" },
    ],
    isDeleted: false,
  },
  {
    diaryCount: 1,
    replyStatus: "UNREADY",
    date: "2026-04-05",
    diary: [{ content: "좋은 날씨에 감사했다" }],
    isDeleted: false,
  },
];

export default function ListScreen() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [diaries, setDiaries] = useState<DiaryItem[]>(MOCK_DIARIES);
  const [prompt, setPrompt] = useState("");

  const fetchCalendarList = async (year: number, month: number) => {
    console.log("[ListScreen] fetchCalendarList params:", { year, month });
    try {
      const data = await ListAPI.getCalendarList(year, month);
      console.log(
        "[ListScreen] getCalendarList response:",
        JSON.stringify(data, null, 2),
      );
      setDiaries(data.diaries?.length ? data.diaries : MOCK_DIARIES);
    } catch (error: any) {
      console.error("[ListScreen] getCalendarList error:", {
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        headers: error?.config?.headers,
      });
      setDiaries(MOCK_DIARIES);
    }
  };

  const fetchPrompt = async () => {
    console.log("[ListScreen] fetchPrompt params:", {
      month: now.getMonth() + 1,
      date: now.getDate(),
    });
    try {
      const data = await ListAPI.getJournalPrompt(
        now.getMonth() + 1,
        now.getDate(),
      );
      console.log(
        "[ListScreen] getJournalPrompt response:",
        JSON.stringify(data, null, 2),
      );
      setPrompt(data.prompt);
    } catch (error: any) {
      console.error("[ListScreen] getJournalPrompt error:", {
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        headers: error?.config?.headers,
      });
    }
  };

  useEffect(() => {
    fetchCalendarList(selectedYear, selectedMonth);
    fetchPrompt();
  }, []);

  const handleMonthConfirm = (value: MonthPickerValue) => {
    setSelectedYear(value.year);
    setSelectedMonth(value.month);
    setBottomSheetVisible(false);
    fetchCalendarList(value.year, value.month);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => setBottomSheetVisible(true)}>
          <HStack alignment={4} style={{ gap: 4, alignSelf: "flex-start" }}>
            <Typo.Display variant="display3" style={{ color: "#293038" }}>
              {`${selectedYear}년 ${selectedMonth}월`}
            </Typo.Display>
            <Icon.IcDown width={24} height={24} />
          </HStack>
        </Pressable>
      </View>
      <DiaryList diaries={diaries} prompt={prompt} />
      <MonthPickerBottomSheet
        visible={bottomSheetVisible}
        initialValue={{ year: selectedYear, month: selectedMonth }}
        onConfirm={handleMonthConfirm}
        onClose={() => setBottomSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

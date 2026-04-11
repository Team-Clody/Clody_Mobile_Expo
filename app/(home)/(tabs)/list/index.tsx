import { DiaryItem } from "@/api/dto/list/response/getCalendarListResponseDTO";
import { ListAPI } from "@/api/listAPI";
import { DiaryList } from "@/components/list/DiaryList";
import { Icon } from "@/shared/components";
import {
  MonthPickerBottomSheet,
  MonthPickerValue,
} from "@/shared/components/MonthPickerBottomSheet";
import { HStack } from "@/shared/components/stack/HStack";
import { Typo } from "@/shared/components/typo/Typo";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ListScreen() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [prompt, setPrompt] = useState("");

  const fetchCalendarList = async (year: number, month: number) => {
    try {
      const data = await ListAPI.getCalendarList(year, month);
      setDiaries(data.diaries ?? []);
    } catch {
      setDiaries([]);
    }
  };

  const fetchPrompt = async () => {
    try {
      const data = await ListAPI.getJournalPrompt(
        now.getMonth() + 1,
        now.getDate(),
      );
      setPrompt(data.prompt);
    } catch {
      // fallback text in PromptHeader
    }
  };

  useEffect(() => {
    fetchPrompt();
    fetchCalendarList(selectedYear, selectedMonth);
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
          <HStack
            alignment={4}
            style={{
              gap: 4,
            }}
          >
            <Typo.Head variant="head1" style={{ color: "#293038" }}>
              {`${selectedYear}년 ${selectedMonth}월`}
            </Typo.Head>
            <Icon.IcDropdown width={24} height={24} />
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

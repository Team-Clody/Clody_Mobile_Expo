import { useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { logCalendarDiaryQuery } from "@/shared/utils/debugCalendarDiaries";
import { getDeviceTimeZone } from "@/shared/utils/timezone";
import authService from "@/services/authService";
import type { CalendarDiary, ReplyStatus } from "../_types";
import {
  buildDiaryCountMap,
  buildReplyMetaMaps,
} from "../_utils/calendarDataUtils";

export function useMainCalendarData(
  currentYear: number,
  currentMonth: number,
  setDiaryCountByDate: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >,
  setReplyStatusByDate: React.Dispatch<
    React.SetStateAction<Record<string, ReplyStatus>>
  >,
  setReplyReadyAtByDate: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >,
  setTotalCloverCount: React.Dispatch<React.SetStateAction<number>>,
) {
  const fetchedMonthKeysRef = useRef<Set<string>>(new Set());
  const fetchingMonthKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchCalendar = async () => {
      const timeZone = getDeviceTimeZone();
      const requestCalendarList = async (
        accessToken: string,
        year: number,
        month: number,
      ) =>
        axios.get("https://test.clodycorp.com/api/v1/calendar/list", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Time-Zone": timeZone,
          },
          params: { year, month },
        });

      const mergeMonthDiaryCount = (
        diaries: CalendarDiary[],
        totalClover: number,
      ) => {
        const diaryCountMap = buildDiaryCountMap(diaries);
        const { replyStatusByDate: rs, replyReadyAtByDate: rr } =
          buildReplyMetaMaps(diaries);
        setDiaryCountByDate((prev) => ({ ...prev, ...diaryCountMap }));
        setReplyStatusByDate((prev) => ({ ...prev, ...rs }));
        setReplyReadyAtByDate((prev) => ({ ...prev, ...rr }));
        setTotalCloverCount(totalClover);
      };

      const fetchMonth = async (
        accessToken: string,
        year: number,
        month: number,
      ) => {
        const monthKey = `${year}-${String(month).padStart(2, "0")}`;
        if (
          fetchedMonthKeysRef.current.has(monthKey) ||
          fetchingMonthKeysRef.current.has(monthKey)
        ) {
          return;
        }

        fetchingMonthKeysRef.current.add(monthKey);
        try {
          const resp = await requestCalendarList(accessToken, year, month);
          logCalendarDiaryQuery("Main.fetchMonth", year, month, resp.data?.data);
          const diaries = (resp.data?.data?.diaries ?? []) as CalendarDiary[];
          const totalClover = Number(resp.data?.data?.totalCloverCount ?? 0);
          mergeMonthDiaryCount(diaries, totalClover);
          fetchedMonthKeysRef.current.add(monthKey);
        } finally {
          fetchingMonthKeysRef.current.delete(monthKey);
        }
      };

      const getNeighborMonth = (year: number, month: number, diff: number) => {
        const date = new Date(year, month - 1 + diff, 1);
        return { year: date.getFullYear(), month: date.getMonth() + 1 };
      };

      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken) {
          console.warn("[TEST] accessToken is missing");
          return;
        }

        await fetchMonth(accessToken, currentYear, currentMonth);
        const prevMonth = getNeighborMonth(currentYear, currentMonth, -1);
        const nextMonth = getNeighborMonth(currentYear, currentMonth, 1);
        void fetchMonth(accessToken, prevMonth.year, prevMonth.month);
        void fetchMonth(accessToken, nextMonth.year, nextMonth.month);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          try {
            const refreshToken = await SecureStore.getItemAsync("refreshToken");
            const reissued =
              await authService.reissueWithRefreshToken(refreshToken);
            if (!reissued) return;

            const newAccessToken = await SecureStore.getItemAsync("accessToken");
            if (!newAccessToken) return;

            await fetchMonth(newAccessToken, currentYear, currentMonth);
            const prevMonth = getNeighborMonth(currentYear, currentMonth, -1);
            const nextMonth = getNeighborMonth(currentYear, currentMonth, 1);
            void fetchMonth(newAccessToken, prevMonth.year, prevMonth.month);
            void fetchMonth(newAccessToken, nextMonth.year, nextMonth.month);
          } catch (retryError) {
            console.error("[TEST] calendar/list retry error:", retryError);
          }
          return;
        }
        console.error("[TEST] calendar/list error:", error);
      }
    };

    void fetchCalendar();
  }, [
    currentYear,
    currentMonth,
    setDiaryCountByDate,
    setReplyStatusByDate,
    setReplyReadyAtByDate,
    setTotalCloverCount,
  ]);
}

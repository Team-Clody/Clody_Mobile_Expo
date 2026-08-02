import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { DiaryAPI } from "@/api/diaryAPI";
import authService from "@/services/authService";
import { diaryCreatedToReplyReadyMs } from "@/shared/utils/diaryReplyTimer";
import type { ReplyStatus } from "../_types";

export function useReplyReadyTime(
  selectedReplyStatus: ReplyStatus,
  selectedDiaryCount: number,
  selectedDateKey: string,
  replyReadyDeadlineMs: number | undefined,
  setReplyReadyAtByDate: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >,
) {
  useEffect(() => {
    if (selectedReplyStatus !== "UNREADY" || selectedDiaryCount <= 0) {
      return;
    }
    if (replyReadyDeadlineMs != null && replyReadyDeadlineMs > 0) {
      return;
    }

    let cancelled = false;
    const dateKey = selectedDateKey;
    const ymd = selectedDateKey.split("-").map(Number);
    const year = ymd[0];
    const month = ymd[1];
    const date = ymd[2];
    if (!year || !month || !date) {
      return;
    }

    const tryFetch = async (token: string) => {
      const data = await DiaryAPI.getDiaryCreatedTime(year, month, date);
      if (cancelled) return;
      const readyMs = diaryCreatedToReplyReadyMs(data);
      if (readyMs == null) return;
      setReplyReadyAtByDate((prev) => {
        if (prev[dateKey] != null && prev[dateKey]! > 0) {
          return prev;
        }
        return { ...prev, [dateKey]: readyMs };
      });
    };

    void (async () => {
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken || cancelled) return;
        try {
          await tryFetch(accessToken);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            try {
              const refreshToken = await SecureStore.getItemAsync("refreshToken");
              const reissued =
                await authService.reissueWithRefreshToken(refreshToken);
              if (reissued && !cancelled) {
                const newToken = await SecureStore.getItemAsync("accessToken");
                if (newToken) {
                  try {
                    await tryFetch(newToken);
                  } catch {
                    /* 404 등 */
                  }
                }
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* no token */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedReplyStatus,
    selectedDiaryCount,
    selectedDateKey,
    replyReadyDeadlineMs,
    setReplyReadyAtByDate,
  ]);
}

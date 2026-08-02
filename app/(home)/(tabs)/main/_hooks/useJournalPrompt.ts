import { useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { getDeviceTimeZone } from "@/shared/utils/timezone";
import authService from "@/services/authService";
import i18n from "@/app/i18n/i18n";
import {
  DUMMY_JOURNAL_PROMPT_EN,
  DUMMY_JOURNAL_PROMPT_KO,
} from "../_constants";
import { formatDateKey, isCalendarToday } from "../_utils/dateUtils";

export function useJournalPrompt(
  gratitudeDate: Date,
  setJournalPromptText: React.Dispatch<React.SetStateAction<string>>,
) {
  const journalPromptCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isCalendarToday(gratitudeDate)) {
      return;
    }

    const promptCacheKey = `${formatDateKey(gratitudeDate)}|${i18n.locale ?? ""}`;
    const cachedPrompt = journalPromptCacheRef.current.get(promptCacheKey);
    if (cachedPrompt !== undefined) {
      setJournalPromptText(cachedPrompt);
      return;
    }

    let cancelled = false;
    const dummy = i18n.locale?.startsWith("ko")
      ? DUMMY_JOURNAL_PROMPT_KO
      : DUMMY_JOURNAL_PROMPT_EN;

    const commitPrompt = (text: string) => {
      if (cancelled) return;
      journalPromptCacheRef.current.set(promptCacheKey, text);
      setJournalPromptText(text);
    };

    const run = async () => {
      const timeZone = getDeviceTimeZone();
      const month = gratitudeDate.getMonth() + 1;
      const date = gratitudeDate.getDate();

      const requestJournalPrompt = async (accessToken: string) =>
        axios.get("https://test.clodycorp.com/api/v1/journal/prompt", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Time-Zone": timeZone,
          },
          params: { month, date },
        });

      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken) {
          commitPrompt(dummy);
          return;
        }

        try {
          const resp = await requestJournalPrompt(accessToken);
          const text = String(resp.data?.data?.prompt ?? "").trim();
          commitPrompt(text || dummy);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            try {
              const refreshToken = await SecureStore.getItemAsync("refreshToken");
              const reissued =
                await authService.reissueWithRefreshToken(refreshToken);
              if (reissued) {
                const newAccessToken = await SecureStore.getItemAsync("accessToken");
                if (newAccessToken) {
                  const resp2 = await requestJournalPrompt(newAccessToken);
                  const text = String(resp2.data?.data?.prompt ?? "").trim();
                  commitPrompt(text || dummy);
                  return;
                }
              }
            } catch {
              /* fall through */
            }
          }
          commitPrompt(dummy);
        }
      } catch {
        commitPrompt(dummy);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [gratitudeDate, setJournalPromptText]);
}

import { JournalPromptAPI } from "@/api/journalPromptAPI";
import i18n from "@/app/i18n/i18n";
import { useEffect, useRef } from "react";

function formatDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isToday(date: Date) {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
}

export function useJournalPrompt(
  gratitudeDate: Date,
  setJournalPromptText: React.Dispatch<React.SetStateAction<string>>,
) {
  const journalPromptCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isToday(gratitudeDate)) return;

    const promptCacheKey = `${formatDateKey(gratitudeDate)}|${i18n.locale ?? ""}`;
    const cachedPrompt = journalPromptCacheRef.current.get(promptCacheKey);
    if (cachedPrompt !== undefined) {
      setJournalPromptText(cachedPrompt);
      return;
    }

    let cancelled = false;
    const commitPrompt = (text: string) => {
      if (cancelled) return;
      journalPromptCacheRef.current.set(promptCacheKey, text);
      setJournalPromptText(text);
    };

    void JournalPromptAPI.getToday(
      gratitudeDate.getMonth() + 1,
      gratitudeDate.getDate(),
    )
      .then(({ prompt }) => commitPrompt(String(prompt ?? "").trim()))
      .catch((error) => {
        console.warn("[journalPrompt] request failed", error);
        commitPrompt("");
      });

    return () => {
      cancelled = true;
    };
  }, [gratitudeDate, setJournalPromptText]);
}

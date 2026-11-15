import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { DiaryAPI } from "@/api/diaryAPI";

/** Reload the selected draft on focus, independently of the calendar cache. */
export function useSelectedDraft(date: Date, hasDiary: boolean, enabled = true) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateKey = `${year}-${month}-${day}`;
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!enabled) setDrafts({});
  }, [enabled]);

  useFocusEffect(useCallback(() => {
    if (!enabled || hasDiary) return;
    let active = true;
    void DiaryAPI.getDraft(year, month, day).then(({ draftDiaries }) => {
      if (!active) return;
      const hasDraft = draftDiaries.some((content) => content.trim().length > 0);
      setDrafts((previous) => ({ ...previous, [dateKey]: hasDraft }));
    }).catch(() => {
      // A failed refresh must not erase a known draft or calendar status.
    });
    return () => { active = false; };
  }, [year, month, day, dateKey, hasDiary, enabled]));

  return hasDiary ? false : drafts[dateKey];
}

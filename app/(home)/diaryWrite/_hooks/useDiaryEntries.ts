import { useCallback, useRef, useState } from "react";
import { MIN_ENTRY_LENGTH } from "../_constants";

interface DiaryEntry {
  id: string;
  text: string;
}

// 기본 3칸, 무료 최대 5칸 (광고 확장 시 7칸 — 추후)
const MAX_ENTRY_COUNT = 5;

export function useDiaryEntries() {
  const seqRef = useRef(0);

  const createEntry = useCallback((): DiaryEntry => {
    seqRef.current += 1;
    return { id: `entry-${seqRef.current}`, text: "" };
  }, []);

  const [entries, setEntries] = useState<DiaryEntry[]>(() =>
    Array.from({ length: 3 }, () => {
      seqRef.current += 1;
      return { id: `entry-${seqRef.current}`, text: "" };
    }),
  );

  const canAddEntry = entries.length < MAX_ENTRY_COUNT;

  const addEntry = useCallback(() => {
    setEntries((prev) =>
      prev.length < MAX_ENTRY_COUNT ? [...prev, createEntry()] : prev,
    );
  }, [createEntry]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) =>
      prev.length > 1 ? prev.filter((entry) => entry.id !== id) : prev,
    );
  }, []);

  const updateEntry = useCallback((id: string, text: string) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, text } : entry)),
    );
  }, []);

  // 임시저장 불러오기 — 빈 문자열 항목도 칸으로 복원, 없으면 빈 1칸
  const loadEntries = useCallback((texts: string[]) => {
    const source = texts.length > 0 ? texts.slice(0, MAX_ENTRY_COUNT) : [""];
    setEntries(
      source.map((text) => {
        seqRef.current += 1;
        return { id: `entry-${seqRef.current}`, text };
      }),
    );
  }, []);

  const filledEntries = entries.filter(
    (entry) => entry.text.trim().length >= MIN_ENTRY_LENGTH,
  );
  const isAllEmpty = entries.every((entry) => entry.text.trim().length === 0);

  return {
    entries,
    canAddEntry,
    addEntry,
    removeEntry,
    updateEntry,
    loadEntries,
    filledEntries,
    isAllEmpty,
  };
}

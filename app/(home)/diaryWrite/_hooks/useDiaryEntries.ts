import { useCallback, useRef, useState } from "react";
import {
  INITIAL_ENTRY_COUNT,
  MAX_FREE_ENTRY_COUNT,
  MIN_ENTRY_LENGTH,
} from "../_constants";
import type { DiaryEntry } from "../_types";

export function useDiaryEntries() {
  const seqRef = useRef(0);

  const createEntry = useCallback((): DiaryEntry => {
    seqRef.current += 1;
    return { id: `entry-${seqRef.current}`, text: "" };
  }, []);

  const [entries, setEntries] = useState<DiaryEntry[]>(() =>
    Array.from({ length: INITIAL_ENTRY_COUNT }, () => {
      seqRef.current += 1;
      return { id: `entry-${seqRef.current}`, text: "" };
    }),
  );

  const canAddEntry = entries.length < MAX_FREE_ENTRY_COUNT;

  const addEntry = useCallback(() => {
    setEntries((prev) =>
      prev.length < MAX_FREE_ENTRY_COUNT ? [...prev, createEntry()] : prev,
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
    filledEntries,
    isAllEmpty,
  };
}

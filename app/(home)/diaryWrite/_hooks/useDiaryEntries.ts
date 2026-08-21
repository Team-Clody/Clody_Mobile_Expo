import { useCallback, useRef, useState } from "react";
import { MIN_ENTRY_LENGTH } from "../_constants";

interface DiaryEntry {
  id: string;
  text: string;
}

const INITIAL_ENTRY_COUNT = 3;
const FREE_MAX_ENTRY_COUNT = 5;
const AD_UNLOCK_ENTRY_COUNT = 1;
const AD_MAX_ENTRY_COUNT = 7;

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
  const [isAdEntryBonusApplied, setIsAdEntryBonusApplied] = useState(false);

  const maxEntryCount = isAdEntryBonusApplied
    ? AD_MAX_ENTRY_COUNT
    : FREE_MAX_ENTRY_COUNT;
  const canAddEntry = entries.length < maxEntryCount;
  const canUnlockAdEntries =
    !isAdEntryBonusApplied && entries.length >= FREE_MAX_ENTRY_COUNT;

  const addEntry = useCallback(() => {
    setEntries((prev) =>
      prev.length < maxEntryCount ? [...prev, createEntry()] : prev,
    );
  }, [createEntry, maxEntryCount]);

  const unlockAdEntries = useCallback(() => {
    setIsAdEntryBonusApplied(true);
    setEntries((prev) => {
      const availableCount = Math.max(AD_MAX_ENTRY_COUNT - prev.length, 0);
      const appendCount = Math.min(AD_UNLOCK_ENTRY_COUNT, availableCount);
      if (appendCount === 0) return prev;

      return [
        ...prev,
        ...Array.from({ length: appendCount }, () => createEntry()),
      ];
    });
  }, [createEntry]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) =>
      prev.length > 1 ? prev.filter((entry) => entry.id !== id) : prev,
    );
  }, []);

  const moveEntry = useCallback((from: number, to: number) => {
    setEntries((prev) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= prev.length ||
        to >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const updateEntry = useCallback((id: string, text: string) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, text } : entry)),
    );
  }, []);

  const loadEntries = useCallback((texts: string[]) => {
    const source = texts.length > 0 ? texts.slice(0, AD_MAX_ENTRY_COUNT) : [""];
    setIsAdEntryBonusApplied(source.length > FREE_MAX_ENTRY_COUNT);
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
    canUnlockAdEntries,
    addEntry,
    unlockAdEntries,
    removeEntry,
    moveEntry,
    updateEntry,
    loadEntries,
    filledEntries,
    isAllEmpty,
  };
}

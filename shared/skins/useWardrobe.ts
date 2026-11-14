import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { loadWardrobe, type WardrobeItem } from "@/services/wardrobeService";

export function useWardrobe() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [equippedId, setEquippedId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    void loadWardrobe().then((result) => {
      if (!active) return;
      if (result.complete) setItems(result.items);
      else setItems((previous) => [...previous.filter((item) => !result.items.some((fresh) => fresh.inventoryItemId === item.inventoryItemId)), ...result.items]);
      // Failed requests must not erase the previously confirmed selection.
      if (result.equippedResolved) {
        setEquippedId(result.equippedId);
        setSelectedId(result.equippedId);
      }
      setError(!result.complete);
      setLoading(false);
    }).catch(() => {
      if (active) { setError(true); setLoading(false); }
    });
    return () => { active = false; };
  // The retry counter deliberately restarts the focused request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]));

  return { items, equippedId, selectedId, setSelectedId, loading, error, retry };
}

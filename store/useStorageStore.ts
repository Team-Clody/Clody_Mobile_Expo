import { create } from "zustand";

interface UseStorage {
  shouldReopenReward: boolean;
  setShouldReopenReward: (value: boolean) => void;
}

export const useStorageStore = create<UseStorage>((set) => ({
  shouldReopenReward: false,
  setShouldReopenReward: (value) => set({ shouldReopenReward: value }),
}));

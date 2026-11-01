import { create } from "zustand";

export type PendingToast = {
  message: string;
  variant: "success" | "warning";
};

interface UseStorage {
  shouldReopenReward: boolean;
  setShouldReopenReward: (value: boolean) => void;
  /** 화면을 떠나며 예약해두고, 도착한 화면이 포커스 시점에 소비하는 토스트 */
  pendingToast: PendingToast | null;
  setPendingToast: (value: PendingToast | null) => void;
}

export const useStorageStore = create<UseStorage>((set) => ({
  shouldReopenReward: false,
  setShouldReopenReward: (value) => set({ shouldReopenReward: value }),
  pendingToast: null,
  setPendingToast: (value) => set({ pendingToast: value }),
}));

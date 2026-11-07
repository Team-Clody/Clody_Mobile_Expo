import {
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";
import { initializeAdMob } from "@/shared/ads/initializeAdMob";
import type { AdMobRewardedAdState } from "@/shared/ads/types";

type AdKind = "interstitial" | "rewarded";
type Ad = InterstitialAd | RewardedAd;
type Snapshot = Omit<AdMobRewardedAdState, "load" | "showAd">;

const MAX_AUTOMATIC_RETRIES = 3;
const MAX_AD_AGE_MS = 55 * 60_000;
const controllers = new Map<string, AdMobFullScreenAdController>();
let presentingAd: AdMobFullScreenAdController | null = null;

function retryDelay(error: Error, attempt: number) {
  const code = (error as Error & { code?: string }).code ?? error.message;
  const base = code.includes("invalid-request")
    ? 120_000
    : code.includes("no-fill")
      ? 60_000
      : 30_000;
  return Math.min(base * 2 ** attempt, 300_000);
}

// Share a placement across screens so navigation cannot duplicate loads or
// bypass a failed request's cooldown. Create native objects only on subscribe.
export function getAdMobFullScreenAdController(kind: AdKind, unitId: string) {
  const key = `${kind}:${unitId}`;
  let controller = controllers.get(key);
  if (!controller) {
    controller = new AdMobFullScreenAdController(kind, unitId);
    controllers.set(key, controller);
  }
  return controller;
}

class AdMobFullScreenAdController {
  private ad: Ad | null = null;
  private unsubscribeAd?: () => void;
  private listeners = new Set<() => void>();
  private initialized = false;
  private initializing = false;
  private loading = false;
  private loadedAt = 0;
  private started = false;
  private retryCount = 0;
  private nextLoadAt = 0;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private showAttempt = 0;
  private snapshot: Snapshot;

  constructor(private kind: AdKind, private unitId: string) {
    this.snapshot = {
      unitId,
      isLoaded: false,
      isShowing: false,
      isClosed: false,
      isClicked: false,
      isEarnedReward: false,
    };
  }

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.started) {
      this.started = true;
      this.requestLoad(false);
    } else if (this.snapshot.error) {
      this.scheduleRetry();
    } else {
      this.requestLoad(false);
    }
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) this.clearRetry();
    };
  };

  // true means ready, loading, or waiting for initialization. Cooldown returns
  // false so callers can report unavailability without starting a loading wait.
  load = () => this.requestLoad(true);

  showAd = () => {
    if (!this.listeners.size || presentingAd || this.snapshot.isShowing) return false;
    const ad = this.ad;
    if (!this.snapshot.isLoaded || !ad?.loaded ||
        Date.now() - this.loadedAt >= MAX_AD_AGE_MS) {
      this.load();
      return false;
    }

    const attempt = ++this.showAttempt;
    presentingAd = this;
    this.update({
      isLoaded: false,
      isShowing: true,
      isClosed: false,
      isClicked: false,
      isEarnedReward: false,
      reward: undefined,
      error: undefined,
    });
    try {
      Promise.resolve(ad.show()).catch((error: unknown) => {
        if (attempt === this.showAttempt) this.fail(error, "show");
      });
      return true;
    } catch (error) {
      this.fail(error, "show");
      return false;
    }
  };

  private update(patch: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private createAd() {
    const ad = this.kind === "rewarded"
      ? RewardedAd.createForAdRequest(this.unitId)
      : InterstitialAd.createForAdRequest(this.unitId);
    this.ad = ad;
    this.unsubscribeAd = (ad as RewardedAd).addAdEventsListener(({ type, payload }) => {
      if (this.ad !== ad) return;
      switch (type) {
        case AdEventType.LOADED:
        case RewardedAdEventType.LOADED:
          this.loading = false;
          this.loadedAt = Date.now();
          this.retryCount = 0;
          this.nextLoadAt = 0;
          this.clearRetry();
          // Keep completion flags until the next show: a fast preload must not
          // erase CLOSED / EARNED_REWARD before React effects observe them.
          this.update({ isLoaded: true, error: undefined });
          console.log("[AdMob] ad loaded", { kind: this.kind, unitId: this.unitId });
          break;
        case AdEventType.OPENED:
          this.update({ isShowing: true });
          break;
        case AdEventType.CLICKED:
          this.update({ isClicked: true });
          break;
        case RewardedAdEventType.EARNED_REWARD:
          this.update({ isEarnedReward: true, reward: payload as Snapshot["reward"] });
          break;
        case AdEventType.CLOSED:
          ++this.showAttempt;
          if (presentingAd === this) presentingAd = null;
          this.update({ isShowing: false, isLoaded: false, isClosed: true });
          this.requestLoad(false);
          break;
        case AdEventType.ERROR:
          this.fail(payload, this.snapshot.isShowing ? "show" : "load");
          break;
      }
    });
  }

  private requestLoad(manual: boolean): boolean {
    if (!this.listeners.size || this.snapshot.isShowing) return false;
    if (this.loading || this.initializing) return true;
    if (this.snapshot.isLoaded && this.ad?.loaded &&
        Date.now() - this.loadedAt < MAX_AD_AGE_MS) return true;
    if (this.snapshot.isLoaded) {
      this.unsubscribeAd?.();
      this.ad = null;
      this.update({ isLoaded: false });
    }
    if (Date.now() < this.nextLoadAt) return false;
    if (manual) this.retryCount = 0;
    this.clearRetry();

    if (!this.initialized) {
      this.initializing = true;
      initializeAdMob().then(() => {
        this.initializing = false;
        this.initialized = true;
        this.requestLoad(false);
      }).catch((error: unknown) => {
        this.initializing = false;
        this.fail(error, "initialize");
      });
      return true;
    }

    this.loading = true;
    try {
      if (!this.ad) this.createAd();
      console.log("[AdMob] ad loading", {
        kind: this.kind,
        unitId: this.unitId,
        retry: this.retryCount,
      });
      this.ad!.load();
      return true;
    } catch (error) {
      this.fail(error, "load");
      return false;
    }
  }

  private fail(value: unknown, phase: "initialize" | "load" | "show") {
    const error = value instanceof Error ? value : new Error(String(value));
    this.loading = false;
    ++this.showAttempt;
    if (presentingAd === this) presentingAd = null;
    // A rejected show can leave MobileAd.loaded=true. Discard it so its guard
    // cannot silently skip the next load.
    this.unsubscribeAd?.();
    this.unsubscribeAd = undefined;
    this.ad = null;
    this.nextLoadAt = Date.now() + retryDelay(error, this.retryCount);
    this.update({ error, isLoaded: false, isShowing: false });
    console.warn("[AdMob] ad failed", {
      kind: this.kind,
      unitId: this.unitId,
      phase,
      message: error.message,
      retry: this.retryCount,
      retryAfterMs: this.nextLoadAt - Date.now(),
    });
    this.scheduleRetry();
  }

  private clearRetry() {
    if (this.retryTimer !== undefined) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
  }

  private scheduleRetry() {
    if (!this.listeners.size || this.loading || this.initializing ||
        this.snapshot.isLoaded || this.snapshot.isShowing ||
        this.retryTimer !== undefined ||
        this.retryCount >= MAX_AUTOMATIC_RETRIES) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      ++this.retryCount;
      this.requestLoad(false);
    }, Math.max(0, this.nextLoadAt - Date.now()));
  }
}

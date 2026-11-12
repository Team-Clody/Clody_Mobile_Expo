export interface UpdatePromptContent {
  title: string;
  message: string;
  confirm: string;
  recheck: string;
  errorTitle: string;
  errorMessage: string;
  errorConfirm: string;
}

interface PromptButton {
  text: string;
  onPress: () => void;
}

interface PromptActions {
  onConfirm: () => Promise<void> | void;
  /** False means the refreshed policy no longer requires an update. */
  onRecheck?: () => Promise<boolean | void> | boolean | void;
}

interface PromptBoundary {
  showAlert: (
    title: string,
    message: string,
    buttons: PromptButton[],
    options: { cancelable: false; onDismiss: () => void },
  ) => void;
  isActive: () => boolean;
  getContent: () => UpdatePromptContent;
  getActions: () => PromptActions;
}

/** Coordinates automatically dismissed system dialogs with asynchronous actions. */
export function createNativeUpdatePrompt(boundary: PromptBoundary) {
  let stopped = false;
  let sequence = 0;
  let visible: number | null = null;
  let pending: number | null = null;
  let phase: "update" | "error" = "update";

  const show = () => {
    if (stopped || visible !== null || pending !== null || !boundary.isActive()) return;
    const id = ++sequence;
    visible = id;
    const content = boundary.getContent();
    const options = {
      cancelable: false as const,
      onDismiss: () => {
        if (!stopped && visible === id) visible = null;
      },
    };

    if (phase === "error") {
      boundary.showAlert(content.errorTitle, content.errorMessage, [{
        text: content.errorConfirm,
        onPress: () => {
          if (stopped || visible !== id) return;
          visible = null;
          phase = "update";
          show();
        },
      }], options);
      return;
    }

    const run = (kind: "confirm" | "recheck") => {
      if (stopped || visible !== id) return;
      visible = null;
      const operation = ++sequence;
      pending = operation;
      const action = kind === "confirm"
        ? boundary.getActions().onConfirm
        : boundary.getActions().onRecheck;

      void Promise.resolve().then(() => {
        if (stopped || pending !== operation) return false;
        return action?.();
      }).then((stillRequired) => {
        if (stopped || pending !== operation) return;
        pending = null;
        phase = "update";
        if (kind === "recheck" && stillRequired === false) {
          // The parent may not have committed its unmount yet. Do not reopen
          // during that gap if an activation event arrives immediately.
          stopped = true;
          return;
        }
        // If the store is in front, the next app activation presents this again.
        show();
      }, () => {
        if (stopped || pending !== operation) return;
        pending = null;
        phase = kind === "confirm" ? "error" : "update";
        show();
      });
    };

    const buttons: PromptButton[] = [];
    if (boundary.getActions().onRecheck) {
      buttons.push({ text: content.recheck, onPress: () => run("recheck") });
    }
    buttons.push({ text: content.confirm, onPress: () => run("confirm") });
    boundary.showAlert(content.title, content.message, buttons, options);
  };

  return {
    show,
    onActive: show,
    stop: () => {
      stopped = true;
      visible = null;
      pending = null;
    },
  };
}

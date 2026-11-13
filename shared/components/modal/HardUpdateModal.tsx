import { useEffect, useRef } from "react";
import { Alert, AppState, Linking, Platform } from "react-native";
import { useModal } from "@/shared/contexts/ModalContext";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { createNativeUpdatePrompt } from "@/shared/updates/nativeUpdatePrompt";
import { validateStoreUrl } from "@/shared/updates/versionPolicy";

interface HardUpdateDialogProps {
  currentVersion: string;
  latestVersion: string;
  onConfirm: () => Promise<void> | void;
  onRecheck?: () => Promise<boolean | void> | boolean | void;
}

export const HardUpdateModal = () => {
  const { visibleModal, updateModalData } = useModal();
  if (visibleModal !== "hardUpdate") return null;

  const openStore = async () => {
    const platform = Platform.OS === "android" ? "android" : "ios";
    const url = validateStoreUrl(updateModalData?.storeUrl || "", platform);
    if (!url) throw new Error("STORE_URL_NOT_CONFIGURED");
    await Linking.openURL(url);
  };

  return <HardUpdateDialog
    currentVersion={updateModalData?.currentVersion || ""}
    latestVersion={updateModalData?.latestVersion || ""}
    onConfirm={openStore}
  />;
};

/** Uses the operating system's alert; access remains blocked by AppUpdateGate. */
export const HardUpdateDialog = (props: HardUpdateDialogProps) => {
  const { t } = useTranslation();
  const latest = useRef({ props, t });
  latest.current = { props, t };

  useEffect(() => {
    const prompt = createNativeUpdatePrompt({
      showAlert: (title, message, buttons, options) => Alert.alert(title, message, buttons, options),
      isActive: () => AppState.currentState === "active" || AppState.currentState === null,
      getContent: () => {
        const { props: current, t: translate } = latest.current;
        return {
          title: translate("modal.hardUpdate.title"),
          message: translate("modal.hardUpdate.description", {
            currentVersion: current.currentVersion,
            latestVersion: current.latestVersion,
          }),
          confirm: translate("modal.hardUpdate.confirm"),
          recheck: translate("modal.hardUpdate.recheck"),
          errorTitle: translate("modal.hardUpdate.storeErrorTitle"),
          errorMessage: translate("modal.hardUpdate.storeError"),
          errorConfirm: translate("modal.hardUpdate.storeErrorConfirm"),
        };
      },
      getActions: () => latest.current.props,
    });
    prompt.show();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") prompt.onActive();
    });
    return () => {
      prompt.stop();
      subscription.remove();
    };
  }, []);

  return null;
};

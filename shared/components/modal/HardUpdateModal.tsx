import React from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, View, StyleSheet, Pressable } from 'react-native';
import { useModal } from '@/shared/contexts/ModalContext';
import { Typo } from '../typo/Typo';
import { palette } from '@/shared/theme/palette';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { validateStoreUrl } from '@/shared/updates/versionPolicy';

interface HardUpdateDialogProps {
  currentVersion: string;
  latestVersion: string;
  onConfirm: () => void;
  onRecheck?: () => void;
  openingStore?: boolean;
  checking?: boolean;
}

export const HardUpdateModal = () => {
  const { visibleModal, updateModalData } = useModal();
  const { t } = useTranslation();
  const isVisible = visibleModal === 'hardUpdate';

  const currentVersion = updateModalData?.currentVersion || '';
  const latestVersion = updateModalData?.latestVersion || '';

  const handleConfirm = async () => {
    const url = validateStoreUrl(updateModalData?.storeUrl || '', Platform.OS === 'android' ? 'android' : 'ios');
    try {
      if (!url) throw new Error('STORE_URL_NOT_CONFIGURED');
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('modal.hardUpdate.storeErrorTitle'), t('modal.hardUpdate.storeError'));
    }
  };

  if (!isVisible) {
    return null;
  }

  return <HardUpdateDialog currentVersion={currentVersion} latestVersion={latestVersion} onConfirm={() => void handleConfirm()} />;
};

/** No dismissal handler: the required update stays in place after store navigation. */
export const HardUpdateDialog = ({
  currentVersion,
  latestVersion,
  onConfirm,
  onRecheck,
  openingStore = false,
  checking = false,
}: HardUpdateDialogProps) => {
  const { t } = useTranslation();
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.overlay}>
      <View style={styles.modalContainer} accessibilityViewIsModal>
        <Typo.Display variant="display3" color="gray1000" style={styles.title}>
          {t('modal.hardUpdate.title')}
        </Typo.Display>

        <Typo.Caption
          variant="caption1"
          color="gray500"
          style={styles.description}
        >
          {t('modal.hardUpdate.description', {
            currentVersion,
            latestVersion,
          })}
        </Typo.Caption>

        <View style={styles.buttonWrapper}>
          <Pressable
            accessibilityRole="button"
            disabled={openingStore}
            onPress={onConfirm}
            style={[styles.button, { backgroundColor: palette.gray800 }]}
          >
            {openingStore ? <ActivityIndicator color={palette.gray0} /> : <Typo.Body variant="body3" color="gray0">
              {t('modal.hardUpdate.confirm')}
            </Typo.Body>}
          </Pressable>
          {onRecheck && <Pressable accessibilityRole="button" disabled={checking} onPress={onRecheck} style={styles.recheck}>
            {checking ? <ActivityIndicator color={palette.gray500} /> : <Typo.Caption variant="caption1" color="gray500">
              {t('modal.hardUpdate.recheck')}
            </Typo.Caption>}
          </Pressable>}
        </View>
      </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: palette.gray0,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  title: {
    marginTop: 18,
    textAlign: 'center',
  },
  description: {
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  buttonWrapper: {
    padding: 18,
  },
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    minHeight: 44,
  },
  recheck: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});

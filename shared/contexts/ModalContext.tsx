import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ModalType =
  | 'inspection'
  | 'softUpdate'
  | 'hardUpdate'
  | 'logout'
  | 'revoke'
  | string;

export interface UpdateModalData {
  currentVersion: string;
  latestVersion: string;
}

export interface InspectionModalData {
  inspectionStart: string;
  inspectionEnd: string;
}

interface ModalContextValue {
  visibleModal: ModalType | null;
  showModal: (
    modalType: ModalType,
    data?: UpdateModalData | InspectionModalData,
  ) => void;
  hideModal: () => void;
  isModalVisible: (modalType: ModalType) => boolean;
  updateModalData: UpdateModalData | null;
  inspectionModalData: InspectionModalData | null;
  isLogoutSuccess: boolean;
  setLogoutSuccess: (success: boolean) => void;
  isRevokeSuccess: boolean;
  setRevokeSuccess: (success: boolean) => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
  initialModal?: ModalType | null;
  initialModalData?: UpdateModalData | null;
  initialInspectionModalData?: InspectionModalData | null;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({
  children,
  initialModal = null,
  initialModalData = null,
  initialInspectionModalData = null,
}) => {
  const [visibleModal, setVisibleModal] = useState<ModalType | null>(
    initialModal,
  );
  const [updateModalData, setUpdateModalData] =
    useState<UpdateModalData | null>(initialModalData);
  const [inspectionModalData, setInspectionModalData] =
    useState<InspectionModalData | null>(initialInspectionModalData);
  const [isLogoutSuccess, setIsLogoutSuccess] = useState(false);
  const [isRevokeSuccess, setIsRevokeSuccess] = useState(false);

  const showModal = (
    modalType: ModalType,
    data?: UpdateModalData | InspectionModalData,
  ) => {
    setVisibleModal(modalType);
    if (modalType === 'logout') {
      setIsLogoutSuccess(false);
    } else if (modalType === 'revoke') {
      setIsRevokeSuccess(false);
    } else if (modalType === 'softUpdate' || modalType === 'hardUpdate') {
      setUpdateModalData((data as UpdateModalData) || null);
    } else if (modalType === 'inspection') {
      setInspectionModalData((data as InspectionModalData) || null);
    }
  };

  const hideModal = () => {
    setVisibleModal(null);
    setUpdateModalData(null);
    setInspectionModalData(null);
  };

  const isModalVisible = (modalType: ModalType): boolean => {
    return visibleModal === modalType;
  };

  const setLogoutSuccess = (success: boolean) => {
    setIsLogoutSuccess(success);
  };

  const setRevokeSuccess = (success: boolean) => {
    setIsRevokeSuccess(success);
  };

  return (
    <ModalContext.Provider
      value={{
        visibleModal,
        showModal,
        hideModal,
        isModalVisible,
        updateModalData,
        inspectionModalData,
        isLogoutSuccess,
        setLogoutSuccess,
        isRevokeSuccess,
        setRevokeSuccess,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

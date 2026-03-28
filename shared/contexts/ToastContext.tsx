import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast } from '@/shared/components/Toast';

interface ToastOptions {
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(2000);

  const showToast = (msg: string, options?: ToastOptions) => {
    setMessage(msg);
    setDuration(options?.duration || 2000);
    setVisible(true);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        hideToast,
      }}
    >
      {children}
      <Toast
        message={message}
        visible={visible}
        duration={duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

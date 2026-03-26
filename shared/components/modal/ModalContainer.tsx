import React from 'react';
import { InspectionModal } from './InspectionModal';
import { LogoutModal } from './LogoutModal';
import { RevokeModal } from './RevokeModal';
import { SoftUpdateModal } from './SoftUpdateModal';
import { HardUpdateModal } from './HardUpdateModal';

export const ModalContainer = () => {
  return (
    <>
      <InspectionModal />
      <SoftUpdateModal />
      <HardUpdateModal />
      <LogoutModal />
      <RevokeModal />
    </>
  );
};

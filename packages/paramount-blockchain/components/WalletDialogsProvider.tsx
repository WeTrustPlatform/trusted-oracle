import { Dialog } from 'paramount-ui';
import React from 'react';

import { RequireWalletPrivacyApproval } from './RequireWalletPrivacyApproval';
import { RequireWalletSetup } from './RequireWalletSetup';
import { RequireWalletSignIn } from './RequireWalletSignIn';

export const WalletDialogsContext = React.createContext({
  setShowRequireWalletSetup: (isVisible: boolean) => {},
  setShowRequireWalletSignIn: (isVisible: boolean) => {},
  setShowRequireWalletPrivacyApproval: (isVisible: boolean) => {},
});

export const useWalletDialogs = () => {
  return React.useContext(WalletDialogsContext);
};

export interface WalletDialogsProviderProps {
  children?: React.ReactNode;
}

export const WalletDialogsProvider = (props: WalletDialogsProviderProps) => {
  const { children } = props;
  const [setShowRequireWalletSetup, setShowSetupWallet] = React.useState(false);
  const [setShowRequireWalletSignIn, setShowSignInWallet] = React.useState(
    false,
  );
  const [
    setShowRequireWalletPrivacyApproval,
    setShowPrivacyWallet,
  ] = React.useState(false);

  return (
    <WalletDialogsContext.Provider
      value={{
        setShowRequireWalletSetup: isVisible => setShowSetupWallet(isVisible),
        setShowRequireWalletSignIn: isVisible => setShowSignInWallet(isVisible),
        setShowRequireWalletPrivacyApproval: isVisible =>
          setShowPrivacyWallet(isVisible),
      }}
    >
      {children}

      <Dialog
        isVisible={setShowRequireWalletSetup}
        onRequestClose={() => setShowSetupWallet(false)}
      >
        <RequireWalletSetup />
      </Dialog>
      <Dialog
        isVisible={setShowRequireWalletPrivacyApproval}
        onRequestClose={() => setShowPrivacyWallet(false)}
      >
        <RequireWalletPrivacyApproval />
      </Dialog>

      <Dialog
        isVisible={setShowRequireWalletSignIn}
        onRequestClose={() => setShowSignInWallet(false)}
      >
        <RequireWalletSignIn />
      </Dialog>
    </WalletDialogsContext.Provider>
  );
};

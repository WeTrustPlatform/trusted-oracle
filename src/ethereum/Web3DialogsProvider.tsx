import { Dialog } from 'paramount-ui';
import React from 'react';

import { RequireMetamaskPrivacyApproval } from './RequireMetamaskPrivacyApproval';
import { RequireMetamaskSetup } from './RequireMetamaskSetup';
import { RequireWalletSignIn } from './RequireWalletSignIn';

export const Web3DialogsContext = React.createContext({
  setShowRequireMetamaskSetup: (isVisible: boolean) => {},
  setShowRequireWalletSignIn: (isVisible: boolean) => {},
  setShowRequireMetamaskPrivacyApproval: (isVisible: boolean) => {},
});

export const useWeb3Dialogs = () => {
  return React.useContext(Web3DialogsContext);
};

export interface Web3DialogsProviderProps {
  children?: React.ReactNode;
}

export const Web3DialogsProvider = (props: Web3DialogsProviderProps) => {
  const { children } = props;
  const [setShowRequireMetamaskSetup, setShowSetupWallet] = React.useState(
    false,
  );
  const [setShowRequireWalletSignIn, setShowSignInWallet] = React.useState(
    false,
  );
  const [
    setShowRequireMetamaskPrivacyApproval,
    setShowPrivacyWallet,
  ] = React.useState(false);

  return (
    <Web3DialogsContext.Provider
      value={{
        setShowRequireMetamaskSetup: isVisible => setShowSetupWallet(isVisible),
        setShowRequireWalletSignIn: isVisible => setShowSignInWallet(isVisible),
        setShowRequireMetamaskPrivacyApproval: isVisible =>
          setShowPrivacyWallet(isVisible),
      }}
    >
      {children}

      <Dialog
        isVisible={setShowRequireMetamaskSetup}
        onRequestClose={() => setShowSetupWallet(false)}
      >
        <RequireMetamaskSetup />
      </Dialog>
      <Dialog
        isVisible={setShowRequireMetamaskPrivacyApproval}
        onRequestClose={() => setShowPrivacyWallet(false)}
      >
        <RequireMetamaskPrivacyApproval />
      </Dialog>

      <Dialog
        isVisible={setShowRequireWalletSignIn}
        onRequestClose={() => setShowSignInWallet(false)}
      >
        <RequireWalletSignIn />
      </Dialog>
    </Web3DialogsContext.Provider>
  );
};

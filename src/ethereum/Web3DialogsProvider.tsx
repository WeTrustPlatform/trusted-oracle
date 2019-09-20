import { Dialog } from 'paramount-ui';
import React from 'react';

import { RequireMetamaskPrivacyApproval } from './RequireMetamaskPrivacyApproval';
import { RequireMetamaskSetup } from './RequireMetamaskSetup';
import { RequireWalletSignIn } from './RequireWalletSignIn';
import { useWeb3 } from './Web3Provider';

interface Web3DialogsContext {
  setShowRequireMetamaskSetup: (isVisible: boolean) => void;
  setShowRequireWalletSignIn: (isVisible: boolean) => void;
  setShowRequireMetamaskPrivacyApproval: (isVisible: boolean) => void;
  ensureHasConnected: () => boolean;
}

export const Web3DialogsContext = React.createContext<Web3DialogsContext>({
  setShowRequireMetamaskSetup: (isVisible: boolean) => {},
  setShowRequireWalletSignIn: (isVisible: boolean) => {},
  setShowRequireMetamaskPrivacyApproval: (isVisible: boolean) => {},
  ensureHasConnected: () => false,
});

export const useWeb3Dialogs = () => {
  return React.useContext(Web3DialogsContext);
};

export interface Web3DialogsProviderProps {
  children?: React.ReactNode;
}

export const Web3DialogsProvider = (props: Web3DialogsProviderProps) => {
  const { children } = props;
  const { account, hasWallet, isConnected } = useWeb3();
  const [
    showRequireMetamaskSetup,
    setShowRequireMetamaskSetup,
  ] = React.useState(false);
  const [showRequireWalletSignIn, setShowRequireWalletSignIn] = React.useState(
    false,
  );
  const [
    showRequireMetamaskPrivacyApproval,
    setShowRequireMetamaskPrivacyApproval,
  ] = React.useState(false);

  React.useEffect(() => {
    if (account) {
      setShowRequireWalletSignIn(false);
    }
  }, [account]);

  const ensureHasConnected = React.useCallback(() => {
    if (!hasWallet) {
      setShowRequireMetamaskSetup(true);
      return false;
    }

    if (!isConnected) {
      setShowRequireMetamaskPrivacyApproval(true);
      return false;
    }

    if (!account) {
      setShowRequireWalletSignIn(true);
      return false;
    }

    return true;
  }, [account, hasWallet, isConnected]);

  return (
    <Web3DialogsContext.Provider
      value={{
        setShowRequireMetamaskSetup: isVisible =>
          setShowRequireWalletSignIn(isVisible),
        setShowRequireWalletSignIn: isVisible =>
          setShowRequireWalletSignIn(isVisible),
        setShowRequireMetamaskPrivacyApproval: isVisible =>
          setShowRequireMetamaskPrivacyApproval(isVisible),
        ensureHasConnected,
      }}
    >
      {children}

      {showRequireMetamaskSetup && (
        <Dialog
          isVisible
          onRequestClose={() => setShowRequireMetamaskSetup(false)}
        >
          <RequireMetamaskSetup />
        </Dialog>
      )}

      {showRequireMetamaskPrivacyApproval && (
        <Dialog
          isVisible
          onRequestClose={() => setShowRequireMetamaskPrivacyApproval(false)}
        >
          <RequireMetamaskPrivacyApproval />
        </Dialog>
      )}

      {showRequireWalletSignIn && (
        <Dialog
          isVisible
          onRequestClose={() => setShowRequireWalletSignIn(false)}
        >
          <RequireWalletSignIn />
        </Dialog>
      )}
    </Web3DialogsContext.Provider>
  );
};

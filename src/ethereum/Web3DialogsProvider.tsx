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
  ensureHasConnected: () => Promise<boolean>;
}

export const Web3DialogsContext = React.createContext<Web3DialogsContext>({
  setShowRequireMetamaskSetup: (isVisible: boolean) => {},
  setShowRequireWalletSignIn: (isVisible: boolean) => {},
  setShowRequireMetamaskPrivacyApproval: (isVisible: boolean) => {},
  ensureHasConnected: async () => false,
});

export const useWeb3Dialogs = () => {
  return React.useContext(Web3DialogsContext);
};

export interface Web3DialogsProviderProps {
  children?: React.ReactNode;
}

export const Web3DialogsProvider = (props: Web3DialogsProviderProps) => {
  const { children } = props;
  const { account, hasWallet, isConnected, providerName } = useWeb3();
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
      setShowRequireMetamaskPrivacyApproval(false);
      setShowRequireMetamaskSetup(false);
    }
  }, [account]);

  const ensureHasConnected = React.useCallback(async () => {
    if (!hasWallet) {
      setShowRequireMetamaskSetup(true);
      return false;
    }

    if (!isConnected) {
      if (providerName === 'metamask') {
        setShowRequireMetamaskPrivacyApproval(true);
        // @ts-ignore
        await window.ethereum.enable();
      }

      return false;
    }

    if (!account) {
      setShowRequireWalletSignIn(true);
      if (providerName === 'metamask') {
        // @ts-ignore
        await window.ethereum.enable();
      }
      return false;
    }

    return true;
  }, [account, providerName, hasWallet, isConnected]);

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

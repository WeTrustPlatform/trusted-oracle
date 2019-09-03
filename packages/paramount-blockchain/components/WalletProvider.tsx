import React from 'react';
import Web3 from 'web3';

type WalletState = {
  walletIsLoading: boolean;
  wallet: Web3;
  providerName: string | null;
  account: string | null;
  networkId: number | null;
  hasWallet: boolean;
};

const initialState: WalletState = {
  walletIsLoading: true,
  wallet: new Web3(Web3.givenProvider),
  providerName: null,
  account: null,
  networkId: null,
  hasWallet: false,
};

const getNetworkId = async (wallet: Web3) => {
  const id = await wallet.eth.net.getId();

  return id;
};

const getAccount = async (wallet: Web3) => {
  const accounts = await wallet.eth.getAccounts();
  // Always use the first as current account
  return accounts[0];
};

const getHasWallet = (wallet: Web3) => {
  return !!wallet.currentProvider;
};

type ProviderName =
  | 'equal'
  | 'metamask'
  | 'dapper'
  | 'safe'
  | 'trust'
  | 'goWallet'
  | 'alphaWallet'
  | 'status'
  | 'coinbase';

const getProviderName = (wallet: any): ProviderName | null => {
  if (!wallet || !wallet.currentProvider) return null;
  if (wallet.currentProvider.isEQLWallet) return 'equal';
  if (wallet.currentProvider.isMetaMask) return 'metamask';
  if (wallet.currentProvider.isDapper) return 'dapper';
  if (wallet.currentProvider.isSafe) return 'safe';
  if (wallet.currentProvider.isTrust) return 'trust';
  if (wallet.currentProvider.isGoWallet) return 'goWallet';
  if (wallet.currentProvider.isAlphaWallet) return 'alphaWallet';
  if (wallet.currentProvider.isStatus) return 'status';
  if (wallet.currentProvider.isToshi) return 'coinbase';

  return null;
};

const getWeb3State = async (wallet: Web3): Promise<WalletState> => {
  const hasWallet = getHasWallet(wallet);

  if (!hasWallet) {
    return initialState;
  }

  const account = await getAccount(wallet);
  const networkId = await getNetworkId(wallet);
  const providerName = await getProviderName(wallet);

  return {
    wallet,
    hasWallet,
    account,
    networkId,
    providerName,
    walletIsLoading: false,
  };
};

export const WalletContext = React.createContext(initialState);

export const useWallet = () => {
  return React.useContext(WalletContext);
};

type Action =
  | { type: 'update'; payload: WalletState }
  | { type: 'load'; payload: WalletState };

const reducer = (state: WalletState, action: Action) => {
  switch (action.type) {
    case 'update':
      return { ...state, ...action.payload };
    case 'load':
      return { ...state, ...action.payload, walletIsLoading: false };
    default:
      throw new Error();
  }
};

interface WalletProviderProps {
  children?: React.ReactNode;
}

export const WalletProvider = (props: WalletProviderProps) => {
  const { children } = props;
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const {
    account,
    networkId,
    hasWallet,
    walletIsLoading,
    wallet,
    providerName,
  } = state;

  // Load
  React.useEffect(() => {
    getWeb3State(wallet).then(web3State =>
      dispatch({ type: 'load', payload: web3State }),
    );
  }, []);

  // Subscribe
  React.useEffect(() => {
    const updateWeb3State = () => {
      getAccount(wallet).then(currentAccount => {
        if (account && account !== currentAccount) {
          localStorage.removeItem('token');
          document.location.href = '/';
          return;
        }

        getWeb3State(wallet).then(web3State => {
          const { account: newAccount, networkId: newNetworkId } = web3State;
          if (
            String(account).toLowerCase() !==
              String(newAccount).toLowerCase() ||
            networkId !== newNetworkId
          ) {
            dispatch({ type: 'update', payload: web3State });
          }
        });
      });
    };

    // Only Metamask provides a listener
    const currentProvider = wallet.currentProvider as any;

    if (hasWallet && currentProvider.publicConfigStore) {
      currentProvider.publicConfigStore.on('update', updateWeb3State);
    }
  }, [account, networkId]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        walletIsLoading,
        account,
        networkId,
        providerName,
        hasWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

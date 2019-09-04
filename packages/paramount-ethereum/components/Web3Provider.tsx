import React from 'react';
import Web3 from 'web3';

type Web3State = {
  web3IsLoading: boolean;
  web3: Web3;
  providerName: string | null;
  account: string | null;
  networkId: number | null;
  hasWallet: boolean;
  isUsingFallback: boolean;
};

const initialState: Web3State = {
  web3IsLoading: true,
  web3: new Web3(Web3.givenProvider),
  providerName: null,
  account: null,
  networkId: null,
  hasWallet: false,
  isUsingFallback: false,
};

const getNetworkId = async (web3: Web3) => {
  const id = await web3.eth.net.getId();

  return id;
};

const getAccount = async (web3: Web3) => {
  const accounts = await web3.eth.getAccounts();
  // Always use the first as current account
  return accounts[0];
};

const getHasWallet = (web3: Web3) => {
  return !!web3.currentProvider;
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

const getProviderName = (web3: any): ProviderName | null => {
  if (!web3 || !web3.currentProvider) return null;
  if (web3.currentProvider.isEQLWallet) return 'equal';
  if (web3.currentProvider.isMetaMask) return 'metamask';
  if (web3.currentProvider.isDapper) return 'dapper';
  if (web3.currentProvider.isSafe) return 'safe';
  if (web3.currentProvider.isTrust) return 'trust';
  if (web3.currentProvider.isGoWallet) return 'goWallet';
  if (web3.currentProvider.isAlphaWallet) return 'alphaWallet';
  if (web3.currentProvider.isStatus) return 'status';
  if (web3.currentProvider.isToshi) return 'coinbase';

  return null;
};

const getWeb3State = async (
  web3: Web3,
  fallbackRPCEndpoint = `https://rinkeby.infura.io/v3/022f489bd91a47f3960f6f70333bdb76`,
): Promise<Web3State> => {
  const hasWallet = getHasWallet(web3);

  if (!hasWallet) {
    return {
      ...initialState,
      web3: new Web3(fallbackRPCEndpoint),
      isUsingFallback: true,
    };
  }

  const account = await getAccount(web3);
  const networkId = await getNetworkId(web3);
  const providerName = await getProviderName(web3);

  return {
    web3,
    hasWallet,
    account,
    networkId,
    providerName,
    web3IsLoading: false,
    isUsingFallback: false,
  };
};

export const Web3Context = React.createContext(initialState);

export const useWeb3 = () => {
  return React.useContext(Web3Context);
};

type Action =
  | { type: 'update'; payload: Web3State }
  | { type: 'load'; payload: Web3State };

const reducer = (state: Web3State, action: Action) => {
  switch (action.type) {
    case 'update':
      return { ...state, ...action.payload };
    case 'load':
      return { ...state, ...action.payload, web3IsLoading: false };
    default:
      throw new Error();
  }
};

interface Web3ProviderProps {
  children?: React.ReactNode;
  fallbackRPCEndpoint?: string;
}

export const Web3Provider = (props: Web3ProviderProps) => {
  const { children, fallbackRPCEndpoint } = props;
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const {
    account,
    networkId,
    hasWallet,
    web3IsLoading,
    web3,
    providerName,
    isUsingFallback,
  } = state;

  // Load
  React.useEffect(() => {
    getWeb3State(web3, fallbackRPCEndpoint).then(web3State =>
      dispatch({ type: 'load', payload: web3State }),
    );
  }, []);

  // Subscribe
  React.useEffect(() => {
    const updateWeb3State = () => {
      getAccount(web3).then(currentAccount => {
        if (account && account !== currentAccount) {
          document.location.href = '/';
          return;
        }

        getWeb3State(web3, fallbackRPCEndpoint).then(web3State => {
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
    const currentProvider = web3.currentProvider as any;

    if (hasWallet && currentProvider.publicConfigStore) {
      currentProvider.publicConfigStore.on('update', updateWeb3State);
    }
  }, [account, networkId]);

  return (
    <Web3Context.Provider
      value={{
        web3,
        web3IsLoading,
        account,
        networkId,
        providerName,
        hasWallet,
        isUsingFallback,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

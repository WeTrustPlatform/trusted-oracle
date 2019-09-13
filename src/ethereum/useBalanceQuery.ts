import BigNumber from 'bn.js';
import React from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { useCurrency } from './CurrencyProvider';
import { useWeb3 } from './Web3Provider';

export const useFetchBalanceQuery = () => {
  const { account, web3 } = useWeb3();
  const { currency, tokenInstance } = useCurrency();

  const [_, fetch] = useAsyncFn(async () => {
    if (!account) throw new Error('Expected account');

    const balance = await (currency === 'ETH'
      ? web3.eth.getBalance(account)
      : tokenInstance.balanceOf.call(account));

    return balance as BigNumber;
  }, [account, web3, currency, tokenInstance]);

  return fetch;
};

export const useBalanceQuery = () => {
  const { account, web3, web3IsLoading } = useWeb3();
  const { currency, tokenInstance, isCurrencyLoading } = useCurrency();
  const fetchBalance = useFetchBalanceQuery();
  const [balance, setBalance] = React.useState(new BigNumber(0));

  const { loading } = useAsync(async () => {
    if (account) {
      const value = await fetchBalance();

      setBalance(value);
    }
  }, [account, web3, currency, tokenInstance]);

  const refetch = React.useCallback(async () => {
    const value = await fetchBalance();

    setBalance(value);
  }, [fetchBalance]);

  return {
    data: balance,
    loading: loading || web3IsLoading || isCurrencyLoading,
    refetch,
  };
};

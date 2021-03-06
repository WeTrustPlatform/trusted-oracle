import BigNumber from 'bn.js';
import React from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { useStore } from '../oracle/StoreProvider';
import { AsyncResult } from '../types/AsyncResult';
import { useCurrency } from './CurrencyProvider';
import { useWeb3 } from './Web3Provider';

export const useFetchBalanceQuery = () => {
  const { account, web3 } = useWeb3();
  const { currency, tokenInstance } = useCurrency();

  const [, fetch] = useAsyncFn(async () => {
    if (!account) return null;

    const balance = await (currency === 'ETH'
      ? new BigNumber(await web3.eth.getBalance(account))
      : tokenInstance
      ? tokenInstance.balanceOf.call(account)
      : null);

    return balance as BigNumber;
  }, [account, web3, currency, tokenInstance]);

  return fetch;
};

export const useBalanceQuery = () => {
  const { account, web3 } = useWeb3();
  const { currency, tokenInstance } = useCurrency();
  const fetchBalance = useFetchBalanceQuery();
  const { questions } = useStore();
  const [result, setBalance] = React.useState<AsyncResult<BigNumber>>({
    loading: true,
    data: new BigNumber(0),
  });

  useAsync(async () => {
    if (account) {
      const value = await fetchBalance();
      if (value) setBalance({ data: value, loading: false });
    }
  }, [account, web3, currency, tokenInstance, questions]);

  return result;
};

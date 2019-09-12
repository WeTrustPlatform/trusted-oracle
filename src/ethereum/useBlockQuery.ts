import React from 'react';

import { useWeb3 } from './Web3Provider';

export const useFetchBlock = () => {
  const { web3, web3IsLoading } = useWeb3();

  const fetchBlock = React.useCallback(
    async (blockNumber: number | 'latest') => {
      const block = await web3.eth.getBlock(blockNumber);

      return block;
    },
    [web3IsLoading, web3],
  );

  return fetchBlock;
};

import { useAsync } from 'react-use';

import { useWeb3 } from './Web3Provider';

export const useLatestBlockQuery = () => {
  const { web3, web3IsLoading } = useWeb3();
  const state = useAsync(async () => {
    if (web3IsLoading) return;

    const latestBlock = await web3.eth.getBlock('latest');

    return latestBlock.number;
  }, [web3IsLoading]);

  return {
    latestBlock: state.value || 0,
    loading: state.loading,
  };
};

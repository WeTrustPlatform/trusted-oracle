import { useWeb3 } from '@wetrustplatform/paramount-ethereum';
import { useAsync } from 'react-use';

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

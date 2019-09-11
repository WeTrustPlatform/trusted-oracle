import { useAsync } from 'react-use';
import makeTruffleContract from 'truffle-contract';

import { useWeb3 } from './Web3Provider';

export const useSmartContract = (contractData: any | null) => {
  const { web3, web3IsLoading } = useWeb3();

  const state = useAsync(async () => {
    if (web3IsLoading || !contractData) return;

    const contract = makeTruffleContract(contractData);
    contract.setProvider(web3.currentProvider);

    return contract;
  }, [web3IsLoading, contractData]);

  return {
    loading: state.loading || web3IsLoading,
    contract: state.value,
  };
};

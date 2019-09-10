import { useAsync } from 'react-use';
import makeTruffleContract from 'truffle-contract';

import { useWeb3 } from '../ethereum/Web3Provider';

// TODO: Support ETH
export const useSmartContract = (contractData: any) => {
  const { web3, web3IsLoading } = useWeb3();

  const state = useAsync(async () => {
    if (web3IsLoading) return;

    const contract = makeTruffleContract(contractData);
    contract.setProvider(web3.currentProvider);

    return contract;
  }, [web3IsLoading]);

  return {
    loading: state.loading,
    contract: state.value,
  };
};

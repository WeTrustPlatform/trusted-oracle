import { useAsync } from 'react-use';
import makeTruffleContract from 'truffle-contract';

import { useWeb3 } from '../ethereum/Web3Provider';
import { Currency } from './OracleProvider';

// TODO: Support ETH
export const useSmartContract = (currency: Currency, contractData: any) => {
  const { web3, web3IsLoading } = useWeb3();

  const state = useAsync(async () => {
    if (web3IsLoading) return;

    const ArbitratorContract = makeTruffleContract(contractData);
    ArbitratorContract.setProvider(web3.currentProvider);

    const contract = await ArbitratorContract.deployed();

    return contract;
  }, [web3IsLoading]);

  return {
    loading: state.loading,
    contract: state.value,
  };
};

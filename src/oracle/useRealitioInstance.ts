import RealitioETH from '@realitio/realitio-contracts/truffle/build/contracts/Realitio.json';
import RealitioTRST from '@realitio/realitio-contracts/truffle/build/contracts/Realitio.TRST.json';

import { Currency } from '../ethereum/CurrencyProvider';
import { useSmartContract } from './useSmartContract';
import { useAsync } from 'react-use';

const currencyToSmartContractMap: {
  [currency in Currency]: any;
} = {
  TRST: RealitioTRST,
  ETH: RealitioETH,
};

export const useRealitioInstance = (currency: Currency) => {
  const { contract, loading } = useSmartContract(
    currencyToSmartContractMap[currency],
  );

  const state = useAsync(async () => {
    const instance = await contract.deployed();

    return instance;
  }, [contract]);

  return { instance: state.value, loading: loading || state.loading };
};

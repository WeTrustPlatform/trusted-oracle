import ArbitratorETH from '@realitio/realitio-contracts/truffle/build/contracts/Arbitrator.json';
import ArbitratorTRST from '@realitio/realitio-contracts/truffle/build/contracts/Arbitrator.TRST.json';
import { Currency } from '../ethereum/CurrencyProvider';
import { useSmartContract } from './useSmartContract';

const currencyToSmartContractMap: {
  [currency in Currency]: any;
} = {
  TRST: ArbitratorTRST,
  ETH: ArbitratorETH,
};

export const useArbitratorContract = (currency: Currency) => {
  const { contract, loading } = useSmartContract(
    currencyToSmartContractMap[currency],
  );

  return { contract, loading };
};

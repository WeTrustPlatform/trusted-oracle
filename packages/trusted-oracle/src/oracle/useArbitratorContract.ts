// import ArbitratorETH from '@realitio/realitio-contracts/truffle/build/contracts/Arbitrator.json';
import ArbitratorTRST from '@realitio/realitio-contracts/truffle/build/contracts/Arbitrator.TRST.json';
import { Currency } from './OracleProvider';
import { useSmartContract } from './useSmartContract';

export const useArbitratorContract = (currency: Currency) => {
  const { contract, loading } = useSmartContract(currency, ArbitratorTRST);

  return { contract, loading };
};

// import RealitioETH from '@realitio/realitio-contracts/truffle/build/contracts/Realitio.json';
import RealitioTRST from '@realitio/realitio-contracts/truffle/build/contracts/Realitio.TRST.json';
import { Currency } from './OracleProvider';
import { useSmartContract } from './useSmartContract';

export const useRealitioContract = (currency: Currency) => {
  const { contract, loading } = useSmartContract(currency, RealitioTRST);

  return { contract, loading };
};

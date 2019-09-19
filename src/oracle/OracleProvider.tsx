import React from 'react';

import { useCurrency } from '../ethereum/CurrencyProvider';
import { useWeb3 } from '../ethereum/Web3Provider';
import { useArbitratorContract } from './useArbitratorContract';
import { useArbitratorList } from './useArbitratorList';
import { useRealitioInstance } from './useRealitioInstance';

interface OracleProviderProps {
  children?: React.ReactNode;
}

const INITIAL_BLOCKS = {
  1: 6531147,
  3: 0,
  4: 3175028, // for quicker loading start more like 4800000,
  42: 10350865,
  1337: 0,
} as const;

export interface Arbitrator {
  name: string;
  address: string;
}

export interface OracleContext {
  /** Realitio contract instance */
  realitio: any;
  /** Arbitrator contract */
  arbitratorContract: any;
  arbitratorList: Arbitrator[];
  initialBlockNumber: number;
  loading: boolean;
}

const OracleContext = React.createContext<OracleContext>({
  realitio: null,
  arbitratorContract: null,
  arbitratorList: [],
  loading: true,
  initialBlockNumber: 0,
});

export const useOracle = () => {
  return React.useContext(OracleContext);
};

export const OracleProvider = (props: OracleProviderProps) => {
  const { children } = props;
  const { currency } = useCurrency();
  const { networkId } = useWeb3();
  const { instance: realitio, loading: realitioLoading } = useRealitioInstance(
    currency,
  );
  const {
    contract: arbitratorContract,
    loading: arbitratorContractLoading,
  } = useArbitratorContract(currency);
  const arbitratorList = useArbitratorList(currency, networkId);
  const initialBlockNumber = INITIAL_BLOCKS[networkId];

  return (
    <OracleContext.Provider
      value={{
        realitio,
        arbitratorContract,
        loading: arbitratorContractLoading || realitioLoading,
        initialBlockNumber,
        arbitratorList,
      }}
    >
      {children}
    </OracleContext.Provider>
  );
};

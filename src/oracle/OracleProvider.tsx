import React from 'react';

import { useCurrency } from '../ethereum/CurrencyProvider';
import { useArbitratorContract } from './useArbitratorContract';
import { useRealitioInstance } from './useRealitioInstance';

// import ArbitratorList from '@realitio/realitio-contracts/config/arbitrators.json';
// import ArbitratorTRSTList from '@realitio/realitio-contracts/config/arbitrators.TRST.json';

interface OracleProviderProps {
  children?: React.ReactNode;
}

export interface OracleContext {
  /** Realitio contract instance */
  realitio: any;
  /** Arbitrator contract */
  arbitratorContract: any;
  loading: boolean;
}

const OracleContext = React.createContext<OracleContext>({
  realitio: null,
  arbitratorContract: null,
  loading: true,
});

export const useOracle = () => {
  return React.useContext(OracleContext);
};

export const OracleProvider = (props: OracleProviderProps) => {
  const { children } = props;
  const { currency } = useCurrency();
  const { instance: realitio, loading: realitioLoading } = useRealitioInstance(
    currency,
  );
  const {
    contract: arbitratorContract,
    loading: arbitratorContractLoading,
  } = useArbitratorContract(currency);

  return (
    <OracleContext.Provider
      value={{
        realitio,
        arbitratorContract,
        loading: arbitratorContractLoading || realitioLoading,
      }}
    >
      {children}
    </OracleContext.Provider>
  );
};

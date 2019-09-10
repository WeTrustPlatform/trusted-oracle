import React from 'react';

import { useArbitratorContract } from './useArbitratorContract';
import { useRealitioInstance } from './useRealitioInstance';

// import RealitioTemplates from '@realitio/realitio-lib/formatters/template.js';
// import ERC20TRST from '@realitio/realitio-contracts/truffle/build/contracts/ERC20.TRST.json';
// import ArbitratorList from '@realitio/realitio-contracts/config/arbitrators.json';
// import ArbitratorTRSTList from '@realitio/realitio-contracts/config/arbitrators.TRST.json';

interface OracleProviderProps {
  children?: React.ReactNode;
  initialCurrency: Currency;
}

export type Currency = 'ETH' | 'TRST';

export interface OracleContext {
  currency: Currency;
  /** Realitio contract instance */
  realitio: any;
  /** Arbitrator contract */
  arbitratorContract: any;
  loading: boolean;
  setCurrency: (currency: Currency) => void;
}

const OracleContext = React.createContext<OracleContext>({
  currency: 'TRST',
  realitio: null,
  arbitratorContract: null,
  loading: true,
  setCurrency: () => {},
});

export const useOracle = () => {
  return React.useContext(OracleContext);
};

export const OracleProvider = (props: OracleProviderProps) => {
  const { children, initialCurrency = 'TRST' } = props;
  const [currency, setCurrency] = React.useState(initialCurrency);

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
        currency,
        realitio,
        arbitratorContract,
        loading: arbitratorContractLoading || realitioLoading,
        setCurrency,
      }}
    >
      {children}
    </OracleContext.Provider>
  );
};

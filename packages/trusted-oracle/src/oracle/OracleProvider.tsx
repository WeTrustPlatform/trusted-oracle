import React from 'react';

import { useArbitratorContract } from './useArbitratorContract';
import { useRealitioContract } from './useRealitioContract';

// import RealitioQuestionUtils from '@realitio/realitio-lib/formatters/question.js';
// import RealitioTemplates from '@realitio/realitio-lib/formatters/template.js';
// import ERC20TRST from '@realitio/realitio-contracts/truffle/build/contracts/ERC20.TRST.json';
// import ArbitratorList from '@realitio/realitio-contracts/config/arbitrators.json';
// import ArbitratorTRSTList from '@realitio/realitio-contracts/config/arbitrators.TRST.json';
// import TEMPLATE_CONFIG from '@realitio/realitio-contracts/config/templates.json';

interface OracleProviderProps {
  children?: React.ReactNode;
}

export type Currency = 'ETH' | 'TRST';

export interface OracleContext {
  currency: Currency;
  realitioContract: any;
  arbitratorContract: any;
  loading: boolean;
}

const OracleContext = React.createContext<OracleContext>({
  currency: 'TRST',
  realitioContract: null,
  arbitratorContract: null,
  loading: true,
});

export const useOracle = () => {
  return React.useContext(OracleContext);
};

export const OracleProvider = (props: OracleProviderProps) => {
  const { children } = props;
  const { currency } = useOracle();
  const {
    contract: realitioContract,
    loading: realitioContractLoading,
  } = useRealitioContract(currency);
  const {
    contract: arbitratorContract,
    loading: arbitratorContractLoading,
  } = useArbitratorContract(currency);

  return (
    <OracleContext.Provider
      value={{
        currency,
        realitioContract,
        arbitratorContract,
        loading: arbitratorContractLoading || realitioContractLoading,
      }}
    >
      {children}
    </OracleContext.Provider>
  );
};

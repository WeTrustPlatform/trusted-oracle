import TEMPLATE_CONFIG from '@realitio/realitio-contracts/config/templates.json';
import React from 'react';

import { useArbitratorContract } from './useArbitratorContract';
import { useRealitioContract } from './useRealitioContract';

// import RealitioTemplates from '@realitio/realitio-lib/formatters/template.js';
// import ERC20TRST from '@realitio/realitio-contracts/truffle/build/contracts/ERC20.TRST.json';
// import ArbitratorList from '@realitio/realitio-contracts/config/arbitrators.json';
// import ArbitratorTRSTList from '@realitio/realitio-contracts/config/arbitrators.TRST.json';

interface OracleProviderProps {
  children?: React.ReactNode;
}

export type Currency = 'ETH' | 'TRST';
export interface QuestionTemplates {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
}

const getTemplates = (): QuestionTemplates => {
  return TEMPLATE_CONFIG.content;
};

export interface OracleContext {
  currency: Currency;
  realitioContract: any;
  arbitratorContract: any;
  loading: boolean;
  templates: QuestionTemplates;
}

const OracleContext = React.createContext<OracleContext>({
  currency: 'TRST',
  realitioContract: null,
  arbitratorContract: null,
  loading: true,
  templates: getTemplates(),
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
        templates: getTemplates(),
      }}
    >
      {children}
    </OracleContext.Provider>
  );
};

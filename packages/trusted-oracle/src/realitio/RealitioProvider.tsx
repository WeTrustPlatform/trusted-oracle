import React from 'react';

import { useArbitratorContract } from './useArbitratorContract';
import { useRealitioContract } from './useRealitioContract';

// import RealitioQuestionUtils from '@realitio/realitio-lib/formatters/question.js';
// import RealitioTemplates from '@realitio/realitio-lib/formatters/template.js';
// import ERC20TRST from '@realitio/realitio-contracts/truffle/build/contracts/ERC20.TRST.json';
// import ArbitratorList from '@realitio/realitio-contracts/config/arbitrators.json';
// import ArbitratorTRSTList from '@realitio/realitio-contracts/config/arbitrators.TRST.json';
// import TEMPLATE_CONFIG from '@realitio/realitio-contracts/config/templates.json';

interface RealitioProviderProps {
  children?: React.ReactNode;
}

export type Currency = 'ETH' | 'TRST';

export interface RealitioContext {
  currency: Currency;
  realitioContract: any;
  arbitratorContract: any;
  loading: boolean;
}

const RealitioContext = React.createContext<RealitioContext>({
  currency: 'TRST',
  realitioContract: null,
  arbitratorContract: null,
  loading: true,
});

export const useRealitio = () => {
  return React.useContext(RealitioContext);
};

export const RealitioProvider = (props: RealitioProviderProps) => {
  const { children } = props;
  const { currency } = useRealitio();
  const {
    contract: realitioContract,
    loading: realitioContractLoading,
  } = useRealitioContract(currency);
  const {
    contract: arbitratorContract,
    loading: arbitratorContractLoading,
  } = useArbitratorContract(currency);

  return (
    <RealitioContext.Provider
      value={{
        currency,
        realitioContract,
        arbitratorContract,
        loading: arbitratorContractLoading || realitioContractLoading,
      }}
    >
      {children}
    </RealitioContext.Provider>
  );
};

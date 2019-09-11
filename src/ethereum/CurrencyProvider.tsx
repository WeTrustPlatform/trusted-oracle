import React from 'react';

// import ERC20TRST from '@realitio/realitio-contracts/truffle/build/contracts/ERC20.TRST.json';

export type Currency = 'ETH' | 'TRST';

export interface CurrencyContext {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  token: any;
}

interface CurrencyProviderProps {
  children?: React.ReactNode;
  initialCurrency: Currency;
}

const CurrencyContext = React.createContext<CurrencyContext>({
  currency: 'TRST',
  setCurrency: () => {},
  token: null,
});

export const useCurrency = () => {
  return React.useContext(CurrencyContext);
};

export const CurrencyProvider = (props: CurrencyProviderProps) => {
  const { children, initialCurrency } = props;
  const [currency, setCurrency] = React.useState(initialCurrency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        token: null,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

import ArbitratorList from '@realitio/realitio-contracts/config/arbitrators.json';
import ArbitratorTRSTList from '@realitio/realitio-contracts/config/arbitrators.TRST.json';
import { Currency } from '../ethereum/CurrencyProvider';
import { NetworkId } from '../ethereum/Web3Provider';

const currencyToArbitratorListMap: {
  [currency in Currency]: any;
} = {
  TRST: ArbitratorTRSTList,
  ETH: ArbitratorList,
};

export const useArbitratorList = (currency: Currency, networkId: NetworkId) => {
  const arbitratorData = currencyToArbitratorListMap[currency];
  const arbitratorMap = arbitratorData[networkId];

  return Object.keys(arbitratorMap).map(address => ({
    name: arbitratorMap[address],
    address,
  }));
};

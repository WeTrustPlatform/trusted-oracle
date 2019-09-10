import BigNumber from 'bn.js';
import React from 'react';
import Web3 from 'web3';

import { Currency } from './OracleProvider';

const currencyInfoMap = {
  ETH: {
    decimals: new BigNumber('1000000000000000000'),
    smallNumber: 0.01 * 1000000000000000000,
  },
  TRST: {
    decimals: new BigNumber('1000000'),
    smallNumber: 100 * 1000000,
  },
};

export const formatCurrency = (
  bigNumber: BigNumber,
  currency: Currency = 'TRST',
) => {
  if (currency !== 'ETH') {
    return bigNumber.div(currencyInfoMap[currency].decimals).toNumber();
  }

  return Web3.utils.fromWei(bigNumber.toNumber(), 'ether');
};

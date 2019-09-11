import BigNumber from 'bn.js';
import Web3 from 'web3';

import { Currency } from './CurrencyProvider';

const currencyInfoMap = {
  ETH: {
    decimalsBn: new BigNumber('1000000000000000000'),
    decimals: 1000000000000000000,
    smallNumber: 0.01 * 1000000000000000000,
  },
  TRST: {
    decimalsBn: new BigNumber('1000000'),
    decimals: 1000000,
    smallNumber: 100 * 1000000,
  },
};

export const formatCurrency = (
  bigNumber: BigNumber,
  currency: Currency,
): string => {
  if (currency !== 'ETH') {
    const number = bigNumber
      .div(currencyInfoMap[currency].decimalsBn)
      .toNumber();

    // bn.js does not support decimals
    // so for small enough numbers (less than 1 rounded to 0) we use normal division
    if (number === 0) {
      return (
        bigNumber.toNumber() / currencyInfoMap[currency].decimals
      ).toString();
    }

    return number.toString();
  }

  return Web3.utils.fromWei(bigNumber.toString(), 'ether');
};

export const toBigNumber = (amount: string, currency: Currency) => {
  if (currency !== 'ETH') {
    return new BigNumber(amount).mul(currencyInfoMap[currency].decimalsBn);
  }

  return new BigNumber(Web3.utils.toWei(amount, 'ether'));
};

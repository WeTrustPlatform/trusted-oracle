import web3 from 'web3';

export const trimAddress = (address: string, front = 6, end = 6) => {
  if (!address) return '';

  const endString = address.substring(address.length - end);
  const startString = address.substring(0, front);
  return `${startString}...${endString}`;
};

export const getGasPrice = async () => {
  let price = 20;

  try {
    const req = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
    const json = await req.json();
    // oracle return gwei * 10
    price = Math.ceil(json.fast / 10);
  } catch (e) {
    console.log(e);
  }

  return price;
};

const WEI_IN_ETH = 1000000000000000000;

const getFormattedWei = (wei: string) => {
  const correctedWei =
    wei.lastIndexOf('.') < 0 ? wei : wei.substring(0, wei.lastIndexOf('.'));

  return correctedWei;
};

const trimWei = (wei: string, decimals = 3) => {
  if (!Number(wei)) return '0';
  // Note, decimals are not supported.
  // Removes decimals from string
  const formattedWei = getFormattedWei(wei);

  const weiNumber = web3.utils.toBN(formattedWei);
  const tens = Math.pow(10, decimals);

  const denominator = web3.utils.toBN(WEI_IN_ETH / tens);
  const trimmedWei = weiNumber.divRound(denominator).mul(denominator);

  return trimmedWei.toString();
};

export const toEth = (wei: string, decimals = 3) => {
  const trimmedWei = trimWei(wei, decimals);
  return web3.utils.fromWei(trimmedWei);
};

export const networkIdToNameMap = {
  1: 'MainNet',
  2: 'Morden',
  3: 'Ropsten',
  4: 'Rinkeby',
  5: 'Goerli',
  42: 'Kovan',
} as const;

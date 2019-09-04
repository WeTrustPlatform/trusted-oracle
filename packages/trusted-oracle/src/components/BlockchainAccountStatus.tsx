import {
  networkIdToNameMap,
  trimAddress,
  useWeb3,
  useWeb3Dialogs,
} from '@wetrustplatform/paramount-ethereum';
import { Box, Text, ThemeContext } from 'paramount-ui';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { config } from '../config';

export const BlockchainAccountStatus = () => {
  const { account, hasWallet, networkId } = useWeb3();
  const {
    setShowRequireMetamaskSetup,
    setShowRequireWalletSignIn,
  } = useWeb3Dialogs();
  const isConnected = account && networkId === config.networkId && hasWallet;
  const theme = React.useContext(ThemeContext);

  React.useEffect(() => {
    if (account) {
      setShowRequireWalletSignIn(false);
    }
  }, [account, setShowRequireWalletSignIn]);

  const handlePress = React.useCallback(() => {
    if (!hasWallet) {
      setShowRequireMetamaskSetup(true);
    } else if (!account) {
      setShowRequireWalletSignIn(true);
    }
  }, [
    hasWallet,
    account,
    setShowRequireWalletSignIn,
    setShowRequireMetamaskSetup,
  ]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Box
        testID="BLOCKCHAIN_ACCOUNT_STATUS"
        height={48}
        borderWidth={1}
        paddingVertical={8}
        paddingHorizontal={16}
        justifyContent="center"
        shape="rounded"
        flexDirection="row"
        alignItems="center"
        borderColor={theme.colors.border.default}
      >
        {isConnected && (
          <Box paddingRight={16}>
            <img
              width={16}
              height={16}
              src="/metamask-account-icon.svg"
              alt="metamask account icon"
            />
          </Box>
        )}
        <Box>
          <Text size="small">
            {hasWallet
              ? isConnected && account
                ? trimAddress(account)
                : `Connect to ${networkIdToNameMap[config.networkId]}`
              : `Not connected`}
          </Text>
        </Box>
      </Box>
    </TouchableOpacity>
  );
};

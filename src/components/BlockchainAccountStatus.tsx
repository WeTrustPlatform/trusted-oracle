import { Box, Text, ThemeContext } from 'paramount-ui';
import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { withRouter } from 'react-router';

import { trimAddress } from '../ethereum/EthUtils';
import { useWeb3Dialogs } from '../ethereum/Web3DialogsProvider';
import { useWeb3 } from '../ethereum/Web3Provider';

export const BlockchainAccountStatus = withRouter(props => {
  const { history } = props;
  const { account, hasWallet, isConnected, web3IsLoading } = useWeb3();
  const { ensureHasConnected } = useWeb3Dialogs();
  const theme = React.useContext(ThemeContext);

  const handlePress = React.useCallback(() => {
    if (ensureHasConnected()) {
      history.push('/my-account');
    }
  }, [hasWallet, account, ensureHasConnected]);

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
        {account && (
          <Box paddingRight={16}>
            <Image
              source={{
                uri: require('../assets/images/metamask-account-icon.svg'),
                height: 16,
                width: 16,
              }}
              accessibilityLabel="metamask account icon"
            />
          </Box>
        )}
        <Box>
          <Text size="small">
            {web3IsLoading
              ? 'Loading...'
              : hasWallet
              ? isConnected
                ? account
                  ? trimAddress(account)
                  : `Sign in your wallet`
                : 'Connect to app'
              : `Connect to wallet`}
          </Text>
        </Box>
      </Box>
    </TouchableOpacity>
  );
});

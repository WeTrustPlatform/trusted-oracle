import { Box, Heading, Text } from 'paramount-ui';
import React from 'react';

import { FindMetamaskInstructions } from './FindMetamaskInstructions';

export const RequireMetamaskPrivacyApproval = () => {
  return (
    <Box padding={48} alignItems="center">
      <Heading size="xxxlarge" color="secondary">
        Connect to MetaMask
      </Heading>
      <Box paddingVertical={16}>
        <img alt="connect-metamask" src="/connect-metamask.png" />
      </Box>
      <Box paddingBottom={24}>
        <Text size="large" align="center">
          To continue, please connect to your MetaMask wallet.
        </Text>
      </Box>
      <FindMetamaskInstructions />
    </Box>
  );
};

import { Box, Heading, Text } from 'paramount-ui';
import React from 'react';

export const RequireMetamaskPrivacyApproval = () => {
  return (
    <Box padding={48} alignItems="center">
      <Heading size="xxxlarge" color="secondary">
        Connect to MetaMask
      </Heading>
      <Box paddingBottom={24}>
        <Text size="large" align="center">
          To continue, please enable the application to connect with Metamask.
        </Text>
      </Box>
    </Box>
  );
};

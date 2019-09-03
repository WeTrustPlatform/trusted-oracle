import { Box, ThemeContext, useLayout } from 'paramount-ui';
import React from 'react';

import { Link, LinkProps } from './Link';

const ProductLink = (props: LinkProps) => {
  const theme = React.useContext(ThemeContext);

  return (
    <Link
      {...props}
      style={{
        fontFamily: theme.fontFamilies.text,
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
      }}
    />
  );
};

export const FamilyOfProducts = () => {
  const { getResponsiveValue } = useLayout();

  const paddingBottom = getResponsiveValue({
    xsmall: '16px',
    xlarge: '0px',
  });

  return (
    <>
      <Box paddingRight={40} paddingBottom={paddingBottom}>
        <ProductLink to="https://www.wetrust.io" isExternal>
          <img
            alt="WeTrust"
            src="https://d1pzjb43ehhiia.cloudfront.net/logo-images/wetrust-global-logo.svg"
          />
        </ProductLink>
      </Box>
      <Box paddingRight={40} paddingBottom={paddingBottom}>
        <ProductLink to="https://spring.wetrust.io" isExternal>
          <img
            alt="Spring"
            src="https://d1pzjb43ehhiia.cloudfront.net/logo-images/spring-global-logo.svg"
          />
        </ProductLink>
      </Box>
      <Box paddingRight={40} paddingBottom={paddingBottom}>
        <ProductLink to="https://staking.wetrust.io" isExternal>
          <img
            alt="Staking"
            src="https://d1pzjb43ehhiia.cloudfront.net/logo-images/staking-global-logo.svg"
          />
        </ProductLink>
      </Box>
      <Box paddingRight={40} paddingBottom={paddingBottom}>
        <ProductLink to="https://tlc.wetrust.io" isExternal>
          <img
            alt="TLC"
            src="https://d1pzjb43ehhiia.cloudfront.net/logo-images/trusted-lending-circles-global-logo.svg"
          />
        </ProductLink>
      </Box>
      <Box paddingRight={40} paddingBottom={paddingBottom}>
        <ProductLink to="https://cryptounlocked.wetrust.io/" isExternal>
          <img
            alt="CryptoUnlocked"
            src="https://d1pzjb43ehhiia.cloudfront.net/logo-images/crypto-unlocked-global-logo.svg"
          />
        </ProductLink>
      </Box>
    </>
  );
};

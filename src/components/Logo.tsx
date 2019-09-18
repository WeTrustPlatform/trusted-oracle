import { useLayout } from 'paramount-ui';
import React from 'react';

import { Link } from './Link';
import { WebImage } from './WebImage';

export const Logo = () => {
  const { getResponsiveValue } = useLayout();

  return (
    <Link
      to="/"
      style={{
        alignItems: 'center',
        display: 'flex',
        textDecoration: 'none',
      }}
    >
      <WebImage
        alt="trusted-oracle-logo"
        src={getResponsiveValue({
          xlarge: require('../assets/images/logo.svg'),
          xsmall: require('../assets/images/logo-mobile.svg'),
        })}
      />
    </Link>
  );
};

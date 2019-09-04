import React from 'react';

import { Link } from './Link';
import { WebImage } from './WebImage';

export const Logo = () => {
  return (
    <Link
      to="/"
      style={{
        alignItems: 'center',
        display: 'flex',
        textDecoration: 'none',
      }}
    >
      <WebImage alt="trusted-oracle-logo" src={require('../images/logo.svg')} />
    </Link>
  );
};

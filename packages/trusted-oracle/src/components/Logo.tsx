import { Heading } from 'paramount-ui';
import React from 'react';

import { Link } from './Link';

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
      <Heading
        style={{
          fontSize: 24,
          fontWeight: '900',
          color: '#67c6bb',
        }}
      >
        Trusted Oracle
      </Heading>
    </Link>
  );
};

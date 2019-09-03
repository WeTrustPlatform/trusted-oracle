import { ThemeContext } from 'paramount-ui';
import React from 'react';
import { Link as RRLink } from 'react-router-dom';

export interface LinkProps {
  testID?: string;
  to: string;
  isExternal?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Link = (props: LinkProps) => {
  const { testID, to, children, style, onClick } = props;
  const theme = React.useContext(ThemeContext);

  return (
    <RRLink
      style={{
        color: theme.colors.text.link,
        fontFamily: theme.fontFamilies.text,
        textDecoration: 'none',
        ...style,
      }}
      data-testid={testID}
      to={to}
      onClick={onClick}
    >
      {children}
    </RRLink>
  );
};

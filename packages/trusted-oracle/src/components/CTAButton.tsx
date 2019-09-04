import { Button, ButtonProps } from 'paramount-ui';
import React from 'react';

export const CTAButton = (props: ButtonProps) => {
  return (
    <Button
      color="primary"
      size="large"
      getStyles={({ appearance }, theme) => {
        if (appearance === 'outline') {
          return {
            touchableStyle: {
              backgroundColor: 'transparent',
              borderColor: '#eb7209',
              borderWidth: 1,
              width: 280,
              // paddingLeft: 80,
              // paddingRight: 80,
            },
            textStyle: {
              color: '#eb7209',
            },
          };
        }

        return {
          touchableStyle: {
            width: 280,
            // paddingLeft: 80,
            // paddingRight: 80,
          },
        };
      }}
      {...props}
    />
  );
};

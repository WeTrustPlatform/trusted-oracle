import { Button, ButtonProps } from 'paramount-ui';
import React from 'react';

export const CTAButton = (props: ButtonProps) => {
  return (
    <Button
      color="primary"
      getStyles={({ appearance, isLoading }, theme) => {
        if (appearance === 'outline') {
          return {
            touchableStyle: {
              backgroundColor: 'transparent',
              borderColor: '#eb7209',
              borderWidth: 1,
              width: 280,
            },
            textStyle: {
              color: '#eb7209',
              fontSize: 18,
            },
          };
        }

        return {
          touchableStyle: {
            width: 280,
            backgroundColor: '#e98100',
          },
          textStyle: {
            fontSize: 18,
          },
        };
      }}
      {...props}
    />
  );
};

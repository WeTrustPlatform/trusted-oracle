import { History } from 'history';
import { Box, Dialog, Icon, useLayout } from 'paramount-ui';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export interface CustomDialogProps {
  children?: React.ReactNode;
  history: History;
}

export const CustomDialog = (props: CustomDialogProps) => {
  const { history, children } = props;
  const layout = useLayout();

  return (
    <Dialog
      isVisible
      onRequestClose={() => history.replace('/')}
      getStyles={(_, theme) => ({
        modalContainerStyle: {
          overflow: 'scroll',
          backgroundColor: theme.colors.background.overlay,
        },
        overlayStyle: {
          backgroundColor: 'transparent',
        },
        containerStyle: {
          width: '100%',
          maxWidth: layout.containerSizes.xlarge,
          overflow: 'visible',
        },
        bodyStyle: {
          maxHeight: 756,
          overflow: 'visible',
        },
      })}
    >
      <Box marginTop={-60} alignItems="flex-end">
        <TouchableOpacity onPress={() => history.replace('/')}>
          <Icon name="x" size={60} color="#fff" />
        </TouchableOpacity>
      </Box>
      {children}
    </Dialog>
  );
};

import { Popover, Position } from 'paramount-ui';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Hoverable } from './Hoverable';

export interface TooltipProps {
  children?: React.ReactNode;
  content?: React.ReactNode;
  position?: Position;
}

export const Tooltip = (props: TooltipProps) => {
  const { content, children, position } = props;

  return (
    <Hoverable>
      {isHovered => (
        <TouchableOpacity>
          <Popover position={position} isVisible={isHovered} content={content}>
            {children}
          </Popover>
        </TouchableOpacity>
      )}
    </Hoverable>
  );
};

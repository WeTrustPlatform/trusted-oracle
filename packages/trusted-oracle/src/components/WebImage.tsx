import React from 'react';

export const WebImage = (
  props: React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >,
) => {
  return <img style={{ maxWidth: '100%' }} {...props} />;
};

import React from 'react';

export interface WebImageProps
  extends React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  > {
  alt: string;
}
export const WebImage = (props: WebImageProps) => {
  const { alt, ...restProps } = props;

  return <img style={{ maxWidth: '100%' }} alt={alt} {...restProps} />;
};

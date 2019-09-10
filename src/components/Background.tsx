import React from 'react';
import { ImageBackground } from 'react-native';

export interface BackgroundProps {
  pattern: 'dotted' | 'textured';
  children?: React.ReactNode;
}

export const Background = (props: BackgroundProps) => {
  const { children, pattern = 'textured' } = props;

  if (pattern === 'dotted') {
    return (
      <ImageBackground
        source={{ uri: require('../assets/images/dotted-bg.png') }}
        resizeMode="cover"
      >
        {children}
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={{ uri: require('../assets/images/textured-bg.jpg') }}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
};

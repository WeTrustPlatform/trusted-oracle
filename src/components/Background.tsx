import React from 'react';

export interface BackgroundProps {
  pattern: 'dotted' | 'textured';
  children?: React.ReactNode;
}

export const Background = (props: BackgroundProps) => {
  const { children, pattern = 'textured' } = props;

  if (pattern === 'dotted') {
    return (
      <div
        style={{
          backgroundImage: `url('/dotted-bg.png')`,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundImage: `url('/textured-bg.jpg')`,
      }}
    >
      {children}
    </div>
  );
};

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
          backgroundImage: `url('https://res.cloudinary.com/wetrust-cryptounlocked/image/upload/c_crop,w_400/v1568706049/dotted-bg.png')`,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundImage: `url('https://res.cloudinary.com/wetrust-cryptounlocked/image/upload/c_crop,w_400/v1568706049/textured-bg.png')`,
      }}
    >
      {children}
    </div>
  );
};

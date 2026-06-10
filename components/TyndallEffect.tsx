
import React, { CSSProperties } from 'react';

interface TyndallEffectProps {
  children: React.ReactNode;
  streakColor?: string;
}

const TyndallEffect: React.FC<TyndallEffectProps> = ({ 
  children, 
  streakColor = 'rgb(255, 255, 255)' 
}) => {
  const wrapperStyle: CSSProperties = {
    '--streak-color': streakColor,
  } as CSSProperties;

  return (
    <div className="sui-tyndall-effect" style={wrapperStyle}>
      <div className="streak streak-1" />
      <div className="streak streak-2" />
      <div className="streak streak-3" />
      <div className="overlay" />
      {children}
    </div>
  );
};

export default TyndallEffect;
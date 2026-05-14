import React from 'react';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 40 }) => {
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none"
    >
      <Defs>
        <LinearGradient id="halo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#76B9B3" />
          <Stop offset="100%" stopColor="#4A8EB2" />
        </linearGradient>
      </Defs>
      
      {/* Outer Circle Ring */}
      <Circle 
        cx="50" 
        cy="50" 
        r="40" 
        stroke="url(#halo-grad)" 
        strokeWidth="6" 
      />
      
      {/* Pet Ear Silhouette / Accent */}
      <Path 
        d="M25 40C25 30 35 20 45 20C40 30 40 45 45 55" 
        stroke="url(#halo-grad)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Checkmark */}
      <Path 
        d="M40 50L48 58L65 40" 
        stroke="url(#halo-grad)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Logo;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { RadialGradient, Defs, Stop, Rect } from 'react-native-svg';
import { useColorScheme } from './useColorScheme';

export function GradedBackground() {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow1" cx="20%" cy="30%" rx="50%" ry="50%" fx="20%" fy="30%">
            <Stop offset="0%" stopColor="#6366f1" stopOpacity={colorScheme === 'dark' ? 0.09 : 0.04} />
            <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow2" cx="80%" cy="15%" rx="50%" ry="50%" fx="80%" fy="15%">
            <Stop offset="0%" stopColor="#ff6b00" stopOpacity={colorScheme === 'dark' ? 0.07 : 0.03} />
            <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow3" cx="60%" cy="75%" rx="50%" ry="50%" fx="60%" fy="75%">
            <Stop offset="0%" stopColor="#ccff00" stopOpacity={colorScheme === 'dark' ? 0.05 : 0.02} />
            <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow1)" />
        <Rect width="100%" height="100%" fill="url(#glow2)" />
        <Rect width="100%" height="100%" fill="url(#glow3)" />
      </Svg>
    </View>
  );
}

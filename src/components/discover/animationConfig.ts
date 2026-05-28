import { Easing } from 'react-native-reanimated';

export const SPRING_SNAPPY = { damping: 14, stiffness: 180, mass: 0.8 };
export const SPRING_BOUNCY = { damping: 10, stiffness: 140, mass: 0.9 };
export const SPRING_SOFT = { damping: 20, stiffness: 120 };

export const EASE_OUT = Easing.out(Easing.cubic);
export const LOOP_FLOAT_MS = 2800;
export const AUTO_CAROUSEL_MS = 4200;

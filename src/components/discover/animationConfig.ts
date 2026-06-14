import { Easing } from 'react-native-reanimated';
import { motion } from '../../theme/motion';

export const SPRING_SNAPPY = motion.spring.snappy;
export const SPRING_BOUNCY = motion.spring.bouncy;
export const SPRING_SOFT = motion.spring.smooth;

export const EASE_OUT = Easing.out(Easing.cubic);
export const LOOP_FLOAT_MS = 2800;
export const AUTO_CAROUSEL_MS = 4200;

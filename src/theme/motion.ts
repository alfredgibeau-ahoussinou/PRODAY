import { Easing } from 'react-native-reanimated';

/** Tokens motion ProDay — transitions cohérentes dans toute l’app */
export const motion = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 320,
    modal: 280,
  },
  spring: {
    snappy: { damping: 22, stiffness: 220, mass: 0.7 },
    smooth: { damping: 26, stiffness: 180, mass: 0.8 },
    bouncy: { damping: 18, stiffness: 160, mass: 0.8 },
    sheet: { damping: 24, stiffness: 200, mass: 0.85 },
  },
  easing: {
    out: Easing.out(Easing.cubic),
    in: Easing.in(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  /** Déplacement horizontal des écrans (onglets / push) */
  screenShift: 36,
  modalBackdrop: 'rgba(0,0,0,0.52)',
} as const;

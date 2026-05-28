import { Easing } from 'react-native-reanimated';

/** Tokens motion ProDay — transitions cohérentes dans toute l’app */
export const motion = {
  duration: {
    fast: 180,
    normal: 280,
    slow: 420,
    modal: 340,
  },
  spring: {
    snappy: { damping: 16, stiffness: 200, mass: 0.75 },
    smooth: { damping: 22, stiffness: 160, mass: 0.85 },
    bouncy: { damping: 12, stiffness: 140, mass: 0.9 },
    sheet: { damping: 20, stiffness: 180, mass: 0.9 },
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

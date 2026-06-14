export const nextMotion = {
  spring: {
    snappy: { damping: 22, stiffness: 320, mass: 0.8 },
    soft: { damping: 26, stiffness: 180, mass: 1 },
    bouncy: { damping: 14, stiffness: 280, mass: 0.9 },
  },
  duration: {
    fast: 180,
    normal: 280,
    slow: 420,
  },
  stagger: 55,
} as const;

/**
 * ProDay — Design Tokens Officiels Fitness Park
 * Inspiré directement de l'application Fitness Park officielle (Septembre 2026).
 */

export const FITNESS_PARK = {
  // 1. Palette de Fond & Surfaces
  bg: '#0B0F14',          // Fond d'écran anthracite profond / bleu nuit
  bgHeader: '#003399',    // Bleu électrique athlétique haut de page
  bgHeaderGradient: ['#0044CC', '#002277', '#0B0F14'] as const,
  surface: '#161F2C',     // Carte groupée / tuile principale
  surfaceRaised: '#1E2838', // Surface surélevée / card hover
  surfaceSubtle: '#111722', // Fond discret pour champs et inputs
  divider: '#243142',     // Trait fin de séparation dans les listes groupées
  border: '#28374D',      // Bordure de carte

  // 2. Accents
  accentYellow: '#FFD200', // Jaune signature iconique Fitness Park
  accentYellowDim: 'rgba(255, 210, 0, 0.15)',
  accentYellowBorder: 'rgba(255, 210, 0, 0.4)',
  accentBlue: '#0066FF',   // Bleu dynamique
  accentBlueSoft: 'rgba(0, 102, 255, 0.15)',

  // 3. Typographie & Contrastes
  textWhite: '#FFFFFF',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  textDark: '#0B0F14',

  // 4. Badges et Statuts
  statusGreen: '#10B981',
  statusGreenBg: 'rgba(16, 185, 129, 0.15)',
  statusOrange: '#F59E0B',
  statusOrangeBg: 'rgba(245, 158, 11, 0.15)',
  statusRed: '#EF4444',
  statusRedBg: 'rgba(239, 68, 68, 0.15)',

  // 5. Dock Bas
  dockBg: 'rgba(17, 23, 34, 0.96)',
  dockBorder: '#1E2B3D',
  dockCenterBtn: '#FFD200',
  dockCenterIcon: '#0B0F14',
} as const;

export const FITNESS_PARK_RADIUS = {
  card: 18,
  cardLarge: 22,
  pill: 999,
  input: 12,
  badge: 8,
} as const;

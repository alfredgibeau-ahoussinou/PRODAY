const fs = require('fs');
let file = fs.readFileSync('src/features/coach/shell/CoachMenuToolGrid.tsx', 'utf8');

const targetTileStyle = `tile: {
      backgroundColor: tokens.surface,
      borderRadius: 16,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      gap: spacing.sm,
      minHeight: 110,
      justifyContent: 'center',
    },`;

const newTileStyle = `tile: {
      backgroundColor: tokens.bg,
      borderRadius: 20,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.sm,
      minHeight: 110,
      justifyContent: 'center',
      shadowColor: tokens.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },`;

file = file.replace(targetTileStyle, newTileStyle);

const targetIconCircle = `iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },`;

const newIconCircle = `iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: tokens.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.border,
    },`;
    
file = file.replace(targetIconCircle, newIconCircle);

fs.writeFileSync('src/features/coach/shell/CoachMenuToolGrid.tsx', file);

const fs = require('fs');
let file = fs.readFileSync('src/features/coach/shell/CoachMenuToolGrid.tsx', 'utf8');

// 1. Change tile layout to horizontal row
const targetTile = `      <View style={[styles.tile, locked && styles.tileLocked]}>
        {item.aiBadge ? (
          <View style={styles.aiBadge}>
            <CoachText variant="caption" accent style={styles.aiBadgeText}>
              IA
            </CoachText>
          </View>
        ) : null}

        <View style={styles.iconCircle}>
          <Icon
            name={item.icon}
            size={22}
            color={locked ? tokens.muted : tokens.accent}
            variant="filled"
          />
        </View>

        <View>
          <CoachText
            variant="body"
            style={[styles.tileLabel, locked && styles.tileLabelLocked]}
            numberOfLines={1}
          >
            {item.label}
          </CoachText>
        </View>
      </View>`;

const newTile = `      <View style={[styles.tile, locked && styles.tileLocked]}>
        <View style={styles.iconCircle}>
          <Icon
            name={item.icon}
            size={22}
            color={locked ? tokens.muted : tokens.accent}
            variant="filled"
          />
        </View>

        <View style={{ flex: 1 }}>
          <CoachText
            variant="body"
            style={[styles.tileLabel, locked && styles.tileLabelLocked]}
            numberOfLines={1}
          >
            {item.label}
          </CoachText>
        </View>
        
        {item.aiBadge ? (
          <View style={[styles.aiBadge, { position: 'relative', top: 0, right: 0, marginRight: 8 }]}>
            <CoachText variant="caption" accent style={styles.aiBadgeText}>
              IA
            </CoachText>
          </View>
        ) : null}
        
        <Icon name="chevron-forward" size={20} color={tokens.muted} />
      </View>`;

file = file.replace(targetTile, newTile);

// 2. Fix the styles to be a vertical list row
const targetStyles = `    tileWrap: { flex: 1, minWidth: '45%' },
    tile: {
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
    },
    tileLocked: { opacity: 0.6 },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: tokens.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    tileLabel: { fontWeight: '700', color: tokens.foreground },
    tileLabelLocked: { color: tokens.muted },
    aiBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: tokens.accent + '22',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    aiBadgeText: { fontSize: 9, fontWeight: '800' },
  });
}`;

const newStyles = `    tileWrap: { width: '100%' },
    tile: {
      flexDirection: 'row',
      backgroundColor: tokens.surface,
      borderRadius: 16,
      padding: spacing.md,
      alignItems: 'center',
      gap: spacing.md,
    },
    tileLocked: { opacity: 0.6 },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileLabel: { fontWeight: '700', color: tokens.foreground, fontSize: 16 },
    tileLabelLocked: { color: tokens.muted },
    aiBadge: {
      backgroundColor: tokens.accent + '22',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    aiBadgeText: { fontSize: 10, fontWeight: '800' },
  });
}`;

file = file.replace(targetStyles, newStyles);

const targetGrid = `    groupGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },`;

const newGrid = `    groupGrid: {
      flexDirection: 'column',
      gap: spacing.sm,
    },`;

file = file.replace(targetGrid, newGrid);

fs.writeFileSync('src/features/coach/shell/CoachMenuToolGrid.tsx', file);

const fs = require('fs');
let file = fs.readFileSync('src/features/coach/shell/CoachTabBar.tsx', 'utf8');

const targetRootStyle = `root: {
      backgroundColor: tokens.surface,
      position: 'absolute',
      bottom: 24,
      left: 20,
      right: 20,
      borderRadius: 36,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingTop: 0,
      zIndex: 100,
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
    },`;

const newRootStyle = `root: {
      backgroundColor: tokens.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      paddingTop: 8,
      flexShrink: 0,
      zIndex: 20,
    },`;

file = file.replace(targetRootStyle, newRootStyle);

// Restore paddingBottom to Math.max(insets.bottom, 6)
const targetReturn = `return (
    <View style={[styles.root, { paddingBottom: 0 }]}>
      <View style={[styles.row, { paddingBottom: 0 }]}>`;

const newReturn = `return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.row}>`;

file = file.replace(targetReturn, newReturn);

const targetTab = `tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minHeight: 64,
      paddingHorizontal: 2,
      paddingTop: 4,
      paddingBottom: 8,
      position: 'relative',
    },`;

const newTab = `tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minHeight: 48,
      paddingHorizontal: 2,
      position: 'relative',
    },`;

file = file.replace(targetTab, newTab);

// Hide the indicator dot entirely for a cleaner iOS look (just rely on colors)
const targetIndicator = `indicator: {
      position: 'absolute',
      bottom: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },`;

const newIndicator = `indicator: {
      display: 'none',
    },`;

file = file.replace(targetIndicator, newIndicator);

fs.writeFileSync('src/features/coach/shell/CoachTabBar.tsx', file);

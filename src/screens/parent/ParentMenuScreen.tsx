import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import { ParentSectionCard } from '../../components/parent/parentPortalUi';
import { PARENT_PAGES } from '../../content/parentPageIdentity';
import { PARENT_MENU_TOOLS } from '../../features/parent/navigation/parentNavConfig';
import { useParentShellNav } from '../../features/parent/shell/ParentShellNavContext';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';

/** Hub Menu — messages, agenda, trajet (hors dock). */
export const ParentMenuScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const shellNav = useParentShellNav();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <ParentPageFrame identity={PARENT_PAGES.plus} showHero>
      <ScrollView contentContainerStyle={styles.content}>
        <ParentSectionCard
          title="Outils famille"
          subtitle="Les actions du quotidien, regroupées ici"
        >
          {PARENT_MENU_TOOLS.map((tool) => (
            <PressableSpring
              key={tool.id}
              onPress={() => shellNav?.requestNav(tool.id)}
              scaleTo={0.98}
              haptic
              style={[styles.row, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: c.brandSoft }]}>
                <Icon name={tool.icon} size={18} color={c.brand} />
              </View>
              <View style={styles.copy}>
                <ProDayText variant="body" style={{ fontWeight: '700' }}>
                  {tool.label}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {tool.hint}
                </ProDayText>
              </View>
              <Icon name="chevron-forward" size={16} color={c.textMuted} />
            </PressableSpring>
          ))}
        </ParentSectionCard>
      </ScrollView>
    </ParentPageFrame>
  );
};

function createStyles(c: { border: string; surfaceMuted: string; brandSoft: string }) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.brandSoft,
    },
    copy: { flex: 1, gap: 2 },
  });
}

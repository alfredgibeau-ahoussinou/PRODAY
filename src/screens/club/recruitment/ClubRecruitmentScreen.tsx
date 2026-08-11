import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MercatoScreen } from '../../MercatoScreen';
import { HomeScreen } from '../../HomeScreen';
import { ClubRecruitmentKanban } from '../../../components/club/ClubRecruitmentKanban';
import { ClubShell } from '../shared/clubShell';
import { ClubSectionCard, ClubActionRow } from '../../../components/club/clubPortalUi';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useProductLine, useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';

type Mode = 'kanban' | 'annonces';

/** Recrutement club — pipeline d’abord, annonces ensuite. */
export const ClubRecruitmentScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { productLine } = useProductLine();
  const { colors } = useAppTheme();
  const isAmateur = productLine === 'amateur';
  const [mode, setMode] = useState<Mode>('kanban');

  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }

  if (mode === 'annonces') {
    return (
      <View style={styles.wrap}>
        <PressableSpring
          onPress={() => setMode('kanban')}
          scaleTo={0.97}
          haptic
          style={[styles.backBar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}
        >
          <ProDayText variant="caption" accent style={styles.backText}>
            ← Pipeline Observé → Intégré
          </ProDayText>
        </PressableSpring>
        <View style={styles.fill}>
          <MercatoScreen postScope={isAmateur ? 'amateur' : 'pro'} />
        </View>
      </View>
    );
  }

  return (
    <ClubShell
      pageId="pipeline"
      caption="Recrutement"
      title="Pipeline Observé → Intégré"
      subtitle="Après le vivier interne (Organisation → Vivier)."
      profile={profile}
      scroll={false}
    >
      <View style={styles.modes}>
        <PressableSpring
          onPress={() => setMode('kanban')}
          scaleTo={0.97}
          style={[
            styles.modePill,
            { backgroundColor: colors.accentSoft, borderColor: colors.accent },
          ]}
        >
          <ProDayText variant="caption" accent style={styles.modeText}>
            Pipeline
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          onPress={() => setMode('annonces')}
          scaleTo={0.97}
          style={[styles.modePill, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <ProDayText variant="caption" muted style={styles.modeText}>
            Annonces
          </ProDayText>
        </PressableSpring>
      </View>

      <View style={styles.pad}>
        <ClubSectionCard
          kicker="Ordre"
          title="Vivier d’abord"
          body="Les montées internes se gèrent dans Accueil → Vivier. Ici : candidatures externes."
        >
          <ClubActionRow primary="Voir les annonces" onPrimary={() => setMode('annonces')} />
        </ClubSectionCard>
      </View>
      <View style={styles.fill}>
        <ClubRecruitmentKanban />
      </View>
    </ClubShell>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  modes: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  modePill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  modeText: { fontWeight: '700' },
  pad: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  fill: { flex: 1, minHeight: 0 },
  backBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backText: { fontWeight: '700' },
});

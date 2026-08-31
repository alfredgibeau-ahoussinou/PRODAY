import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachText,
} from '../../../components/coach/coachPortalUi';
import { CoachScreenHeader } from '../../../components/coach/CoachScreenHeader';
import { ShellAccountSection } from '../../../components/shell/ShellAccountSection';
import { getCoachPageIdentity } from '../../../content/coachPageIdentity';
import { useTranslation } from '../../../context/LocaleContext';
import { useCoachTheme } from './CoachThemeContext';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { COACH_TOOL_GROUPS } from '../navigation/coachNavConfig';
import { CoachToolsList } from './CoachToolsList';
import { useCoachShellNav } from './CoachShellNavContext';
import { spacing } from '../../../theme/designTokens';
import { coachChrome } from '../theme/coachDesignSystem';

type Props = {
  /** Legacy — liste d’outils résolus (deep link Menu / plus). */
  items?: CoachNavResolvedItem[];
};

const pageIdentity = getCoachPageIdentity('plus');

/** Hub Menu — outils groupés (Match, Club, Performance) + Compte / déconnexion. */
export function CoachMenuPane({ items = [] }: Props) {
  const shellNav = useCoachShellNav();
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const { width } = useWindowDimensions();
  const wide = width >= coachChrome.wideBreakpoint;
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const resolvedById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );

  return (
    <View style={styles.root}>
      <CoachScreenHeader title={pageIdentity.title} showTeamRow={false} />
      <CoachChapterScroll>
        <CoachText variant="body" muted style={styles.subtitle} numberOfLines={1}>
          {t('coach.portal.menu.subtitle')}
        </CoachText>

        {items.length === 0 ? (
          <CoachEmptyState
            title="Aucun outil"
            body="Aucun outil disponible pour le moment."
          />
        ) : (
          <CoachToolsList
            groups={COACH_TOOL_GROUPS}
            resolvedById={resolvedById}
            onSelect={(id) => shellNav?.requestNav(id)}
          />
        )}

        <ShellAccountSection
          tone={{
            foreground: tokens.foreground,
            muted: tokens.muted,
            faint: tokens.muted,
            surface: tokens.surface,
            border: tokens.border,
            destructive: '#DC2626',
            iconBg: tokens.soft,
          }}
          links={[
            {
              key: 'profil',
              label: 'Profil',
              hint: 'Vitrine et paramètres coach',
              icon: 'person',
              onPress: () => shellNav?.requestNav('profil'),
            },
          ]}
          onSignOut={shellNav?.signOut}
          safeBottom={!wide}
        />
      </CoachChapterScroll>
    </View>
  );
}

const createStyles = (tokens: { bg: string }) =>
  StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
    subtitle: { marginTop: -spacing.sm },
  });

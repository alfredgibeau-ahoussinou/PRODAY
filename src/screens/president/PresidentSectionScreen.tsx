import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ClubNavItemId } from '../../features/club/navigation/clubNavConfig';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { usePresidentShellNav } from '../../features/president/shell/PresidentShellNavContext';
import { usePresidentTheme } from '../../features/president/shell/PresidentThemeContext';
import {
  PresidentActionRow,
  PresidentBrandMark,
  PresidentChapterScroll,
  PresidentEmptyState,
  PresidentLoading,
  PresidentSectionCard,
  PresidentText,
} from '../../features/president/ui/presidentUi';
import { presidentLayout, presidentSpace } from '../../features/president/theme/presidentDesignSystem';
import type { IconName } from '../../components/ui/iconNames';
import type { PresidentThemeTokens } from '../../features/president/theme/presidentTokens';

export type PresidentSectionLink = {
  label: string;
  hint?: string;
  icon?: IconName;
  /** Lien secondaire vers le Club pour édition lourde uniquement. */
  clubNav?: ClubNavItemId;
  onPress?: () => void;
};

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  liveLines?: string[];
  emptyTitle?: string;
  emptyBody?: string;
  /** Liens secondaires « Ouvrir dans le Club » — jamais la navigation primaire. */
  links?: PresidentSectionLink[];
  children?: React.ReactNode;
};

/**
 * Coquille section premium — lecture directionnelle + listes actionnables.
 * Les deep-links Club restent optionnels et secondaires.
 */
export function PresidentSectionScreen({
  eyebrow,
  title,
  subtitle,
  liveLines,
  emptyTitle,
  emptyBody,
  links = [],
  children,
}: Props) {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <PresidentLoading />;

  return (
    <View style={styles.root}>
      <PresidentChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <View style={styles.header}>
          <PresidentBrandMark compact />
          <PresidentText variant="label" champagne>
            {eyebrow}
          </PresidentText>
          <PresidentText variant="h1">{title}</PresidentText>
          <PresidentText variant="body" muted>
            {subtitle}
          </PresidentText>
        </View>

        {liveLines && liveLines.length > 0 ? (
          <PresidentSectionCard eyebrow="Synthèse" title="Lecture workspace">
            {liveLines.map((line, i) => (
              <PresidentText key={i} variant="body" muted>
                {line}
              </PresidentText>
            ))}
          </PresidentSectionCard>
        ) : null}

        {children}

        {emptyTitle && emptyBody && (!liveLines || liveLines.length === 0) && !children ? (
          <PresidentEmptyState title={emptyTitle} body={emptyBody} />
        ) : null}

        {links.length > 0 ? (
          <PresidentSectionCard
            eyebrow="Optionnel"
            title="Ouvrir dans le Club"
          >
            <PresidentText variant="caption" muted style={{ marginBottom: presidentSpace.sm }}>
              Édition avancée ou CRUD opérationnel — la direction reste ici.
            </PresidentText>
            {links.map((link) => (
              <PresidentActionRow
                key={link.label}
                label={link.label}
                hint={link.hint}
                icon={link.icon}
                onPress={() => {
                  if (link.onPress) link.onPress();
                  else if (link.clubNav) shellNav?.openClubDeepLink(link.clubNav);
                }}
              />
            ))}
          </PresidentSectionCard>
        ) : null}
      </PresidentChapterScroll>
    </View>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    header: {
      gap: 6,
      paddingBottom: presidentSpace.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.hairline,
      marginBottom: -presidentLayout.sectionGap / 4,
    },
  });
}

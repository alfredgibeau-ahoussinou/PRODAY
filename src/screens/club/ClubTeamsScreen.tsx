import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubTeamCard } from '../../features/club/ui/ClubTeamCard';
import { summarizeClubTeamsStructure } from '../../features/club/ui/clubTeamsModel';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { teamsService } from '../../services/teams.service';
import { ClubTeamSpaceScreen } from './ClubTeamSpaceScreen';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../../features/club/theme/clubDesignSystem';

/** Mes Équipes — cartes catégories → espace équipe + raccourcis existants. */
export function ClubTeamsScreen() {
  const shellNav = useClubShellNav();
  const { tokens, logoUrl } = useClubTheme();
  const ws = useClubWorkspace();
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const selected = shellNav?.selectedTeamId ?? null;
  const summary = useMemo(() => summarizeClubTeamsStructure(ws.teamRows), [ws.teamRows]);

  const createTeam = async () => {
    if (!ws.clubId) {
      Alert.alert('Club requis', 'Liez un club pour créer une équipe.');
      return;
    }
    const name = teamName.trim();
    if (!name) {
      Alert.alert('Nom requis', 'Indiquez le nom de l’équipe (ex. U15).');
      return;
    }
    setCreating(true);
    try {
      await teamsService.create({
        club_id: ws.clubId,
        name,
        is_default: ws.teams.length === 0,
      });
      setTeamName('');
      setShowCreate(false);
      await ws.refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setCreating(false);
    }
  };

  if (selected) {
    return (
      <ClubTeamSpaceScreen
        teamId={selected}
        onBack={() => shellNav?.setSelectedTeamId?.(null)}
      />
    );
  }

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Équipes"
          subtitle={
            summary.teamCount === 0
              ? 'Structurez les catégories du club'
              : summary.subtitle
          }
        />

        {summary.teamCount > 0 ? (
          <View style={styles.shortcutRow}>
            <PressableSpring
              onPress={() => shellNav?.requestNav('players')}
              scaleTo={0.97}
              haptic
              style={styles.shortcut}
            >
              <Icon name="people" size={14} color={tokens.accent} />
              <ClubText variant="caption" style={styles.shortcutLabel}>
                Joueurs
              </ClubText>
            </PressableSpring>
            <PressableSpring
              onPress={() => shellNav?.requestNav('coaches')}
              scaleTo={0.97}
              haptic
              style={styles.shortcut}
            >
              <Icon name="school" size={14} color={tokens.accent} />
              <ClubText variant="caption" style={styles.shortcutLabel}>
                Coachs
              </ClubText>
            </PressableSpring>
            <PressableSpring
              onPress={() => shellNav?.requestNav('calendar')}
              scaleTo={0.97}
              haptic
              style={styles.shortcut}
            >
              <Icon name="calendar" size={14} color={tokens.accent} />
              <ClubText variant="caption" style={styles.shortcutLabel}>
                Calendrier
              </ClubText>
            </PressableSpring>
          </View>
        ) : null}

        {summary.withoutCoach > 0 ? (
          <PressableSpring
            onPress={() => shellNav?.requestNav('coaches')}
            scaleTo={0.98}
            haptic
            style={styles.warnRow}
          >
            <View style={[styles.warnIcon, { backgroundColor: tokens.warningSoft }]}>
              <Icon name="school" size={14} color={tokens.warning} />
            </View>
            <View style={styles.warnCopy}>
              <ClubText variant="body" style={{ fontWeight: '700' }}>
                {summary.withoutCoach > 1
                  ? `${summary.withoutCoach} équipes sans coach`
                  : '1 équipe sans coach'}
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1}>
                Affecter depuis Coachs
              </ClubText>
            </View>
            <Icon name="chevron-forward" size={14} color={tokens.faint} />
          </PressableSpring>
        ) : null}

        {ws.teamRows.length === 0 ? (
          <ClubEmptyState
            title="Aucune équipe pour l’instant"
            body="Créez votre première catégorie (U7 → Seniors). Les joueurs et coachs s’y rattachent ensuite."
            actionLabel="Créer une équipe"
            onAction={() => setShowCreate(true)}
            icon="football"
          />
        ) : (
          <View style={styles.list}>
            <View style={styles.sectionHead}>
              <ClubText variant="label" muted style={styles.sectionLabel}>
                Mes équipes
              </ClubText>
              <ClubText variant="caption" muted>
                {summary.teamCount}
              </ClubText>
            </View>
            {ws.teamRows.map((row, index) => (
              <ClubTeamCard
                key={row.teamId}
                row={row}
                index={index}
                logoUrl={logoUrl}
                onPress={() => shellNav?.setSelectedTeamId?.(row.teamId)}
              />
            ))}
          </View>
        )}

        <PressableSpring
          onPress={() => setShowCreate(true)}
          scaleTo={0.98}
          haptic
          style={styles.createRow}
        >
          <View style={[styles.createIcon, { backgroundColor: tokens.accentSoft }]}>
            <Icon name="add" size={16} color={tokens.accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <ClubText variant="body" style={{ fontWeight: '700' }}>
              Nouvelle équipe
            </ClubText>
            <ClubText variant="caption" muted>
              Catégorie U7 → Seniors
            </ClubText>
          </View>
          <Icon name="chevron-forward" size={14} color={tokens.faint} />
        </PressableSpring>

        {showCreate ? (
          <ClubSectionCard title="Créer une équipe">
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Ex. U15 garçons"
              placeholderTextColor={tokens.muted}
              style={styles.input}
            />
            <View style={styles.createActions}>
              <PressableSpring onPress={() => setShowCreate(false)} scaleTo={0.97}>
                <ClubText variant="caption" muted style={{ fontWeight: '700' }}>
                  Annuler
                </ClubText>
              </PressableSpring>
              <PressableSpring
                onPress={() => void createTeam()}
                scaleTo={0.97}
                haptic
                disabled={creating}
                style={styles.saveBtn}
              >
                <ClubText
                  variant="caption"
                  style={{ color: tokens.onAccent, fontWeight: '800' }}
                >
                  {creating ? '…' : 'Enregistrer'}
                </ClubText>
              </PressableSpring>
            </View>
          </ClubSectionCard>
        ) : null}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    list: { gap: clubSpace.sm },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
      marginBottom: 2,
    },
    sectionLabel: {
      letterSpacing: 1.05,
      opacity: 0.92,
    },
    shortcutRow: {
      flexDirection: 'row',
      gap: clubSpace.sm,
    },
    shortcut: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    shortcutLabel: {
      color: tokens.foreground,
      fontWeight: '700',
    },
    warnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    warnIcon: {
      width: 32,
      height: 32,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    warnCopy: { flex: 1, minWidth: 0, gap: 2 },
    createRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    createIcon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      borderRadius: clubRadius.md,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 12,
      color: tokens.foreground,
    },
    createActions: {
      flexDirection: 'row',
      gap: clubSpace.sm,
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: clubSpace.sm,
    },
    saveBtn: {
      backgroundColor: tokens.accent,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: clubRadius.md,
    },
  });

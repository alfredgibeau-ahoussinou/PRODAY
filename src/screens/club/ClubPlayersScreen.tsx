import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  ClubChapterScroll,
  ClubLoading,
  ClubStatusPill,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import {
  ClubPlayersPendingHero,
  ClubRosterComplianceBar,
} from '../../features/club/ui/ClubPlayersChrome';
import { ClubImportSquadPanel } from '../../features/club/ui/ClubImportSquadPanel';
import {
  ClubRosterDirectory,
  ClubRosterProfileSheet,
} from '../../features/club/ui/ClubRosterChrome';
import {
  filterClubPlayersList,
  listPendingMembershipPlayers,
  memberInitials,
  membershipStatusLabel,
  membershipStatusTone,
  resolveClubMembershipCompliance,
  resolveClubPlayersBaseList,
  resolveClubPlayersSubtitle,
  type ClubPlayerListItem,
  type ClubPlayersFilterId,
} from '../../features/club/ui/clubPlayersModel';
import type {
  RosterItem,
  RosterProfileFact,
} from '../../features/roster/rosterDirectory';
import { ClubPlayerDetailScreen } from './ClubPlayerDetailScreen';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { playerDisciplinaryService } from '../../services/playerDisciplinary.service';
import type { PlayerEligibilityResult } from '../../models/PlayerDisciplinary';
import { PlayerSuspensionBadge } from '../../components/discipline/PlayerSuspensionBadge';
import { DisciplinaryCheckModal } from '../../components/discipline/DisciplinaryCheckModal';
import { FootclubsDisciplineImportModal } from '../../components/discipline/FootclubsDisciplineImportModal';

const FILTERS: { id: ClubPlayersFilterId; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'active', label: 'Actifs' },
  { id: 'pending', label: 'En attente' },
];

/**
 * Joueurs — annuaire du club.
 *
 * La liste, la recherche, les puces de filtre et la fiche joueur viennent de
 * l'annuaire **partagé** (`features/roster/rosterDirectory`, enveloppé par
 * `ClubRosterChrome`) : le pôle Club n'a plus sa propre copie de cet écran, et
 * le pôle Coach ne peut plus dériver de lui.
 *
 * Ce qui reste propre au pôle Club : le baromètre d'adhésions, l'import
 * d'effectif (CSV FootClubs / FFF, feuille PDF), les raccourcis direction
 * (équipes, inviter, créer) et le détail d'une licence — celui-ci ouvert depuis
 * la fiche partagée, qui ne le duplique pas.
 */
export function ClubPlayersScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ClubPlayersFilterId>('all');
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const [importSanctionsModalVisible, setImportSanctionsModalVisible] = useState(false);
  const [selectedDisciplinaryResult, setSelectedDisciplinaryResult] = useState<PlayerEligibilityResult | null>(null);
  const [disciplinaryMap, setDisciplinaryMap] = useState<Map<string, PlayerEligibilityResult>>(new Map());
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const selected = shellNav?.selectedPlayerUid ?? null;

  useEffect(() => {
    if (!shellNav?.playersPendingFocus) return;
    setFilter('pending');
    shellNav.clearPlayersPendingFocus?.();
  }, [shellNav?.playersPendingFocus, shellNav]);

  const basePlayers = useMemo(
    () =>
      resolveClubPlayersBaseList({
        players: ws.players,
        members: ws.members,
        memberships: ws.memberships,
      }),
    [ws.players, ws.members, ws.memberships],
  );

  const playersByUid = useMemo(() => {
    const map = new Map(basePlayers.map((p) => [p.uid, p]));
    ws.members.forEach((m) => map.set(m.uid, m));
    return map;
  }, [basePlayers, ws.members]);

  const loadDiscipline = React.useCallback(async () => {
    if (!ws.clubId) return;
    const map = new Map<string, PlayerEligibilityResult>();
    const matchCtx = { event_type: 'competition' as const, match_date: new Date() };

    for (const p of basePlayers) {
      const membership = ws.memberships.find((m) => m.player_uid === p.uid);
      const lic = membership?.license_number || p.profile?.license_number;
      const res = await playerDisciplinaryService.evaluatePlayerEligibility(
        {
          uid: p.uid,
          license_number: lic,
          display_name: p.display_name,
        },
        matchCtx,
        ws.clubId
      );
      map.set(p.uid, res);
    }
    setDisciplinaryMap(map);
  }, [ws.clubId, basePlayers, ws.memberships]);

  useEffect(() => {
    loadDiscipline();
  }, [loadDiscipline]);

  const pendingItems = useMemo(
    () =>
      listPendingMembershipPlayers({
        memberships: ws.memberships,
        playersByUid,
      }),
    [ws.memberships, playersByUid],
  );

  const filtered = useMemo(
    () =>
      filterClubPlayersList({
        players: basePlayers,
        memberships: ws.memberships,
        teams: ws.teams,
        query,
        filter,
      }),
    [basePlayers, ws.memberships, ws.teams, query, filter],
  );

  const compliance = useMemo(
    () => resolveClubMembershipCompliance(ws.memberships),
    [ws.memberships],
  );

  const activeCount = ws.memberships.filter((m) => m.status === 'active').length;
  const subtitle = resolveClubPlayersSubtitle({
    visibleCount: filtered.length,
    pendingCount: pendingItems.length,
    activeCount,
  });

  /** Rangées de l'annuaire : la donnée Club, mise en forme par la liste partagée. */
  const items = useMemo<RosterItem[]>(
    () =>
      filtered.map((item) => {
        const hasLicense = Boolean(item.membership?.license_number?.trim());
        const tone = membershipStatusTone(item.membership?.status);
        const statusLabel = membershipStatusLabel(item.membership?.status, hasLicense);
        const metaParts = [item.player.profile?.category, item.teamName]
          .filter(Boolean)
          .filter((value, index, all) => all.indexOf(value) === index) as string[];

        const disc = disciplinaryMap.get(item.player.uid);

        return {
          id: item.player.uid,
          name: item.player.display_name || 'Joueur',
          badge:
            item.player.profile?.jersey_number != null
              ? String(item.player.profile.jersey_number)
              : memberInitials(item.player.display_name),
          meta: metaParts.join(' · ') || undefined,
          tone: TONE_COLOR[tone](tokens),
          toneLabel: statusLabel,
          /** Détail licence/adhésion et discipline — injecté par le pôle Club dans la rangée commune. */
          detail: (
            <View style={styles.rowDetail}>
              <ClubStatusPill label={statusLabel} tone={tone} />
              <ClubText variant="caption" muted numberOfLines={1} style={styles.rowDetailText}>
                {item.membership?.license_number?.trim()
                  ? `Licence ${item.membership.license_number}`
                  : 'Aucun numéro de licence'}
              </ClubText>
              {disc && (
                <PlayerSuspensionBadge
                  status={disc.status}
                  size="sm"
                  onPress={() => setSelectedDisciplinaryResult(disc)}
                />
              )}
            </View>
          ),
        };
      }),
    [filtered, styles, tokens, disciplinaryMap],
  );

  const profileItem: ClubPlayerListItem | null = useMemo(
    () => filtered.find((item) => item.player.uid === profileUid) ?? null,
    [filtered, profileUid],
  );

  const profileFacts = useMemo<RosterProfileFact[]>(() => {
    if (!profileItem) return [];
    const { player, membership, teamName } = profileItem;
    const season = player.profile?.season_stats;
    const hasLicense = Boolean(membership?.license_number?.trim());
    const facts: RosterProfileFact[] = [];

    if (player.profile?.category) {
      facts.push({ label: 'Catégorie', value: player.profile.category });
    }
    facts.push({
      label: 'Licence',
      value: membership?.license_number?.trim() || 'Non renseignée',
      tone: hasLicense ? undefined : tokens.danger,
    });
    if (teamName) facts.push({ label: 'Équipe', value: teamName });
    facts.push({
      label: 'Adhésion',
      value: membershipStatusLabel(membership?.status, hasLicense),
      tone: TONE_COLOR[membershipStatusTone(membership?.status)](tokens),
    });
    if (season?.matches != null) facts.push({ label: 'Matchs', value: String(season.matches) });
    if (season?.goals != null) facts.push({ label: 'Buts', value: String(season.goals) });

    return facts;
  }, [profileItem, tokens]);

  if (selected) {
    return (
      <ClubPlayerDetailScreen
        playerUid={selected}
        onBack={() => shellNav?.setSelectedPlayerUid?.(null)}
      />
    );
  }

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Joueurs" subtitle={subtitle} />

        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('teams')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="football" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Équipes
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.openCreate?.('invite_member')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="mail" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Inviter
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.openCreate?.('player')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="add" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Créer
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => setImportSanctionsModalVisible(true)}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="alert-circle" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Discipline FFF
            </ClubText>
          </PressableSpring>
        </View>

        {ws.clubId && profile?.uid ? (
          <ClubImportSquadPanel
            clubId={ws.clubId}
            existingPlayers={ws.players}
            approverUid={profile.uid}
            fffAffiliationNumber={ws.club?.fff_affiliation_number}
            clubName={ws.club?.name}
            clubCity={ws.club?.city}
            onImported={() => void ws.refresh()}
          />
        ) : null}

        {pendingItems.length > 0 && filter !== 'pending' ? (
          <ClubPlayersPendingHero
            count={pendingItems.length}
            previewNames={pendingItems.map((p) => p.name)}
            onFilterPending={() => setFilter('pending')}
            onReview={() => setFilter('pending')}
          />
        ) : null}

        <ClubRosterDirectory
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder="Rechercher un joueur, une licence, une équipe"
          filters={FILTERS}
          activeFilter={filter}
          onFilterChange={(id) => setFilter(id as ClubPlayersFilterId)}
          items={items}
          onSelect={(item) => setProfileUid(item.id)}
          emptyTitle="Aucun joueur trouvé"
          emptyBody="Modifiez la recherche ou les filtres, ou importez un effectif."
          header={<ClubRosterComplianceBar counts={compliance} />}
        />
      </ClubChapterScroll>

      <ClubRosterProfileSheet
        visible={profileItem !== null}
        onClose={() => setProfileUid(null)}
        name={profileItem?.player.display_name || 'Joueur'}
        badge={
          profileItem?.player.profile?.jersey_number != null
            ? String(profileItem.player.profile.jersey_number)
            : memberInitials(profileItem?.player.display_name)
        }
        kicker={membershipStatusLabel(
          profileItem?.membership?.status,
          Boolean(profileItem?.membership?.license_number?.trim()),
        )}
        meta={profileItem?.player.email}
        facts={profileFacts}
        footnote={
          profileItem?.membership?.license_number
            ? undefined
            : 'Sans numéro de licence, le joueur n’est pas alignable en compétition.'
        }
        actions={[
          {
            id: 'open',
            label: 'Ouvrir la fiche complète',
            icon: 'chevron-forward',
            tone: 'accent',
            onPress: () => {
              if (profileUid) shellNav?.setSelectedPlayerUid?.(profileUid);
              setProfileUid(null);
            },
          },
        ]}
      />

      {/* Modal d'importation des sanctions Footclubs FFF */}
      <FootclubsDisciplineImportModal
        visible={importSanctionsModalVisible}
        onClose={() => setImportSanctionsModalVisible(false)}
        clubId={ws.clubId || ''}
        onImportSuccess={() => {
          loadDiscipline();
        }}
      />

      {/* Modal de détail disciplinaire */}
      <DisciplinaryCheckModal
        visible={Boolean(selectedDisciplinaryResult)}
        onClose={() => setSelectedDisciplinaryResult(null)}
        result={selectedDisciplinaryResult}
        clubId={ws.clubId || ''}
        currentUserName={profile?.display_name || 'Dirigeant Club'}
        currentUserUid={profile?.uid || 'club_user'}
        canOverride={true}
        onOverrideSaved={() => {
          loadDiscipline();
          setSelectedDisciplinaryResult(null);
        }}
      />
    </View>
  );
}

/** Teinte d'état → jeton du pôle. Une seule table, utilisée par la liste et la fiche. */
const TONE_COLOR: Record<'ok' | 'warn' | 'alert' | 'neutral', (t: ClubThemeTokens) => string> = {
  ok: (t) => t.success,
  warn: (t) => t.warning,
  alert: (t) => t.danger,
  neutral: (t) => t.muted,
};

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
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
    rowDetail: { flexDirection: 'row', alignItems: 'center', gap: clubSpace.sm },
    rowDetailText: { flex: 1 },
  });

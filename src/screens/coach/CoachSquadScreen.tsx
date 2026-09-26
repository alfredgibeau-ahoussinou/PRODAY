import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { PressableSpring } from '../../components/motion';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withAlpha } from '../../components/navigation/tabBarShared';
import { getPendingInviteeUids, type TeamEvent } from '../../models/TeamEvent';
import { CoachScreenHeader } from '../../components/coach/CoachScreenHeader';
import { CoachChapterScroll, CoachText } from '../../components/coach/coachPortalUi';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';
import { FederationSyncDrawer } from '../../components/coach/FederationSyncDrawer';
import { CoachSquadImportPanel } from '../../components/coach/CoachSquadImportPanel';
import { CoachLineupGuide } from '../../components/coach/CoachLineupGuide';
import { CoachPlayerPicker } from '../../components/coach/CoachPlayerPicker';
import { CoachBenchDrawer } from '../../components/coach/CoachBenchDrawer';
import {
  CoachRosterDirectory,
  CoachRosterProfileSheet,
} from '../../features/coach/ui/coachRosterChrome';
import {
  RosterFilterChips,
  type RosterItem,
} from '../../features/roster/rosterDirectory';
import {
  PlayerStatsRatingModal,
  type PlayerStatsRatingModalMode,
} from '../../components/coach/PlayerStatsRatingModal';
import {
  formatCoachRating,
  formatEvaluationSourceLabel,
  formatEvaluationStatusLabel,
} from '../../utils/coachEvaluationRatings';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import type { PlayerMatchSheetStat } from '../../models/TeamEvent';
import { playerDisciplinaryService } from '../../services/playerDisciplinary.service';
import type { PlayerEligibilityResult } from '../../models/PlayerDisciplinary';
import { PlayerSuspensionBadge } from '../../components/discipline/PlayerSuspensionBadge';
import { DisciplinaryCheckModal } from '../../components/discipline/DisciplinaryCheckModal';
import {
  ALL_FORMATION_COORDINATES,
  ALL_TACTICAL_SYSTEMS,
  CoachPitchView,
  MATCH_FORMATS_CONFIG,
  TACTICAL_SYSTEMS_BY_ID,
  type MatchFormatKey,
  type PitchSlot,
  type TacticalCategory,
} from '../../components/coach/CoachPitchView';
import { availabilityTone } from '../../components/coach/CoachFutPlayerCard';
import { CoachPendingRsvpSheet } from '../../components/coach/CoachPendingRsvpSheet';
import { useCoachSquadRoster } from '../../hooks/useCoachSquadRoster';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  availabilityLabel,
  buildCoachEventLineup,
  compareSquadReadiness,
  fillLineupFromSquad,
  isSquadPlayerUnavailable,
  normalizeSquadPosition,
  readPublishedLineup,
  stripSquadDiacritics,
  type SquadAvailability,
  type SquadPlayer,
  type SquadPosition,
} from '../../utils/coachSquadRoster';
/**
 * Vocabulaire d'adhésion partagé avec le pôle Club (`membershipStatusLabel`,
 * tonalités) : une licence se dit de la même façon dans les deux pôles.
 */
import {
  memberInitials,
  membershipStatusLabel,
  membershipStatusTone,
} from '../../features/club/ui/clubPlayersModel';
import { COACH_SITE } from '../../content/coachPageIdentity';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { coachLayout } from '../../features/coach/theme/coachDesignSystem';
import { COACH_PITCH } from '../../features/coach/theme/coachPitchTokens';
import {
  proForm,
  proRadius,
  proSemantic,
  PRO_DATA_VIOLET,
  proSpace,
  proType,
} from '../../theme/professionalDesign';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import {
  buildSquadDraft,
  loadCoachSquadDraft,
  saveCoachSquadDraft,
  squadDraftIsEmpty,
} from '../../utils/coachSquadDraft';
import {
  popCoachLineupHistory,
  pushCoachLineupHistory,
  readCoachLineupSnapshot,
  type CoachLineupSnapshot,
} from '../../utils/coachLineupHistory';

type SquadTab = 'effectif' | 'composition';
type SquadFilter = 'all' | 'starter' | 'sub' | 'unavailable' | 'suspended';

const FILTERS: { id: SquadFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'starter', label: 'Titulaires' },
  { id: 'sub', label: 'Remplaçants' },
  { id: 'unavailable', label: 'Indisponibles' },
  { id: 'suspended', label: 'Suspendus' },
];

/**
 * Étapes de disponibilité — **les trois états réellement écrits** sur la
 * convocation (`updateRsvpAsStaff`). Un état de blessure n'existe nulle part
 * dans le modèle du club : il n'est plus proposé plutôt que d'être simulé.
 */
const AVAILABILITY_FILTERS: { id: SquadAvailability; label: string }[] = [
  { id: 'present', label: 'Présent' },
  { id: 'pending', label: 'En attente' },
  { id: 'absent', label: 'Absent' },
];

/** Teinte d'adhésion → jeton du socle partagé. Aucune couleur littérale. */
function membershipFactTone(status: SquadPlayer['membershipStatus'], muted: string): string {
  const tone = membershipStatusTone(status);
  if (tone === 'ok') return proSemantic.success;
  if (tone === 'warn') return proSemantic.warning;
  if (tone === 'alert') return proSemantic.danger;
  return muted;
}

/** Repli d'un onze sur un nouveau nombre de crans, **sans perdre l'ordre choisi**. */
function reflowLineup(ids: (string | null)[], slotCount: number): (string | null)[] {
  const kept = ids.filter((id): id is string => !!id).slice(0, slotCount);
  return Array.from({ length: slotCount }, (_, index) => kept[index] ?? null);
}

/**
 * Équipe — page principale du pôle Coach.
 *
 * Deux vues seulement : **Effectif** (chercher, filtrer, ouvrir une fiche) et
 * **Composition** (terrain, banc, composition guidée). Les actions rares
 * (format, bibliothèque tactique, import, gestion, classement) sont regroupées
 * dans un menu secondaire unique, jamais dispersées sur les cartes.
 *
 * L'effectif, les disponibilités et la publication viennent du **club réel** :
 * adhésions d'équipe + membres, convocation du prochain match, écriture par
 * `teamEventsService`. Plus une seule note inventée sur la page.
 *
 * Le socle de forme et de typographie est celui du pôle Club/Admin
 * (`theme/professionalDesign`), comme le reste du pôle Coach converti.
 */
export const CoachSquadScreen: React.FC = () => {
  const { tokens, teamId, teamName } = useCoachTheme();
  const shellNav = useCoachShellNav();
  const styles = useCoachThemedStyles(createStyles);
  /** Effectif, disponibilités et match cible — **données du club**, pas une maquette. */
  const roster = useCoachSquadRoster();

  const [tab, setTab] = useState<SquadTab>('effectif');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SquadFilter>('all');

  const squad: SquadPlayer[] = roster.players;
  const [format, setFormat] = useState<MatchFormatKey>('11v11');
  const [formation, setFormation] = useState('4-3-3');
  const [lineup, setLineup] = useState<(string | null)[]>(() =>
    Array.from({ length: MATCH_FORMATS_CONFIG['11v11'].starterCount }, () => null),
  );

  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null);
  const [guideVisible, setGuideVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [formatModalVisible, setFormatModalVisible] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [standingsVisible, setStandingsVisible] = useState(false);
  const [federationVisible, setFederationVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<TacticalCategory>('all');
  const [toast, setToast] = useState<string | null>(null);
  /** Détail des réponses en attente — déroulé du badge de convocation. */
  const [pendingRsvpSheetOpen, setPendingRsvpSheetOpen] = useState(false);
  const [activePlayerNote, setActivePlayerNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const profile = useSessionProfile();
  const [statsRatingModal, setStatsRatingModal] = useState<{
    uid: string;
    name: string;
    stat?: PlayerMatchSheetStat;
    mode: PlayerStatsRatingModalMode;
    eventId?: string;
    eventTitle?: string;
  } | null>(null);

  const openPlayerStatsModal = (uid: string, name: string, mode: PlayerStatsRatingModalMode) => {
    const targetMatch = roster.publishTarget ?? roster.nextMatch;
    if (!targetMatch) {
      Alert.alert(
        'Aucun match trouvé',
        'Créez ou sélectionnez un match dans le calendrier pour renseigner ou modifier les statistiques de ce joueur.',
      );
      return;
    }
    const stat = targetMatch.player_match_stats?.[uid];
    setStatsRatingModal({
      uid,
      name,
      stat,
      mode,
      eventId: targetMatch.id,
      eventTitle: targetMatch.title,
    });
  };

  const handleSaveModalStat = async (patch: Partial<PlayerMatchSheetStat>) => {
    const targetId = statsRatingModal?.eventId ?? roster.publishTarget?.id ?? roster.nextMatch?.id;
    if (!targetId || !profile?.uid || !statsRatingModal) return;
    await teamEventsService.updatePlayerMatchStat(
      targetId,
      statsRatingModal.uid,
      patch,
      {
        user: profile,
        isAdmin: profile.role === 'coach' || profile.is_admin,
      },
    );
    await roster.refresh();
  };

  useEffect(() => {
    if (!profilePlayerId) {
      setActivePlayerNote('');
      return;
    }
    let isMounted = true;
    void AsyncStorage.getItem(`@proday:coach_notes:${profilePlayerId}`).then((saved) => {
      if (isMounted) setActivePlayerNote(saved ?? '');
    });
    return () => {
      isMounted = false;
    };
  }, [profilePlayerId]);

  const savePlayerNote = async () => {
    if (!profilePlayerId) return;
    setSavingNote(true);
    try {
      await AsyncStorage.setItem(`@proday:coach_notes:${profilePlayerId}`, activePlayerNote);
      setToast('Note coach enregistrée');
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSavingNote(false);
    }
  };

  const formatConfig = MATCH_FORMATS_CONFIG[format];
  const slotCount = formatConfig.starterCount;
  const pitchSlots: PitchSlot[] = useMemo(
    () => ALL_FORMATION_COORDINATES[formation] ?? ALL_FORMATION_COORDINATES['4-3-3'] ?? [],
    [formation],
  );

  const byId = useMemo(() => new Map(squad.map((player) => [player.id, player])), [squad]);
  /** Lecture d'instant pour l'annulation, qui ne doit jamais capturer un effectif périmé. */
  const byIdRef = useRef(byId);
  byIdRef.current = byId;

  const starters = useMemo(
    () => lineup.map((id) => (id ? byId.get(id) ?? null : null)),
    [lineup, byId],
  );
  const starterIds = useMemo(
    () => new Set(lineup.filter((id): id is string => !!id)),
    [lineup],
  );
  const bench = useMemo(
    () =>
      squad
        .filter((player) => !isSquadPlayerUnavailable(player) && !starterIds.has(player.id))
        .sort(compareSquadReadiness),
    [squad, starterIds],
  );
  const unavailable = useMemo(() => squad.filter(isSquadPlayerUnavailable), [squad]);

  /** Poste attendu de chaque cran — sert à compléter le onze par poste. */
  const pitchPositions: (SquadPosition | null)[] = useMemo(
    () => pitchSlots.map((slot) => normalizeSquadPosition(slot.defaultPos)),
    [pitchSlots],
  );

  const presentCount = squad.filter((player) => player.availability === 'present').length;
  const pendingCount = squad.filter((player) => player.availability === 'pending').length;

  /**
   * Réponses en attente **de la convocation du prochain match** — définition
   * partagée (`getPendingInviteeUids`), pas le compteur d'effectif ci-dessus :
   * un joueur non convoqué est « en attente » dans l'effectif mais ne compte
   * pas comme une relance à faire sur le match.
   */
  const pendingRsvpUids = roster.pendingInviteeUids;
  const pendingRsvpCount = pendingRsvpUids.length;

  const [disciplinaryMap, setDisciplinaryMap] = useState<Map<string, PlayerEligibilityResult>>(new Map());
  const [selectedDisciplinaryResult, setSelectedDisciplinaryResult] = useState<PlayerEligibilityResult | null>(null);

  const clubId = profile?.profile?.club_id || 'club_default';

  const loadDiscipline = useCallback(async () => {
    if (!clubId || squad.length === 0) return;
    const map = new Map<string, PlayerEligibilityResult>();
    const matchCtx = { event_type: 'competition' as const, match_date: new Date() };

    for (const pl of squad) {
      const res = await playerDisciplinaryService.evaluatePlayerEligibility(
        { uid: pl.id, license_number: pl.licenseNumber, display_name: pl.name },
        matchCtx,
        clubId
      );
      map.set(pl.id, res);
    }
    setDisciplinaryMap(map);
  }, [clubId, squad]);

  useEffect(() => {
    loadDiscipline();
  }, [loadDiscipline]);

  const filteredRoster = useMemo(() => {
    const needle = stripSquadDiacritics(query);
    return squad
      .filter((player) => {
        if (filter === 'unavailable') return isSquadPlayerUnavailable(player);
        if (filter === 'starter') return starterIds.has(player.id);
        if (filter === 'sub') {
          return !starterIds.has(player.id) && !isSquadPlayerUnavailable(player);
        }
        if (filter === 'suspended') {
          const disc = disciplinaryMap.get(player.id);
          return disc?.status === 'suspended';
        }
        return true;
      })
      .filter((player) => {
        if (!needle) return true;
        return (
          stripSquadDiacritics(player.name).includes(needle) ||
          stripSquadDiacritics(player.pos ?? '').includes(needle) ||
          (player.num != null && String(player.num).includes(needle))
        );
      })
      /** Numéro de maillot croissant, puis nom : les joueurs sans numéro ne passent pas devant. */
      .sort((a, b) => {
        if (a.num != null && b.num != null && a.num !== b.num) return a.num - b.num;
        if (a.num == null && b.num != null) return 1;
        if (a.num != null && b.num == null) return -1;
        return a.name.localeCompare(b.name, 'fr');
      });
  }, [squad, filter, query, starterIds, disciplinaryMap]);

  /**
   * Rangées de l'annuaire partagé — la donnée Coach, mise en forme une fois.
   * Le socle de liste (rangée, pastille, point d'état, chevron) vient du module
   * partagé, et non plus de cet écran.
   */
  const rosterItems: RosterItem[] = useMemo(
    () =>
      filteredRoster.map((player) => {
        const disc = disciplinaryMap.get(player.id);
        return {
          id: player.id,
          name: player.name,
          badge: player.num != null ? String(player.num) : memberInitials(player.name),
          meta: `${player.pos ?? 'Poste non renseigné'} · ${availabilityLabel(player.availability)}${
            player.licenseNumber?.trim() ? '' : ' · sans licence'
          }${starterIds.has(player.id) ? ' · titulaire' : ''}`,
          tone: availabilityTone(player.availability),
          toneLabel: availabilityLabel(player.availability),
          detail: disc ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <PlayerSuspensionBadge
                status={disc.status}
                size="sm"
                onPress={() => setSelectedDisciplinaryResult(disc)}
              />
            </View>
          ) : undefined,
        };
      }),
    [filteredRoster, starterIds, disciplinaryMap],
  );

  const filteredSystems = useMemo(() => {
    const needle = libraryQuery.trim().toLowerCase();
    return ALL_TACTICAL_SYSTEMS.filter((system) => {
      if (libraryCategory === 'small-sided') {
        if (system.format === '11v11') return false;
      } else if (libraryCategory !== 'all' && system.category !== libraryCategory) {
        return false;
      }
      if (!needle) return true;
      return (
        system.name.toLowerCase().includes(needle) ||
        system.style.toLowerCase().includes(needle) ||
        system.description.toLowerCase().includes(needle)
      );
    });
  }, [libraryCategory, libraryQuery]);

  const profilePlayer = profilePlayerId ? byId.get(profilePlayerId) ?? null : null;

  // ——— Composition : hydratation, brouillon, publication ———
  const teamKey = teamId ?? `club:${teamName}`;
  const { publishLineup: publishOnMatch } = roster;

  /**
   * Une seule hydratation par équipe, dans l'ordre de vérité :
   *
   * 1. la composition **publiée** sur le prochain match — vérité de l'équipe ;
   * 2. le brouillon local de cette équipe ;
   * 3. à défaut, un onze proposé par poste puis par disponibilité.
   *
   * L'hydratation est un **point de départ**, pas une réaction : elle ne peut
   * donc pas écraser un choix du coach, ni se relancer à chaque rechargement.
   */
  const hydratedTeam = useRef<string | null>(null);
  useEffect(() => {
    if (roster.loading) return;
    if (hydratedTeam.current === teamKey) return;
    hydratedTeam.current = teamKey;
    let cancelled = false;

    const squadIds = new Set(squad.map((player) => player.id));
    /**
     * Un identifiant qui n'est plus dans l'effectif (joueur parti, licence
     * retirée) ne peut pas être restauré : le cran redevient **libre** plutôt
     * que de garder un joueur fantôme jusqu'à la publication.
     */
    const apply = (
      starterIds: (string | null)[],
      nextFormat: MatchFormatKey,
      nextFormation: string,
    ) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const restored = starterIds.map((id) => {
        if (!id || !squadIds.has(id) || seen.has(id)) return null;
        seen.add(id);
        return id;
      });
      setFormat(nextFormat);
      setFormation(nextFormation);
      setLineup(reflowLineup(restored, MATCH_FORMATS_CONFIG[nextFormat].starterCount));
    };

    /** Le format se déduit du nombre de titulaires publiés : 8 rangs ≠ 11v11. */
    const formatFromSlotCount = (count: number): MatchFormatKey =>
      (Object.keys(MATCH_FORMATS_CONFIG) as MatchFormatKey[]).find(
        (key) => MATCH_FORMATS_CONFIG[key].starterCount === count,
      ) ?? '11v11';

    void (async () => {
      const published = readPublishedLineup(roster.nextMatch?.lineup);
      if (published) {
        apply(
          published.starterIds,
          formatFromSlotCount(published.starterIds.length),
          published.formation ?? '4-3-3',
        );
        return;
      }

      const draft = await loadCoachSquadDraft(
        teamKey,
        squad.map((player) => player.id),
        MATCH_FORMATS_CONFIG['11v11'].starterCount,
      );
      if (draft && !squadDraftIsEmpty(draft)) {
        const nextFormat = (
          draft.format in MATCH_FORMATS_CONFIG ? draft.format : '11v11'
        ) as MatchFormatKey;
        apply(draft.starterIds, nextFormat, draft.formation);
        return;
      }

      apply(
        fillLineupFromSquad({ squad, positions: pitchPositions, current: [] }),
        '11v11',
        '4-3-3',
      );
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster.loading, roster.nextMatch, squad, teamKey, pitchPositions]);

  /** Brouillon local — le seul endroit où une composition non publiée est conservée. */
  const saveDraft = useCallback(async () => {
    try {
      await saveCoachSquadDraft(
        teamKey,
        buildSquadDraft({
          format,
          formation,
          starterIds: lineup,
          benchIds: bench.map((player) => player.id),
        }),
      );
      setToast('Brouillon enregistré sur cet appareil');
    } catch {
      setToast('Enregistrement impossible');
    }
    setTimeout(() => setToast(null), 2600);
  }, [bench, formation, format, lineup, teamKey]);

  // ——— Publication sur le prochain match ———
  const publishTarget = roster.nextMatch;
  const canPublish = Boolean(publishTarget) && roster.canManageMatch;
  const [publishing, setPublishing] = useState(false);

  /**
   * Publie la composition sur le prochain match via
   * `teamEventsService.saveLineup` — l'écriture réelle, celle que lit la feuille
   * de match. Aucun succès n'est annoncé si le match ou le droit d'écriture
   * manquent : dans ce cas il n'y a rien à publier, et on le dit.
   */
  const publishComposition = useCallback(async (): Promise<boolean> => {
    if (!publishTarget) {
      setToast('Aucun match à venir pour cette équipe — rien n’a été publié');
      setTimeout(() => setToast(null), 3200);
      return false;
    }
    const payload = buildCoachEventLineup({
      formation,
      slots: pitchSlots,
      starterIds: lineup,
      benchIds: bench.map((player) => player.id),
      byId,
    });
    if (payload.slots.length === 0) {
      setToast('Composition vide — alignez au moins un joueur');
      setTimeout(() => setToast(null), 3200);
      return false;
    }
    setPublishing(true);
    try {
      const published = await publishOnMatch(payload);
      await saveCoachSquadDraft(
        teamKey,
        buildSquadDraft({
          format,
          formation,
          starterIds: lineup,
          benchIds: bench.map((player) => player.id),
          publishedAt: new Date().toISOString(),
        }),
      ).catch(() => undefined);
      /** Publier est un engagement : la session d'essais s'arrête là. */
      setHistory([]);
      const starters = payload.slots.filter((slot) => slot.role === 'starter').length;
      const subs = payload.slots.filter((slot) => slot.role === 'sub').length;
      setToast(`Composition publiée · ${published.title} · ${starters} + ${subs}`);
      return true;
    } catch (publishError) {
      setToast(
        publishError instanceof Error ? publishError.message : 'Publication impossible',
      );
      return false;
    } finally {
      setPublishing(false);
      setTimeout(() => setToast(null), 4000);
    }
  }, [bench, byId, formation, format, lineup, pitchSlots, publishOnMatch, publishTarget, teamKey]);

  // ——— Annulation de session ———
  /**
   * Chaque geste empile l'état **d'avant**. Le coach remonte ainsi toute la
   * session, jusqu'au onze d'ouverture — et non la seule dernière action. La
   * pile vit tant que la page reste ouverte : changer d'écran termine la
   * session, et l'annulation n'est jamais proposée au-delà.
   */
  const [history, setHistory] = useState<CoachLineupSnapshot[]>([]);
  const currentSnapshot = useMemo(
    () => readCoachLineupSnapshot({ format, formation, starterIds: lineup, squad }),
    [formation, format, lineup, squad],
  );
  const snapshotRef = useRef(currentSnapshot);
  snapshotRef.current = currentSnapshot;

  const rememberStep = useCallback(() => {
    setHistory((previous) => pushCoachLineupHistory(previous, snapshotRef.current));
  }, []);

  /**
   * Restauration d'un instantané **complet** : système, onze, *et* disponibilité.
   *
   * La disponibilité vit désormais sur la convocation réelle : annuler une
   * absence doit donc **revenir sur la convocation**, sinon l'écran afficherait
   * un joueur disponible que la base tient toujours pour absent.
   */
  const restoreSnapshot = useCallback(
    (snapshot: CoachLineupSnapshot) => {
      /** La pile vient d'être dépilée : on ne la réalimente pas avec l'état restauré. */
      snapshotRef.current = snapshot;
      setFormat(snapshot.format);
      setFormation(snapshot.formation);
      setLineup(
        reflowLineup(
          snapshot.starterIds,
          MATCH_FORMATS_CONFIG[snapshot.format]?.starterCount ?? snapshot.starterIds.length,
        ),
      );
      snapshot.squad.forEach((player) => {
        const current = byIdRef.current.get(player.id);
        if (!current || current.availability === player.availability) return;
        void roster.setAvailability(player.id, player.availability).catch(() => undefined);
      });
    },
    [roster],
  );

  const canUndo = history.length > 0;

  const undoLineupStep = useCallback(() => {
    const popped = popCoachLineupHistory(history);
    if (!popped) return;
    setHistory(popped.history);
    restoreSnapshot(popped.snapshot);
    setToast('Modification annulée');
    setTimeout(() => setToast(null), 2000);
  }, [history, restoreSnapshot]);

  // ——— Composition ———
  const assignToSlot = useCallback(
    (slotIndex: number, player: SquadPlayer, message?: string) => {
      /** Reposer le même joueur sur le même poste n'est pas un geste à annuler. */
      if (lineup[slotIndex] === player.id) return;
      rememberStep();
      setLineup((prev) => {
        const next = [...prev];
        const existingIndex = next.findIndex((id) => id === player.id);
        if (existingIndex >= 0 && existingIndex !== slotIndex) {
          // Le joueur est déjà aligné ailleurs : on **échange** les deux postes.
          const displaced = next[slotIndex];
          next[slotIndex] = player.id;
          next[existingIndex] = displaced;
          return next;
        }
        next[slotIndex] = player.id;
        return next;
      });
      setToast(message ?? `${player.name} aligné`);
      setTimeout(() => setToast(null), 2000);
    },
    [lineup, rememberStep],
  );

  /**
   * Glisser-déposer d'un jeton — **même chemin que le sélecteur**.
   *
   * Un seul geste couvre les deux cas : le joueur tenu rejoint un poste libre, ou
   * il échange avec le titulaire qui l'occupait déjà.
   */
  const movePlayerToSlot = useCallback(
    (player: SquadPlayer, toSlotIndex: number) => {
      const fromIndex = lineup.indexOf(player.id);
      const swap = fromIndex >= 0 && Boolean(lineup[toSlotIndex]);
      assignToSlot(toSlotIndex, player, swap ? 'Postes échangés' : `${player.name} placé`);
    },
    [assignToSlot, lineup],
  );

  const clearSlot = useCallback(
    (slotIndex: number) => {
      if (!lineup[slotIndex]) return;
      rememberStep();
      setLineup((prev) => prev.map((id, index) => (index === slotIndex ? null : id)));
    },
    [lineup, rememberStep],
  );

  const swapBenchWithSlot = useCallback(
    (slotIndex: number, benchPlayer: SquadPlayer) => {
      assignToSlot(slotIndex, benchPlayer);
    },
    [assignToSlot],
  );

  const changeFormat = (nextFormat: MatchFormatKey) => {
    if (nextFormat === format) {
      setFormatModalVisible(false);
      return;
    }
    rememberStep();
    const config = MATCH_FORMATS_CONFIG[nextFormat];
    setFormat(nextFormat);
    setFormation(config.defaultFormation);
    setLineup((prev) => reflowLineup(prev, config.starterCount));
    setFormatModalVisible(false);
  };

  const changeFormation = (nextFormation: string) => {
    if (nextFormation === formation) return;
    rememberStep();
    setFormation(nextFormation);
    setLibraryVisible(false);
  };

  /**
   * Complète les crans libres par poste puis par disponibilité — règle
   * explicite et explicable, sans note inventée : les choix déjà posés sont
   * conservés, un indisponible n'est jamais aligné.
   */
  const completeLineup = () => {
    rememberStep();
    setLineup(fillLineupFromSquad({ squad, positions: pitchPositions, current: lineup }));
    setTab('composition');
    setMenuVisible(false);
    setToast('Crans libres complétés par poste et disponibilité');
    setTimeout(() => setToast(null), 2600);
  };

  /**
   * Change la disponibilité d'un joueur — **écriture réelle** sur la
   * convocation du prochain match (`updateRsvpAsStaff`). Un joueur qui devient
   * absent quitte le onze : on ne laisse jamais un indisponible sur le terrain.
   */
  const setPlayerAvailability = (playerId: string, availability: SquadAvailability) => {
    const target = byId.get(playerId);
    if (!target || target.availability === availability) return;
    rememberStep();
    void roster.setAvailability(playerId, availability).catch((writeError) => {
      setToast(
        writeError instanceof Error ? writeError.message : 'Mise à jour impossible',
      );
      setTimeout(() => setToast(null), 3600);
    });
    if (availability === 'absent') {
      setLineup((prev) => prev.map((id) => (id === playerId ? null : id)));
    }
  };

  const toggleRole = (playerId: string) => {
    const isStarter = starterIds.has(playerId);
    if (isStarter) {
      rememberStep();
      setLineup((prev) => prev.map((id) => (id === playerId ? null : id)));
      setToast('Joueur sorti du onze');
    } else {
      const emptyIndex = lineup.findIndex((id) => id === null);
      if (emptyIndex < 0) {
        setToast('Le onze est complet — libérez un poste d’abord');
      } else {
        rememberStep();
        setLineup((prev) => prev.map((id, index) => (index === emptyIndex ? playerId : id)));
        setToast('Joueur aligné');
      }
    }
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <View style={styles.root}>
      <CoachScreenHeader
        title="Équipe"
        actions={[
          {
            icon: 'ellipsis-horizontal',
            onPress: () => setMenuVisible(true),
            accessibilityLabel: 'Autres actions d’équipe',
          },
        ]}
      />

      <CoachChapterScroll>
        {/* Deux vues seulement — pas de barre de filtres concurrente. */}
        <View style={styles.segmentRow}>
          <View style={[styles.segment, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <SegmentButton
              label="Effectif"
              icon="people"
              active={tab === 'effectif'}
              onPress={() => setTab('effectif')}
            />
            <SegmentButton
              label="Composition"
              icon="football"
              active={tab === 'composition'}
              onPress={() => setTab('composition')}
            />
          </View>

          {/*
           * Annulation de session — visible dans les deux vues, et **seulement**
           * quand un geste est réversible : rien à afficher sur un onze intact.
           */}
          {canUndo ? (
            <PressableSpring
              onPress={undoLineupStep}
              scaleTo={0.96}
              haptic
              accessibilityRole="button"
              accessibilityLabel={`Annuler la dernière modification (${history.length})`}
              style={[
                styles.undoChip,
                { backgroundColor: tokens.elevated, borderColor: tokens.border },
              ]}
            >
              <Icon name="refresh" size={15} color={tokens.muted} />
              <Text style={[styles.undoText, { color: tokens.foreground }]}>Annuler</Text>
            </PressableSpring>
          ) : null}
        </View>

        {tab === 'effectif' ? (
          /**
           * Recherche, puces de filtre, rangées et fiche joueur viennent de
           * l'annuaire **partagé** avec le pôle Club/Admin : cet écran ne
           * redéfinit plus sa propre liste.
           */
          <CoachRosterDirectory
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Rechercher un joueur"
            filters={FILTERS}
            activeFilter={filter}
            onFilterChange={(id) => setFilter(id as SquadFilter)}
            items={rosterItems}
            onSelect={(item) => setProfilePlayerId(item.id)}
            emptyTitle={
              roster.loading
                ? 'Chargement de l’effectif…'
                : squad.length === 0
                  ? 'Aucun joueur rattaché à cette équipe'
                  : 'Aucun joueur trouvé'
            }
            emptyBody={
              squad.length === 0
                ? 'Importez un effectif (CSV FootClubs / FFF ou feuille PDF) depuis « Actions d’équipe », ou rattachez des joueurs à cette équipe.'
                : 'Modifiez la recherche ou les filtres.'
            }
            header={
              <>
                <Text style={[styles.teamMeta, { color: tokens.muted }]}>
                  {`${squad.length} joueurs · ${presentCount} présents · ${pendingCount} en attente`}
                </Text>

                {/*
                 * La cible de publication est annoncée avant d'agir, jamais après —
                 * et le compteur de réponses en attente vit à côté du match qu'il
                 * concerne. Même définition que l'accueil (`getPendingInviteeUids`).
                 */}
                <View style={styles.matchMetaRow}>
                  <Text
                    numberOfLines={1}
                    style={[styles.dragHint, { color: tokens.muted, textAlign: 'left', flex: 1 }]}
                  >
                    {publishTarget
                      ? `Prochain match · ${publishTarget.title}${roster.canManageMatch ? '' : ' · composition en lecture seule'}`
                      : 'Aucun match à venir : la composition restera un brouillon local.'}
                  </Text>
                  {pendingRsvpCount > 0 ? (
                    <PressableSpring
                      onPress={() => setPendingRsvpSheetOpen(true)}
                      scaleTo={0.96}
                      haptic
                      accessibilityRole="button"
                      accessibilityLabel={`Voir les ${pendingRsvpCount} réponses en attente pour la convocation`}
                      style={[
                        styles.rsvpPendingBadge,
                        { backgroundColor: withAlpha(proSemantic.warning, 0.14) },
                      ]}
                    >
                      <Ionicons name="notifications-outline" size={13} color={proSemantic.warning} />
                      <Text style={styles.rsvpPendingBadgeText}>
                        {pendingRsvpCount} réponse{pendingRsvpCount > 1 ? 's' : ''} en attente
                      </Text>
                    </PressableSpring>
                  ) : null}
                </View>

                {roster.error ? (
                  <Text style={[styles.dragHint, { color: proSemantic.danger }]}>{roster.error}</Text>
                ) : null}

                <PressableSpring
                  onPress={() => setTab('composition')}
                  scaleTo={0.98}
                  haptic
                  accessibilityRole="button"
                  accessibilityLabel="Composer le onze"
                  style={[styles.primaryAction, { backgroundColor: tokens.accent }]}
                >
                  <Icon name="football" size={18} color={tokens.onAccent} />
                  <Text style={[styles.primaryActionText, { color: tokens.onAccent }]}>
                    Composer le onze
                  </Text>
                </PressableSpring>
              </>
            }
          />
        ) : (
          <>
            <View style={styles.metaRow}>
              <MetaChip
                icon="grid"
                label={`${formatConfig.name} · ${TACTICAL_SYSTEMS_BY_ID[formation]?.name ?? formation}`}
                onPress={() => setLibraryVisible(true)}
              />
              <MetaChip icon="shirt" label={`${lineup.filter(Boolean).length}/${slotCount}`} onPress={() => setGuideVisible(true)} />
            </View>

            <PressableSpring
              onPress={() => setGuideVisible(true)}
              scaleTo={0.98}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Ouvrir la composition guidée"
              style={[styles.primaryAction, { backgroundColor: tokens.accent }]}
            >
              <Icon name="star-four-points" size={18} color={tokens.onAccent} />
              <Text style={[styles.primaryActionText, { color: tokens.onAccent }]}>
                Composition guidée
              </Text>
            </PressableSpring>

            {/* Commandes hors pelouse. */}
            <View style={[styles.pitchShell, { backgroundColor: COACH_SITE.surface, borderColor: tokens.border }]}>
              <CoachPitchView
                slots={starters}
                format={format}
                formation={formation}
                tokens={tokens}
                selectedSlotIndex={pickerSlot}
                onSelectSlot={(slotIndex) => {
                  const player = starters[slotIndex];
                  if (player) {
                    setProfilePlayerId(player.id);
                  } else {
                    setPickerSlot(slotIndex);
                  }
                }}
                /** Second chemin, pour ne pas dépendre du seul sélecteur. */
                onMovePlayer={movePlayerToSlot}
              />
            </View>

            <Text style={[styles.dragHint, { color: tokens.muted }]}>
              Touchez un poste pour choisir un joueur, ou maintenez un joueur pour le faire
              glisser sur un autre poste.
            </Text>

            <View style={styles.secondaryRow}>
              <PressableSpring
                onPress={() => void saveDraft()}
                scaleTo={0.97}
                haptic
                accessibilityRole="button"
                accessibilityLabel="Enregistrer le brouillon"
                style={[styles.secondaryAction, { borderColor: tokens.border }]}
              >
                <Icon name="download" size={16} color={tokens.foreground} />
                <Text style={[styles.secondaryActionText, { color: tokens.foreground }]}>
                  Brouillon
                </Text>
              </PressableSpring>
              {/*
               * Publier n'écrit que s'il y a un match **et** un droit d'écriture :
               * un bouton qui ne peut pas aboutir est désactivé plutôt que menteur.
               */}
              <PressableSpring
                onPress={() => void publishComposition()}
                disabled={!canPublish || publishing}
                scaleTo={0.97}
                haptic
                accessibilityRole="button"
                accessibilityLabel={
                  canPublish
                    ? `Publier la composition sur ${publishTarget?.title ?? 'le prochain match'}`
                    : 'Publication indisponible — aucun match à venir pour cette équipe'
                }
                style={[
                  styles.secondaryAction,
                  { borderColor: tokens.accent },
                  !canPublish && { opacity: 0.45 },
                ]}
              >
                <Icon name="cloud-upload" size={16} color={tokens.accent} />
                <Text style={[styles.secondaryActionText, { color: tokens.accent }]}>
                  {publishing ? 'Publication…' : 'Publier'}
                </Text>
              </PressableSpring>
            </View>

            <CoachBenchDrawer
              tokens={tokens}
              subs={bench}
              unselected={unavailable}
              selectedStarterId={null}
              selectedBenchId={null}
              onSelectBenchPlayer={(player) => setProfilePlayerId(player.id)}
              onOpenPlayer={(player) => setProfilePlayerId(player.id)}
            />
          </>
        )}

        {toast ? (
          <View style={[styles.toast, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
            <Icon name="checkmark-circle" size={15} color={proSemantic.success} />
            <Text style={[styles.toastText, { color: tokens.foreground }]}>{toast}</Text>
          </View>
        ) : null}
      </CoachChapterScroll>

      {/* ——— Fiche joueur : renseignements réels, hors effectif ——— */}
      {/*
       * Fiche joueur — même surface que le pôle Club/Admin (annuaire partagé).
       * Le contenu est celui du coach : **adhésion, licence, poste, saison** et
       * présence sur le prochain match. Plus aucune note simulée : le club n'en
       * stocke pas.
       */}
      <CoachRosterProfileSheet
        visible={profilePlayer !== null}
        onClose={() => setProfilePlayerId(null)}
        name={profilePlayer?.name ?? ''}
        badge={
          profilePlayer
            ? profilePlayer.num != null
              ? String(profilePlayer.num)
              : memberInitials(profilePlayer.name)
            : ''
        }
        kicker={
          profilePlayer
            ? `${profilePlayer.pos ?? 'Poste non renseigné'} · ${
                starterIds.has(profilePlayer.id) ? 'Titulaire' : 'Remplaçant'
              }`
            : undefined
        }
        title={
          profilePlayer
            ? membershipStatusLabel(
                profilePlayer.membershipStatus,
                Boolean(profilePlayer.licenseNumber?.trim()),
              )
            : undefined
        }
        meta={
          profilePlayer
            ? `Disponibilité : ${availabilityLabel(profilePlayer.availability)}`
            : undefined
        }
        facts={
          profilePlayer
            ? [
                {
                  label: 'Licence',
                  value: profilePlayer.licenseNumber?.trim() || 'Non renseignée',
                  tone: profilePlayer.licenseNumber?.trim() ? undefined : proSemantic.danger,
                },
                {
                  label: 'Adhésion',
                  value: membershipStatusLabel(
                    profilePlayer.membershipStatus,
                    Boolean(profilePlayer.licenseNumber?.trim()),
                  ),
                  tone: membershipFactTone(profilePlayer.membershipStatus, tokens.muted),
                },
                ...(profilePlayer.teamName
                  ? [{ label: 'Équipe', value: profilePlayer.teamName }]
                  : []),
                ...(profilePlayer.category
                  ? [{ label: 'Catégorie', value: profilePlayer.category }]
                  : []),
                ...(profilePlayer.seasonStats
                  ? [
                      { label: 'Matchs', value: String(profilePlayer.seasonStats.matches) },
                      { label: 'Buts', value: String(profilePlayer.seasonStats.goals) },
                    ]
                  : []),
              ]
            : []
        }
        footnote={
          publishTarget
            ? 'La disponibilité est écrite sur la convocation du prochain match ; la licence relève du pôle Club.'
            : 'Aucun match à venir : la disponibilité ne peut pas encore être pointée.'
        }
        actions={
          profilePlayer
            ? [
                {
                  id: 'role',
                  label: starterIds.has(profilePlayer.id)
                    ? 'Sortir du onze'
                    : 'Aligner dans le onze',
                  icon: 'swap-horizontal',
                  tone: starterIds.has(profilePlayer.id)
                    ? ('neutral' as const)
                    : ('accent' as const),
                  onPress: () => toggleRole(profilePlayer.id),
                },
                {
                  id: 'edit_stats',
                  label: 'Modifier les statistiques',
                  icon: 'stats-chart',
                  tone: 'neutral' as const,
                  onPress: () => openPlayerStatsModal(profilePlayer.id, profilePlayer.name, 'stats'),
                },
                {
                  id: 'edit_rating',
                  label: 'Ajouter ou modifier la note',
                  icon: 'star',
                  tone: 'accent' as const,
                  onPress: () => openPlayerStatsModal(profilePlayer.id, profilePlayer.name, 'rating'),
                },
              ]
            : []
        }
      >
        {profilePlayer ? (
          <View style={{ gap: 14 }}>
            <RosterFilterChips
              label="Disponibilité"
              filters={AVAILABILITY_FILTERS}
              activeId={profilePlayer.availability}
              onChange={(id) => setPlayerAvailability(profilePlayer.id, id as SquadAvailability)}
            />

            {/* Notation & Évaluation Match */}
            {(() => {
              const evalEvent = roster.publishTarget ?? roster.nextMatch;
              const stat = evalEvent?.player_match_stats?.[profilePlayer.id];
              if (!stat) return null;
              const src = stat.source ?? 'manual';
              const st = stat.status ?? 'published';
              const srcColor =
                src === 'ai_generated' ? PRO_DATA_VIOLET : src === 'coach_reviewed' ? proSemantic.success : tokens.accent;

              return (
                <View style={[styles.playerProfileSection, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                  <View style={styles.playerProfileSectionHeader}>
                    <Ionicons name="star" size={14} color={tokens.accent} />
                    <CoachText variant="caption" style={{ fontWeight: '700', color: tokens.foreground }}>
                      Notation & Évaluation ({evalEvent?.title || 'Match'})
                    </CoachText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <View>
                      <CoachText variant="title" style={{ color: stat.rating !== undefined ? tokens.accent : tokens.muted }}>
                        {formatCoachRating(stat.rating)}
                      </CoachText>
                      <CoachText variant="caption" muted>
                        {stat.rating === 0
                          ? 'Note 0.0/10 attribuée'
                          : stat.rating !== undefined
                            ? 'Note enregistrée'
                            : 'Non noté sur ce match'}
                      </CoachText>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: srcColor,
                        backgroundColor: withAlpha(srcColor, 0.1),
                      }}>
                        <CoachText variant="caption" style={{ color: srcColor, fontSize: 10, fontWeight: '700' }}>
                          {formatEvaluationSourceLabel(src)}
                        </CoachText>
                      </View>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: tokens.border }}>
                        <CoachText variant="caption" muted style={{ fontSize: 10, fontWeight: '700' }}>
                          {formatEvaluationStatusLabel(st)}
                        </CoachText>
                      </View>
                    </View>
                  </View>
                  {stat.rating_explanation ? (
                    <CoachText variant="caption" muted style={{ marginTop: 6, fontStyle: 'italic' }}>
                      « {stat.rating_explanation} »
                    </CoachText>
                  ) : null}
                </View>
              );
            })()}

            {/* Performance & Match Sheet Stats */}
            <View style={[styles.playerProfileSection, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
              <View style={styles.playerProfileSectionHeader}>
                <Ionicons name="stats-chart-outline" size={14} color={tokens.accent} />
                <CoachText variant="caption" style={{ fontWeight: '700', color: tokens.foreground }}>
                  Statistiques Matchs & Assiduité
                </CoachText>
              </View>
              <View style={styles.profileStatGrid}>
                <View style={styles.profileStatCell}>
                  <CoachText variant="caption" muted>Matchs</CoachText>
                  <CoachText variant="body" style={{ fontWeight: '800' }}>
                    {profilePlayer.seasonStats?.matches ?? 0}
                  </CoachText>
                </View>
                <View style={styles.profileStatCell}>
                  <CoachText variant="caption" muted>Buts</CoachText>
                  <CoachText variant="body" style={{ fontWeight: '800' }}>
                    {profilePlayer.seasonStats?.goals ?? 0}
                  </CoachText>
                </View>
                <View style={styles.profileStatCell}>
                  <CoachText variant="caption" muted>Passes D.</CoachText>
                  <CoachText variant="body" style={{ fontWeight: '800' }}>
                    {profilePlayer.seasonStats?.assists ?? 0}
                  </CoachText>
                </View>
                <View style={styles.profileStatCell}>
                  <CoachText variant="caption" muted>Assiduité</CoachText>
                  <CoachText variant="body" style={{ fontWeight: '800', color: proSemantic.success }}>
                    {profilePlayer.availability === 'present' ? '100%' : profilePlayer.availability === 'absent' ? 'Absent' : 'En attente'}
                  </CoachText>
                </View>
              </View>
            </View>

            {/* Private Coach Notes & Development Objectives */}
            <View style={[styles.playerProfileSection, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
              <View style={styles.playerProfileSectionHeader}>
                <Ionicons name="document-text-outline" size={14} color={tokens.accent} />
                <CoachText variant="caption" style={{ fontWeight: '700', color: tokens.foreground }}>
                  Notes & Objectifs (Confidentiel Staff)
                </CoachText>
              </View>
              <TextInput
                value={activePlayerNote}
                onChangeText={setActivePlayerNote}
                placeholder="Objectifs de progression, axes de travail, observations..."
                placeholderTextColor={tokens.muted}
                multiline
                numberOfLines={3}
                style={[
                  styles.profileNotesInput,
                  {
                    color: tokens.foreground,
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                  },
                ]}
              />
              <PressableSpring
                onPress={savePlayerNote}
                style={[styles.profileNotesSaveBtn, { backgroundColor: tokens.accent }]}
                accessibilityRole="button"
              >
                <CoachText variant="caption" style={{ color: tokens.onAccent, fontWeight: '700' }}>
                  {savingNote ? 'Enregistrement...' : 'Enregistrer la note'}
                </CoachText>
              </PressableSpring>
            </View>
          </View>
        ) : null}
      </CoachRosterProfileSheet>

      {/* ——— Menu secondaire unique ——— */}
      <SecondaryMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        pendingCount={pendingCount}
        items={[
          {
            id: 'format',
            icon: 'grid',
            label: 'Format de jeu',
            hint: formatConfig.name,
            onPress: () => {
              setMenuVisible(false);
              setFormatModalVisible(true);
            },
          },
          {
            id: 'library',
            icon: 'bookmark',
            label: 'Bibliothèque tactique',
            hint: `${formatConfig.formations.length} systèmes pour ce format`,
            onPress: () => {
              setMenuVisible(false);
              setLibraryVisible(true);
            },
          },
          {
            id: 'complete',
            icon: 'star-four-points',
            label: 'Compléter le onze',
            hint: 'Crans libres : poste puis disponibilité',
            onPress: completeLineup,
          },
          {
            id: 'import',
            icon: 'cloud-upload',
            label: 'Importer un effectif',
            hint: 'CSV FootClubs / FFF ou feuille PDF',
            onPress: () => {
              setMenuVisible(false);
              setImportVisible(true);
            },
          },
          {
            id: 'federation',
            icon: 'globe',
            label: 'Synchroniser la fédération',
            hint: 'Clubs, championnats, équipes',
            onPress: () => {
              setMenuVisible(false);
              setFederationVisible(true);
            },
          },
          {
            id: 'standings',
            icon: 'trophy',
            label: 'Classement',
            hint: 'Compétition en cours',
            onPress: () => {
              setMenuVisible(false);
              setStandingsVisible(true);
            },
          },
          {
            id: 'remind',
            icon: 'notifications',
            label: 'Relancer les présences',
            hint: !publishTarget
              ? 'Aucune convocation ouverte'
              : pendingCount > 0
                ? `${pendingCount} joueur(s) en attente`
                : 'Aucune relance nécessaire',
            onPress: () => {
              setMenuVisible(false);
              if (!publishTarget) {
                Alert.alert('Présences', 'Aucune convocation ouverte pour cette équipe.');
                return;
              }
              if (pendingCount === 0) {
                Alert.alert('Présences', 'Tous les joueurs convoqués ont répondu.');
                return;
              }
              shellNav?.requestNav('messages');
            },
          },
          {
            id: 'manage',
            icon: 'settings',
            label: 'Gestion d’équipe',
            hint: 'Licences, invitations, structure',
            onPress: () => {
              setMenuVisible(false);
              shellNav?.requestNav('gestion');
            },
          },
        ]}
      />

      <FormatSheet
        visible={formatModalVisible}
        format={format}
        onSelect={changeFormat}
        onClose={() => setFormatModalVisible(false)}
      />

      <TacticalLibrarySheet
        visible={libraryVisible}
        formation={formation}
        query={libraryQuery}
        category={libraryCategory}
        systems={filteredSystems}
        onQuery={setLibraryQuery}
        onCategory={setLibraryCategory}
        onSelect={changeFormation}
        onClose={() => setLibraryVisible(false)}
      />

      <Modal
        visible={standingsVisible}
        animationType="slide"
        onRequestClose={() => setStandingsVisible(false)}
      >
        <View style={[styles.root, { backgroundColor: tokens.bg }]}>
          <SheetHeader title="Classement" onClose={() => setStandingsVisible(false)} />
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <CoachStandingsTable compact={false} teamId={teamId} teamName={teamName} />
          </ScrollView>
        </View>
      </Modal>

      <CoachSquadImportPanel
        tokens={tokens}
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onImported={(summary) => {
          setToast(
            `Import terminé · ${summary.updated} mis à jour · ${summary.pending} en attente`,
          );
          setTimeout(() => setToast(null), 4000);
          /** Le roster vient d'être écrit en base : on relit l'effectif réel. */
          void roster.refresh();
        }}
      />

      <FederationSyncDrawer
        visible={federationVisible}
        onClose={() => setFederationVisible(false)}
        onSyncComplete={() => {
          setFederationVisible(false);
          setToast('Effectif synchronisé');
          setTimeout(() => setToast(null), 2600);
          /** La synchronisation fédérale écrit l'effectif : on relit le club. */
          void roster.refresh();
        }}
      />

      <CoachPlayerPicker
        visible={pickerSlot !== null}
        tokens={tokens}
        targetLabel={pickerSlot !== null ? `Poste ${pitchSlots[pickerSlot]?.defaultPos ?? pickerSlot + 1}` : undefined}
        candidates={[...squad].sort(compareSquadReadiness)}
        currentPlayerId={pickerSlot !== null ? lineup[pickerSlot] ?? null : null}
        isPlayerUsed={(playerId) => starterIds.has(playerId)}
        onSelect={(player) => {
          if (pickerSlot !== null) assignToSlot(pickerSlot, player);
          setPickerSlot(null);
        }}
        onClear={
          pickerSlot !== null && lineup[pickerSlot]
            ? () => {
                clearSlot(pickerSlot);
                setPickerSlot(null);
              }
            : undefined
        }
        onClose={() => setPickerSlot(null)}
      />

      <CoachLineupGuide
        visible={guideVisible}
        tokens={tokens}
        onClose={() => setGuideVisible(false)}
        formation={formation}
        format={format}
        pitchSlots={pitchSlots}
        starters={starters}
        bench={bench}
        unavailable={unavailable}
        onAssignToSlot={assignToSlot}
        onClearSlot={clearSlot}
        onSwapBenchWithSlot={swapBenchWithSlot}
        onMovePlayer={movePlayerToSlot}
        onUndo={undoLineupStep}
        canUndo={canUndo}
        saving={publishing}
        onSaveDraft={() => void saveDraft()}
        /**
         * La séquence guidée se ferme **sur un succès seulement** : en cas
         * d'échec, le coach doit voir la composition qu'il n'a pas pu publier.
         */
        onPublish={() => {
          void publishComposition().then((ok) => {
            if (ok) setGuideVisible(false);
          });
        }}
        publishLabel={publishing ? 'Publication…' : 'Publier'}
      />

      {/* Détail des réponses en attente — déroulé du badge de convocation. */}
      <CoachPendingRsvpSheet
        visible={pendingRsvpSheetOpen}
        onClose={() => setPendingRsvpSheetOpen(false)}
        event={publishTarget}
        tokens={tokens}
      />

      {/* Modale de statistiques et notation joueur */}
      {statsRatingModal ? (
        <PlayerStatsRatingModal
          visible={statsRatingModal !== null}
          onClose={() => setStatsRatingModal(null)}
          playerUid={statsRatingModal.uid}
          playerName={statsRatingModal.name}
          matchTitle={statsRatingModal.eventTitle ?? publishTarget?.title ?? roster.publishTarget?.title}
          initialStat={statsRatingModal.stat}
          initialMode={statsRatingModal.mode}
          onSave={handleSaveModalStat}
        />
      ) : null}

      {/* Modal de consultation disciplinaire et override */}
      <DisciplinaryCheckModal
        visible={Boolean(selectedDisciplinaryResult)}
        onClose={() => setSelectedDisciplinaryResult(null)}
        result={selectedDisciplinaryResult}
        clubId={clubId}
        currentUserName={profile?.display_name || 'Coach Principal'}
        currentUserUid={profile?.uid || 'coach_uid'}
        canOverride={true}
        onOverrideSaved={() => {
          loadDiscipline();
          setSelectedDisciplinaryResult(null);
        }}
      />
    </View>
  );
};

function SegmentButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.98}
      haptic
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[
        styles.segmentBtn,
        active && { backgroundColor: tokens.elevated, borderColor: tokens.border },
      ]}
    >
      <Icon name={icon} size={16} color={active ? tokens.accent : tokens.muted} />
      <Text
        style={[
          styles.segmentText,
          { color: active ? tokens.foreground : tokens.muted, fontWeight: active ? '700' : '600' },
        ]}
      >
        {label}
      </Text>
    </PressableSpring>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.97}
      haptic
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.chip, { borderColor: active ? tokens.accent : tokens.border }]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? tokens.accent : tokens.muted, fontWeight: active ? '700' : '600' },
        ]}
      >
        {label}
      </Text>
    </PressableSpring>
  );
}

function MetaChip({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.97}
      haptic
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.metaChip, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
    >
      <Icon name={icon} size={14} color={tokens.accent} />
      <Text style={[styles.metaChipText, { color: tokens.foreground }]} numberOfLines={1}>
        {label}
      </Text>
      <Icon name="chevron-down" size={14} color={tokens.muted} />
    </PressableSpring>
  );
}

function SecondaryMenu({
  visible,
  onClose,
  items,
  pendingCount,
}: {
  visible: boolean;
  onClose: () => void;
  pendingCount: number;
  items: { id: string; icon: IconName; label: string; hint: string; onPress: () => void }[];
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.menuBackdrop}>
        <View style={[styles.menuSheet, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <SheetHeader title="Actions d’équipe" onClose={onClose} embedded />
          <ScrollView contentContainerStyle={styles.menuBody}>
            {items.map((item, index) => (
              <PressableSpring
                key={item.id}
                onPress={item.onPress}
                scaleTo={0.99}
                haptic
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={[
                  styles.menuRow,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: tokens.border,
                  },
                ]}
              >
                <View style={[styles.menuIcon, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                  <Icon name={item.icon} size={18} color={tokens.accent} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, { color: tokens.foreground }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={[styles.menuHint, { color: tokens.muted }]} numberOfLines={1}>
                    {item.hint}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={16} color={tokens.muted} />
              </PressableSpring>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FormatSheet({
  visible,
  format,
  onSelect,
  onClose,
}: {
  visible: boolean;
  format: MatchFormatKey;
  onSelect: (format: MatchFormatKey) => void;
  onClose: () => void;
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const options = Object.keys(MATCH_FORMATS_CONFIG) as MatchFormatKey[];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.menuBackdrop}>
        <View style={[styles.menuSheet, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <SheetHeader title="Format de jeu" onClose={onClose} embedded />
          <ScrollView contentContainerStyle={styles.menuBody}>
            {options.map((key) => {
              const config = MATCH_FORMATS_CONFIG[key];
              const active = key === format;
              return (
                <PressableSpring
                  key={key}
                  onPress={() => onSelect(key)}
                  scaleTo={0.99}
                  haptic
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.menuRow,
                    active && { backgroundColor: tokens.soft },
                  ]}
                >
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, { color: tokens.foreground }]}>
                      {config.name}
                    </Text>
                    <Text style={[styles.menuHint, { color: tokens.muted }]}>
                      {`${config.starterCount} titulaires · ${config.formations.length} systèmes`}
                    </Text>
                  </View>
                  {active ? (
                    <Icon name="checkmark-circle" size={18} color={tokens.accent} />
                  ) : null}
                </PressableSpring>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TacticalLibrarySheet({
  visible,
  formation,
  query,
  category,
  systems,
  onQuery,
  onCategory,
  onSelect,
  onClose,
}: {
  visible: boolean;
  formation: string;
  query: string;
  category: TacticalCategory;
  systems: { id: string; name: string; style: string; categoryLabel: string }[];
  onQuery: (value: string) => void;
  onCategory: (value: TacticalCategory) => void;
  onSelect: (formation: string) => void;
  onClose: () => void;
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const categories: { id: TacticalCategory; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'defense-4', label: 'Défense à 4' },
    { id: 'defense-3-5', label: 'Défense à 3 & 5' },
    { id: 'historical-hybrid', label: 'Historiques' },
    { id: 'small-sided', label: 'Formats réduits' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: tokens.bg }]}>
        <SheetHeader title="Bibliothèque tactique" onClose={onClose} />
        <View style={styles.sheetFilters}>
          <View style={[styles.search, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
            <Icon name="search" size={16} color={tokens.muted} />
            <TextInput
              value={query}
              onChangeText={onQuery}
              placeholder="Rechercher un système"
              placeholderTextColor={tokens.muted}
              style={[styles.searchInput, { color: tokens.foreground }]}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {categories.map((entry) => (
              <FilterChip
                key={entry.id}
                label={entry.label}
                active={category === entry.id}
                onPress={() => onCategory(entry.id)}
              />
            ))}
          </ScrollView>
        </View>
        <ScrollView contentContainerStyle={styles.sheetBody}>
          {systems.length === 0 ? (
            <Text style={[styles.empty, { color: tokens.muted }]}>
              Aucun système ne correspond à cette recherche.
            </Text>
          ) : (
            systems.map((system) => {
              const active = system.id === formation;
              return (
                <PressableSpring
                  key={system.id}
                  onPress={() => onSelect(system.id)}
                  scaleTo={0.99}
                  haptic
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.systemRow,
                    { borderColor: active ? tokens.accent : tokens.border },
                  ]}
                >
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, { color: tokens.foreground }]} numberOfLines={2}>
                      {system.name}
                    </Text>
                    <Text style={[styles.menuHint, { color: tokens.muted }]} numberOfLines={1}>
                      {`${system.categoryLabel} · ${system.style}`}
                    </Text>
                  </View>
                  {active ? <Icon name="checkmark-circle" size={18} color={tokens.accent} /> : null}
                </PressableSpring>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function SheetHeader({
  title,
  onClose,
  embedded = false,
}: {
  title: string;
  onClose: () => void;
  embedded?: boolean;
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  return (
    <View style={[styles.sheetHeader, embedded && styles.sheetHeaderEmbedded]}>
      <Text style={[styles.sheetTitle, { color: tokens.foreground }]} numberOfLines={1}>
        {title}
      </Text>
      <PressableSpring
        onPress={onClose}
        scaleTo={0.94}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
        style={[styles.closeBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
      >
        <Icon name="close" size={18} color={tokens.foreground} />
      </PressableSpring>
    </View>
  );
}

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
    segmentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
      marginBottom: proSpace.md,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      borderRadius: proRadius.pill,
      borderWidth: 1,
      padding: 3,
      gap: 3,
    },
    /** Puce d'annulation — géométrie du registre partagé, jamais un bouton nu. */
    undoChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.xs,
      minHeight: proForm.fieldHeight,
      paddingHorizontal: proSpace.md,
      borderRadius: proRadius.pill,
      borderWidth: 1,
    },
    undoText: { ...proType.caption, fontWeight: '700' },
    /** Une phrase, pas une icône seule : le geste doit être découvrable. */
    dragHint: {
      ...proType.caption,
      textAlign: 'center',
      marginBottom: proSpace.md,
    },
    matchMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
      marginBottom: proSpace.md,
    },
    rsvpPendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    rsvpPendingBadgeText: {
      color: proSemantic.warning,
      ...proType.caption,
      fontWeight: '700',
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: proSpace.sm,
      minHeight: 40,
      borderRadius: proRadius.pill,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    segmentText: { ...proType.nav },
    teamMeta: { ...proType.caption, marginBottom: proSpace.lg },
    primaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: proSpace.sm,
      minHeight: proForm.actionMinHeight,
      borderRadius: proForm.actionRadius,
      paddingHorizontal: proSpace.lg,
      marginBottom: proSpace.lg,
    },
    primaryActionText: { ...proType.nav, fontWeight: '700' },
    search: {
      height: proForm.fieldHeight,
      borderRadius: proForm.fieldRadius,
      borderWidth: 1,
      paddingHorizontal: proSpace.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
      marginBottom: proSpace.md,
    },
    searchInput: { flex: 1, ...proType.body, padding: 0 },
    filters: { flexDirection: 'row', gap: proForm.chipGap, paddingBottom: proSpace.xs },
    chip: {
      minHeight: 40,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      paddingHorizontal: proSpace.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    chipText: { ...proType.caption },
    empty: { ...proType.caption, textAlign: 'center', paddingVertical: proSpace.xl },
    metaRow: { flexDirection: 'row', gap: proSpace.sm, marginBottom: proSpace.md },
    metaChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: proSpace.xs,
      minHeight: proForm.fieldHeight,
      borderRadius: proRadius.md,
      borderWidth: 1,
      paddingHorizontal: proSpace.md,
    },
    metaChipText: { ...proType.caption, fontWeight: '700', flexShrink: 1 },
    pitchShell: {
      borderRadius: proRadius.lg,
      borderWidth: 1,
      padding: proSpace.xs,
      marginBottom: proSpace.md,
    },
    secondaryRow: { flexDirection: 'row', gap: proSpace.sm, marginBottom: proSpace.lg },
    secondaryAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: proSpace.sm,
      minHeight: proForm.actionMinHeight,
      borderRadius: proForm.actionRadius,
      borderWidth: 1,
    },
    secondaryActionText: { ...proType.nav, fontWeight: '600' },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
      borderRadius: proRadius.md,
      borderWidth: 1,
      padding: proSpace.md,
      marginTop: proSpace.md,
    },
    toastText: { ...proType.caption, flex: 1 },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.md,
      paddingHorizontal: coachLayout.pageGutter,
      paddingTop: proSpace.xxl,
      paddingBottom: proSpace.md,
    },
    sheetHeaderEmbedded: { paddingTop: proSpace.lg, paddingHorizontal: 0 },
    sheetTitle: { ...proType.h2, flex: 1, minWidth: 0 },
    closeBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetBody: {
      paddingHorizontal: coachLayout.pageGutter,
      paddingBottom: proSpace.xxl,
      gap: proSpace.md,
    },
    sheetFilters: { paddingHorizontal: coachLayout.pageGutter, gap: proSpace.sm, paddingBottom: proSpace.md },
    systemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.md,
      minHeight: proForm.rowMinHeight,
      borderRadius: proRadius.md,
      borderWidth: 1,
      paddingHorizontal: proSpace.md,
      paddingVertical: proSpace.sm,
    },
    menuBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: COACH_PITCH.scrim,
    },
    menuSheet: {
      borderTopLeftRadius: proRadius.xxl,
      borderTopRightRadius: proRadius.xxl,
      borderWidth: 1,
      paddingHorizontal: proSpace.lg,
      paddingBottom: proSpace.xxl,
      maxHeight: '88%',
    },
    menuBody: { gap: 0 },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.md,
      minHeight: proForm.rowMinHeight,
    },
    menuIcon: {
      width: 38,
      height: 38,
      borderRadius: proRadius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: { flex: 1, minWidth: 0, gap: 2 },
    menuLabel: { ...proType.body, fontWeight: '600' },
    menuHint: { ...proType.caption },
    playerProfileSection: {
      borderRadius: proRadius.md,
      borderWidth: 1,
      padding: proSpace.md,
      gap: proSpace.sm,
    },
    playerProfileSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    profileStatGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      paddingTop: 4,
    },
    profileStatCell: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    profileNotesInput: {
      borderRadius: proRadius.sm,
      borderWidth: 1,
      padding: proSpace.sm,
      fontSize: 12.5,
      minHeight: 64,
      textAlignVertical: 'top',
    },
    profileNotesSaveBtn: {
      alignSelf: 'flex-end',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: proRadius.sm,
    },
  });

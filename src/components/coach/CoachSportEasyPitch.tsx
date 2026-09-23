import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PRO_DATA_VIOLET, proSemantic } from '../../theme/professionalDesign';
import { withAlpha } from '../../utils/coachTeamTheme';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  CoachSportEasyPitchSurface,
  type TacticalAnimationDirective,
} from './CoachSportEasyPitchSurface';
import { CoachText } from './coachPortalUi';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import type { Membership } from '../../models/Membership';
import type { User } from '../../models/User';
import { radius, spacing } from '../../theme/designTokens';
import {
  assignUidToSlot,
  autofillCoachPitchLineup,
  benchUidsForLineup,
  changeCoachPitchFormation,
  clearPitchSlot,
  computeAiMatchAnalysis,
  emptyCoachPitchLineup,
  generateAiLineup,
  generateAiPreMatchSpeech,
  loadCoachPitchLineup,
  loadCoachPitchPresets,
  normalizeCoachPitchLineup,
  saveCoachPitchLineup,
  saveCoachPitchPresets,
  swapPitchSlots,
  type AiLineupRequestType,
  type CoachPitchLineup,
  type CoachTacticalPreset,
} from '../../utils/coachPitchLineup';
import {
  COACH_PITCH_FORMATIONS,
  type CoachPitchFormation,
} from '../../utils/formationPitch';
import { shortPitchName, starterUidsToStadiumCells } from '../../utils/coachStadiumPitchLayout';
import { CoachAiTacticsSheet } from './CoachAiTacticsSheet';

type PitchPlayer = {
  uid: string;
  shortName: string;
  jerseyNumber: number;
};

type Props = {
  memberships: Membership[];
  members: User[];
  clubId: string;
};

function buildRoster(
  teamId: string | null,
  memberships: Membership[],
  members: User[],
): PitchPlayer[] {
  const membersByUid = new Map(members.map((u) => [u.uid, u]));
  const active = teamId
    ? memberships.filter(
        (m) =>
          m.status === 'active' &&
          m.team_id === teamId &&
          m.team_id !== 'unassigned',
      )
    : [];
  const source: Array<{ uid: string; name: string }> =
    active.length > 0
      ? active.map((m) => ({
          uid: m.player_uid,
          name: membersByUid.get(m.player_uid)?.display_name || m.player_name,
        }))
      : members.map((u) => ({ uid: u.uid, name: u.display_name }));

  return source.map((row, index) => {
    const user = membersByUid.get(row.uid);
    const jersey = user?.profile?.jersey_number;
    const name = row.name || 'Joueur';
    return {
      uid: row.uid,
      shortName: shortPitchName(name),
      jerseyNumber: typeof jersey === 'number' && jersey > 0 ? jersey : index + 1,
    };
  });
}

function hydrateLineup(
  raw: Partial<CoachPitchLineup> | null | undefined,
  rosterUids: string[],
): CoachPitchLineup {
  return autofillCoachPitchLineup(normalizeCoachPitchLineup(raw, rosterUids), rosterUids);
}

export function CoachSportEasyPitch({ memberships, members, clubId }: Props) {
  const styles = useCoachThemedStyles(createStyles);
  const shellNav = useCoachShellNav();
  const { tokens, teamId: contextTeamId } = useCoachTheme();
  const teamId = contextTeamId ?? null;
  const storageKey = teamId ?? `club:${clubId}`;

  const [presets, setPresets] = useState<CoachTacticalPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('equipe_type');
  const [lineup, setLineup] = useState<CoachPitchLineup>(() => emptyCoachPitchLineup());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [directive, setDirective] = useState<TacticalAnimationDirective>('projection');
  const [aiSheetVisible, setAiSheetVisible] = useState(false);
  const [causerieExpanded, setCauserieExpanded] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Key roles: Captain, Free Kick, Penalty
  const [assignedRoles, setAssignedRoles] = useState<{
    captainUid?: string | null;
    freeKickUid?: string | null;
    penaltyUid?: string | null;
  }>({});

  const loadedKey = useRef<string | null>(null);
  const rosterUidsRef = useRef<string[]>([]);

  const roster = useMemo(
    () => buildRoster(teamId, memberships, members),
    [teamId, memberships, members],
  );
  const rosterUids = useMemo(() => roster.map((p) => p.uid), [roster]);
  const rosterUidsKey = rosterUids.join(',');
  rosterUidsRef.current = rosterUids;
  const byUid = useMemo(() => new Map(roster.map((p) => [p.uid, p])), [roster]);

  const rosterSimple = useMemo(
    () =>
      members.map((m, idx) => ({
        uid: m.uid,
        name: m.display_name,
        position: m.profile?.position,
        jerseyNumber: m.profile?.jersey_number ?? idx + 1,
      })),
    [members],
  );

  const benchUids = useMemo(
    () => benchUidsForLineup(lineup, rosterUids),
    [lineup, rosterUids],
  );

  const aiAnalysis = useMemo(
    () => computeAiMatchAnalysis(lineup, rosterSimple, benchUids),
    [lineup, rosterSimple, benchUids],
  );

  // Load presets & current lineup
  useEffect(() => {
    let cancelled = false;
    loadedKey.current = null;
    setSelectedSlot(null);
    setPendingUid(null);

    void Promise.all([
      loadCoachPitchPresets(storageKey, rosterUidsRef.current),
      loadCoachPitchLineup(storageKey),
    ]).then(([loadedPresets, rawLineup]) => {
      if (cancelled) return;
      setPresets(loadedPresets);
      const uids = rosterUidsRef.current;
      const initialLineup = hydrateLineup(rawLineup || loadedPresets[0], uids);
      setLineup(initialLineup);
      if (loadedPresets[0]?.directive) {
        setDirective(loadedPresets[0].directive);
      }
      loadedKey.current = storageKey;
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    setLineup((prev) => normalizeCoachPitchLineup(prev, rosterUids));
  }, [rosterUidsKey, rosterUids]);

  // Auto-save lineup and presets
  useEffect(() => {
    if (loadedKey.current !== storageKey || rosterUids.length === 0) return;
    const timer = setTimeout(() => {
      void saveCoachPitchLineup(storageKey, lineup);
    }, 280);
    return () => clearTimeout(timer);
  }, [lineup, storageKey, rosterUids.length]);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) || presets[0],
    [presets, activePresetId],
  );

  const cells = useMemo(
    () =>
      starterUidsToStadiumCells(lineup.starterUids, lineup.formation, (uid) => {
        const p = byUid.get(uid);
        return p
          ? { jerseyNumber: p.jerseyNumber, shortName: p.shortName }
          : undefined;
      }),
    [lineup.starterUids, lineup.formation, byUid],
  );

  const bench = useMemo(
    () =>
      benchUids
        .map((uid) => byUid.get(uid))
        .filter((p): p is PitchPlayer => Boolean(p))
        .map((p) => ({
          uid: p.uid,
          shortName: p.shortName,
          jerseyNumber: p.jerseyNumber,
        })),
    [benchUids, byUid],
  );

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => {
      setFeedbackToast((cur) => (cur === message ? null : cur));
    }, 3200);
  };

  const applyLineup = (next: CoachPitchLineup) => {
    setLineup(next);
    setSelectedSlot(null);
    setPendingUid(null);
  };

  const selectPreset = (preset: CoachTacticalPreset) => {
    setActivePresetId(preset.id);
    const normalized = normalizeCoachPitchLineup(
      { formation: preset.formation, starterUids: preset.starterUids },
      rosterUids,
    );
    applyLineup(autofillCoachPitchLineup(normalized, rosterUids));
    if (preset.directive) setDirective(preset.directive);
  };

  const handleApplyAiPreset = (newPreset: CoachTacticalPreset) => {
    const updated = [newPreset, ...presets.filter((p) => p.id !== newPreset.id)];
    setPresets(updated);
    void saveCoachPitchPresets(storageKey, updated);
    selectPreset(newPreset);
    showToast(`Compo IA "${newPreset.name}" appliquée !`);
  };

  /**
   * 1-Tap AI Lineup Generator
   */
  const handleQuickAiGenerate = (strategy: AiLineupRequestType) => {
    const generated = generateAiLineup(rosterSimple, strategy);
    const preset: CoachTacticalPreset = {
      id: `ai_${strategy}_${Date.now()}`,
      name: generated.name,
      badge: 'IA',
      formation: generated.formation,
      starterUids: generated.starterUids,
      directive: generated.directive,
      description: generated.aiRationale,
      aiRationale: generated.aiRationale,
      keyInstructions: generated.keyInstructions,
    };
    handleApplyAiPreset(preset);
  };

  /**
   * 1-Tap Auto-Align Roles (Captain, Free Kicks, Penalty)
   */
  const handleAutoAssignRoles = () => {
    setAssignedRoles(aiAnalysis.keyRoles);
    showToast('Capitaine & Tireurs assignés par l’IA !');
  };

  /**
   * 1-Tap In-game Substitution
   */
  const handleApplySub = (subInUid: string, subOutUid: string, title: string) => {
    const slotIdx = lineup.starterUids.indexOf(subOutUid);
    if (slotIdx >= 0) {
      applyLineup(assignUidToSlot(lineup, subInUid, slotIdx));
      showToast(`Remplacement appliqué : ${title} !`);
    }
  };

  const onTapSlot = (slotIndex: number) => {
    if (pendingUid) {
      applyLineup(assignUidToSlot(lineup, pendingUid, slotIndex));
      return;
    }
    if (selectedSlot == null) {
      setSelectedSlot(slotIndex);
      return;
    }
    if (selectedSlot === slotIndex) {
      if (lineup.starterUids[slotIndex]) {
        applyLineup(clearPitchSlot(lineup, slotIndex));
      } else {
        setSelectedSlot(null);
      }
      return;
    }
    applyLineup(swapPitchSlots(lineup, selectedSlot, slotIndex));
  };

  const onTapBench = (uid: string) => {
    if (selectedSlot != null) {
      applyLineup(assignUidToSlot(lineup, uid, selectedSlot));
      return;
    }
    setPendingUid((cur) => (cur === uid ? null : uid));
  };

  const speechText = useMemo(
    () => generateAiPreMatchSpeech(lineup.formation, directive, 'l’équipe'),
    [lineup.formation, directive],
  );

  const activeCaptain = byUid.get(
    assignedRoles.captainUid ?? aiAnalysis.keyRoles.captainUid ?? '',
  );
  const activeFreeKick = byUid.get(
    assignedRoles.freeKickUid ?? aiAnalysis.keyRoles.freeKickUid ?? '',
  );
  const activePenalty = byUid.get(
    assignedRoles.penaltyUid ?? aiAnalysis.keyRoles.penaltyUid ?? '',
  );

  if (roster.length === 0) {
    return (
      <View style={styles.empty}>
        <CoachText variant="caption" muted>
          Aucun joueur dans l&apos;effectif pour le moment.
        </CoachText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toast Feedback */}
      {feedbackToast ? (
        <View style={styles.toastCard}>
          <Icon name="checkmark-circle" size={16} color={proSemantic.success} />
          <CoachText style={styles.toastText}>{feedbackToast}</CoachText>
        </View>
      ) : null}

      {/* COMPACT AI TACTICAL COMMAND BAR */}
      <View style={styles.aiStudioHero}>
        <View style={styles.aiHeroHeader}>
          <View style={styles.aiHeroLeft}>
            <View style={styles.aiHeroBadge}>
              <Icon name="stats-chart" size={13} color={proSemantic.success} />
              <CoachText style={styles.aiHeroBadgeText}>TACTIQUE & XI</CoachText>
            </View>
            <CoachText style={styles.aiHeroTitle}>
              {activePreset?.name || '11 Titulaire & Plan de Jeu'}
            </CoachText>
          </View>

          {/* 1-Tap Action Buttons */}
          <View style={styles.aiBtnGroup}>
            <PressableSpring
              style={styles.aiAutoAlignBtn}
              onPress={() => handleQuickAiGenerate('ideal')}
              scaleTo={0.96}
              haptic
            >
              <Icon name="checkmark-circle" size={14} color="#000" />
              <CoachText style={styles.aiAutoAlignBtnText}>11 Idéal</CoachText>
            </PressableSpring>

            <PressableSpring
              style={[styles.aiAutoAlignBtn, { backgroundColor: PRO_DATA_VIOLET }]}
              onPress={() => setAiSheetVisible(true)}
              scaleTo={0.96}
              haptic
            >
              <Icon name="grid" size={14} color="#FFF" />
              <CoachText style={[styles.aiAutoAlignBtnText, { color: '#FFF' }]}>Schémas</CoachText>
            </PressableSpring>

            {shellNav ? (
              <PressableSpring
                style={styles.aiCustomBtn}
                onPress={() => shellNav.requestNav('coach_ia')}
                scaleTo={0.96}
                haptic
              >
                <Icon name="chatbubbles" size={14} color={PRO_DATA_VIOLET} />
              </PressableSpring>
            ) : null}
          </View>
        </View>

        {/* AI Insight Rationale */}
        <View style={styles.aiInsightRow}>
          <Icon name="star-four-points" size={13} color={proSemantic.success} />
          <CoachText numberOfLines={2} style={styles.aiInsightText}>
            {activePreset?.aiRationale ||
              "L'IA a ajusté le schéma tactique, placé les meilleurs joueurs et activé les flèches d'animation."}
          </CoachText>
        </View>
      </View>

      {/* THE STADIUM PITCH SURFACE (CENTERPIECE) */}
      <CoachSportEasyPitchSurface
        formation={lineup.formation}
        cells={cells}
        selectedSlotIndex={selectedSlot}
        pendingUid={pendingUid}
        pendingBenchUid={pendingUid}
        onSlotPress={onTapSlot}
        onSlotLongPress={(slotIndex) => {
          if (lineup.starterUids[slotIndex]) {
            applyLineup(clearPitchSlot(lineup, slotIndex));
          }
        }}
        bench={bench}
        onBenchPress={onTapBench}
        directive={directive}
        onDirectiveChange={setDirective}
        showDirectivesSelector={true}
        showHeader={false}
      />

      {/* COMPACT AI SYNERGY & ROLES SUMMARY */}
      <View style={styles.intelCard}>
        <View style={styles.intelHeader}>
          <View style={styles.intelTitleRow}>
            <Icon name="stats-chart" size={15} color={proSemantic.success} />
            <CoachText style={styles.intelTitle}>Analyse du XI IA</CoachText>
          </View>
          <View style={styles.intelOverallPill}>
            <CoachText style={styles.intelOverallValue}>
              {aiAnalysis.overallScore}/100 • Alchimie {aiAnalysis.chemistryScore}%
            </CoachText>
          </View>
        </View>

        {/* 1-Tap Roles summary */}
        <View style={styles.rolesGrid}>
          <View style={styles.roleCard}>
            <CoachText style={styles.roleBadgeLabel}>©️ Capitaine</CoachText>
            <CoachText numberOfLines={1} style={styles.rolePlayerName}>
              {activeCaptain?.shortName ?? 'Non défini'}
            </CoachText>
          </View>

          <View style={styles.roleCard}>
            <CoachText style={styles.roleBadgeLabel}>🎯 Coup Franc</CoachText>
            <CoachText numberOfLines={1} style={styles.rolePlayerName}>
              {activeFreeKick?.shortName ?? 'Non défini'}
            </CoachText>
          </View>

          <View style={styles.roleCard}>
            <CoachText style={styles.roleBadgeLabel}>⚽ Penalty</CoachText>
            <CoachText numberOfLines={1} style={styles.rolePlayerName}>
              {activePenalty?.shortName ?? 'Non défini'}
            </CoachText>
          </View>
        </View>
      </View>

      {/* AI Tactics Custom Modal Sheet */}
      <CoachAiTacticsSheet
        visible={aiSheetVisible}
        onClose={() => setAiSheetVisible(false)}
        members={members}
        onApplyPreset={handleApplyAiPreset}
      />
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    container: { gap: spacing.md, paddingBottom: spacing.xl },
    empty: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: tokens.surface,
    },

    toastCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: tokens.accent,
      borderWidth: 1,
      borderColor: proSemantic.success,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      borderRadius: radius.pill,
      alignSelf: 'center',
    },
    toastText: {
      color: proSemantic.successSoft,
      fontSize: 12,
      fontWeight: '800',
    },

    aiStudioHero: {
      backgroundColor: tokens.elevated,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: withAlpha(PRO_DATA_VIOLET, 0.35),
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: PRO_DATA_VIOLET,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 4,
    },
    aiHeroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    aiHeroLeft: { gap: 2, flex: 1 },
    aiHeroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    aiHeroBadgeText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: proSemantic.success,
    },
    aiHeroTitle: {
      fontSize: 15,
      fontWeight: '900',
      color: tokens.foreground,
    },
    aiBtnGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aiAutoAlignBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: proSemantic.success,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.pill,
      shadowColor: proSemantic.success,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 3,
    },
    aiAutoAlignBtnText: {
      fontSize: 11.5,
      fontWeight: '900',
      color: tokens.bg,
    },
    aiCustomBtn: {
      backgroundColor: withAlpha(PRO_DATA_VIOLET, 0.2),
      borderWidth: 1,
      borderColor: withAlpha(PRO_DATA_VIOLET, 0.45),
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // AI Insight Capsule
    aiInsightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'withAlpha(tokens.bg, 0.4)',
      borderRadius: radius.md,
      paddingHorizontal: 10,
      paddingVertical: 7,
      gap: 8,
      borderWidth: 0.5,
      borderColor: tokens.border,
    },
    aiInsightText: {
      fontSize: 11,
      color: tokens.muted,
      lineHeight: 15,
      flex: 1,
    },

    // Intelligence Card (Roles & Summary)
    intelCard: {
      backgroundColor: withAlpha(tokens.bg, 0.9),
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    intelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    intelTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    intelTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: tokens.foreground,
    },
    intelOverallPill: {
      backgroundColor: withAlpha('10B981', 0.18),
      borderWidth: 1,
      borderColor: proSemantic.success,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    intelOverallValue: {
      fontSize: 11,
      fontWeight: '800',
      color: proSemantic.success,
    },

    // Roles Grid
    rolesGrid: {
      flexDirection: 'row',
      gap: 6,
    },
    roleCard: {
      flex: 1,
      backgroundColor: withAlpha('FFFFFF', 0.03),
      borderRadius: radius.md,
      padding: 8,
      gap: 3,
      alignItems: 'center',
    },
    roleBadgeLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.muted,
      textTransform: 'uppercase',
    },
    rolePlayerName: {
      fontSize: 11.5,
      fontWeight: '800',
      color: tokens.foreground,
      textAlign: 'center',
    },
  });
}


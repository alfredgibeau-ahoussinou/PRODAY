import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Rect,
} from 'react-native-svg';
import { PressableSpring } from '../motion';
import { CoachText } from './coachPortalUi';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import type { Membership } from '../../models/Membership';
import type { Team } from '../../models/Team';
import type { User } from '../../models/User';
import { radius, spacing } from '../../theme/designTokens';
import {
  assignUidToSlot,
  autofillCoachPitchLineup,
  benchUidsForLineup,
  changeCoachPitchFormation,
  clearPitchSlot,
  emptyCoachPitchLineup,
  loadCoachPitchLineup,
  normalizeCoachPitchLineup,
  saveCoachPitchLineup,
  swapPitchSlots,
  type CoachPitchLineup,
} from '../../utils/coachPitchLineup';
import {
  fillPitchSlots,
  COACH_PITCH_FORMATIONS,
} from '../../utils/formationPitch';

const GRASS_A = '#43B05A';
const GRASS_B = '#348C42';
const MARK = 'rgba(255,255,255,0.92)';
const TOKEN = 34;
const TOKEN_LABEL = 15;
const STRIPE_COUNT = 12;

type PitchPlayer = {
  uid: string;
  shortName: string;
  jerseyNumber: number;
};

type Props = {
  teams: Team[];
  memberships: Membership[];
  members: User[];
  clubId: string;
};

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 10);
  return `${parts[0].slice(0, 1)}. ${parts[parts.length - 1]}`.slice(0, 12);
}

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
      shortName: shortName(name),
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

function SportEasyPitchMarkings() {
  const stripes = Array.from({ length: STRIPE_COUNT }, (_, i) => {
    const h = 105 / STRIPE_COUNT;
    return (
      <Rect
        key={`stripe_${i}`}
        x={0}
        y={i * h}
        width={68}
        height={h + 0.05}
        fill={i % 2 === 0 ? GRASS_A : GRASS_B}
      />
    );
  });

  return (
    <Svg width="100%" height="100%" viewBox="-2 -2 72 109" preserveAspectRatio="none">
      <Defs>
        <ClipPath id="coachEasyPitchClip">
          <Rect x={0} y={0} width={68} height={105} rx={0.6} />
        </ClipPath>
        <ClipPath id="coachEasyTopD">
          <Rect x={12} y={16.5} width={44} height={36} />
        </ClipPath>
        <ClipPath id="coachEasyBottomD">
          <Rect x={12} y={52} width={44} height={36.5} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#coachEasyPitchClip)">
        {stripes}
        <Rect
          x={0.35}
          y={0.35}
          width={67.3}
          height={104.3}
          fill="none"
          stroke={MARK}
          strokeWidth={0.45}
        />
        <Line x1={0.35} y1={52.5} x2={67.65} y2={52.5} stroke={MARK} strokeWidth={0.4} />
        <Circle cx={34} cy={52.5} r={9.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={34} cy={52.5} r={0.38} fill={MARK} />

        <Rect x={13.84} y={0.35} width={40.32} height={16.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Rect x={24.84} y={0.35} width={18.32} height={5.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={34} cy={11} r={0.38} fill={MARK} />
        <Circle
          cx={34}
          cy={11}
          r={9.15}
          fill="none"
          stroke={MARK}
          strokeWidth={0.4}
          clipPath="url(#coachEasyTopD)"
        />

        <Rect x={13.84} y={88.5} width={40.32} height={16.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Rect x={24.84} y={99.5} width={18.32} height={5.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={34} cy={94} r={0.38} fill={MARK} />
        <Circle
          cx={34}
          cy={94}
          r={9.15}
          fill="none"
          stroke={MARK}
          strokeWidth={0.4}
          clipPath="url(#coachEasyBottomD)"
        />

        <Circle cx={0} cy={0} r={1} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={68} cy={0} r={1} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={0} cy={105} r={1} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={68} cy={105} r={1} fill="none" stroke={MARK} strokeWidth={0.4} />
      </G>
    </Svg>
  );
}

export function CoachSportEasyPitch({ teams, memberships, members, clubId }: Props) {
  const { width: winW } = useWindowDimensions();
  const { tokens: themeTokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const playableTeams = useMemo(
    () => teams.filter((team) => !team.is_default || teams.length === 1),
    [teams],
  );
  const [teamId, setTeamId] = useState<string | null>(playableTeams[0]?.id ?? null);
  const [lineup, setLineup] = useState<CoachPitchLineup>(() => emptyCoachPitchLineup());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const loadedKey = useRef<string | null>(null);
  const pendingRaw = useRef<Partial<CoachPitchLineup> | null>(null);
  const rosterUidsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!teamId && playableTeams[0]) setTeamId(playableTeams[0].id);
    if (teamId && playableTeams.length > 0 && !playableTeams.some((t) => t.id === teamId)) {
      setTeamId(playableTeams[0]!.id);
    }
  }, [teamId, playableTeams]);

  const roster = useMemo(
    () => buildRoster(teamId, memberships, members),
    [teamId, memberships, members],
  );
  const rosterUids = useMemo(() => roster.map((p) => p.uid), [roster]);
  const rosterUidsKey = rosterUids.join(',');
  rosterUidsRef.current = rosterUids;
  const byUid = useMemo(() => new Map(roster.map((p) => [p.uid, p])), [roster]);
  const storageKey = teamId ?? `club:${clubId}`;

  useEffect(() => {
    let cancelled = false;
    loadedKey.current = null;
    pendingRaw.current = null;
    setSelectedSlot(null);
    setPendingUid(null);
    void loadCoachPitchLineup(storageKey).then((raw) => {
      if (cancelled) return;
      const uids = rosterUidsRef.current;
      pendingRaw.current = uids.length > 0 ? null : raw;
      setLineup(hydrateLineup(raw, uids));
      loadedKey.current = storageKey;
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    setLineup((prev) => {
      if (pendingRaw.current) {
        const next = hydrateLineup(pendingRaw.current, rosterUids);
        if (rosterUids.length > 0) pendingRaw.current = null;
        return next;
      }
      return normalizeCoachPitchLineup(prev, rosterUids);
    });
  }, [rosterUidsKey, rosterUids]);

  useEffect(() => {
    if (loadedKey.current !== storageKey) return;
    if (rosterUids.length === 0) return;
    const timer = setTimeout(() => {
      void saveCoachPitchLineup(storageKey, lineup);
    }, 280);
    return () => clearTimeout(timer);
  }, [lineup, storageKey, rosterUids.length]);

  const pitchSlots = useMemo(
    () => fillPitchSlots(lineup.starterUids, lineup.formation),
    [lineup.starterUids, lineup.formation],
  );
  const bench = useMemo(
    () =>
      benchUidsForLineup(lineup, rosterUids)
        .map((uid) => byUid.get(uid))
        .filter((p): p is PitchPlayer => Boolean(p)),
    [lineup, rosterUids, byUid],
  );
  const pitchW = Math.min(winW - spacing.md * 4, 360);
  const pitchH = Math.round(pitchW * (105 / 68));

  const applyLineup = (next: CoachPitchLineup) => {
    setLineup(next);
    setSelectedSlot(null);
    setPendingUid(null);
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

  return (
    <View style={styles.root}>
      {playableTeams.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {playableTeams.map((team) => {
            const on = team.id === teamId;
            return (
              <PressableSpring
                key={team.id}
                onPress={() => setTeamId(team.id)}
                scaleTo={0.97}
                style={[styles.chip, on && styles.chipOn]}
              >
                <CoachText
                  variant="caption"
                  inverse={on && !themeTokens.isLight}
                  muted={!on}
                  accent={on && themeTokens.isLight}
                  style={styles.chipText}
                >
                  {team.category || team.name}
                </CoachText>
              </PressableSpring>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {COACH_PITCH_FORMATIONS.map((formation) => {
          const on = lineup.formation === formation;
          return (
            <PressableSpring
              key={formation}
              onPress={() =>
                setLineup((prev) => changeCoachPitchFormation(prev, formation))
              }
              scaleTo={0.97}
              haptic
              style={[styles.chip, on && styles.chipOn]}
            >
              <CoachText
                variant="caption"
                inverse={on && !themeTokens.isLight}
                muted={!on}
                accent={on && themeTokens.isLight}
                style={styles.chipText}
              >
                {formation}
              </CoachText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      <View style={styles.pitchFrame}>
        <View style={[styles.pitch, { width: pitchW, height: pitchH }]}>
          <SportEasyPitchMarkings />
          {pitchSlots.map((cell) => {
            const player = cell.player ? byUid.get(cell.player) : undefined;
            const selected = selectedSlot === cell.slotIndex;
            const left = cell.x * pitchW - TOKEN / 2;
            const top = cell.y * pitchH - TOKEN / 2;
            return (
              <PressableSpring
                key={`slot_${cell.slotIndex}`}
                onPress={() => onTapSlot(cell.slotIndex)}
                onLongPress={
                  player
                    ? () => applyLineup(clearPitchSlot(lineup, cell.slotIndex))
                    : undefined
                }
                scaleTo={0.94}
                haptic
                style={[styles.tokenWrap, { left, top }]}
              >
                <View
                  style={[
                    styles.token,
                    player ? styles.tokenFilled : styles.tokenEmpty,
                    selected && styles.tokenSelected,
                  ]}
                >
                  <CoachText
                    variant="caption"
                    style={[
                      styles.tokenNum,
                      selected || !player ? styles.tokenNumLight : styles.tokenNumDark,
                    ]}
                  >
                    {player ? String(player.jerseyNumber) : '·'}
                  </CoachText>
                </View>
                <CoachText
                  variant="caption"
                  inverse
                  numberOfLines={1}
                  style={styles.tokenName}
                >
                  {player ? player.shortName : ' '}
                </CoachText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      <CoachText variant="caption" style={styles.benchLabel}>
        Banc
      </CoachText>
      {bench.length === 0 ? (
        <CoachText variant="caption" muted>
          {roster.length === 0
            ? 'Aucun joueur dans l’effectif pour le moment.'
            : 'Tout l’effectif est sur le terrain.'}
        </CoachText>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.benchRow}
        >
          {bench.map((player) => {
            const on = pendingUid === player.uid;
            return (
              <PressableSpring
                key={`bench_${player.uid}`}
                onPress={() => onTapBench(player.uid)}
                scaleTo={0.96}
                haptic
                style={styles.benchItem}
              >
                <View style={[styles.benchToken, on && styles.tokenSelected]}>
                  <CoachText
                    variant="caption"
                    style={[styles.tokenNum, on ? styles.tokenNumLight : styles.tokenNumDark]}
                  >
                    {player.jerseyNumber}
                  </CoachText>
                </View>
                <CoachText variant="caption" numberOfLines={1} style={styles.benchName}>
                  {player.shortName}
                </CoachText>
              </PressableSpring>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: tokens.surface,
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: 2,
    },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    chipOn: tokens.isLight
      ? {
          borderColor: tokens.accent,
          backgroundColor: tokens.soft,
        }
      : {
          borderColor: tokens.accent,
          backgroundColor: tokens.accent,
        },
    chipText: {
      fontWeight: '700',
    },
    pitchFrame: {
      alignItems: 'center',
      backgroundColor: tokens.elevated,
      borderRadius: radius.lg,
      padding: spacing.sm,
    },
    pitch: {
      borderRadius: 10,
      overflow: 'hidden',
    },
    tokenWrap: {
      position: 'absolute',
      width: TOKEN,
      alignItems: 'center',
    },
    token: {
      width: TOKEN,
      height: TOKEN,
      borderRadius: TOKEN / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    tokenFilled: {
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(255,255,255,0.95)',
    },
    tokenEmpty: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderColor: 'rgba(255,255,255,0.7)',
      borderStyle: 'dashed',
    },
    tokenSelected: {
      borderColor: tokens.accent,
      backgroundColor: tokens.accent,
      borderStyle: 'solid',
    },
    tokenNum: {
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 16,
    },
    tokenNumDark: { color: tokens.foreground },
    tokenNumLight: { color: '#FFFFFF' },
    tokenName: {
      marginTop: 2,
      fontSize: 9,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      width: TOKEN + 18,
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      height: TOKEN_LABEL,
    },
    benchLabel: {
      color: tokens.foreground,
      fontWeight: '700',
      marginTop: spacing.xs,
    },
    benchRow: {
      gap: spacing.sm,
      paddingVertical: 4,
      paddingRight: spacing.sm,
    },
    benchItem: {
      width: 56,
      alignItems: 'center',
      gap: 4,
    },
    benchToken: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
      borderWidth: 2,
      borderColor: tokens.border,
    },
    benchName: {
      fontSize: 10,
      fontWeight: '600',
      color: tokens.foreground,
      textAlign: 'center',
      width: 56,
    },
  });
}

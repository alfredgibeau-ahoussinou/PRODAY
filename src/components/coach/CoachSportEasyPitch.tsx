import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoachStadiumPitch } from './CoachStadiumPitch';
import { CoachText } from './coachPortalUi';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
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
  emptyCoachPitchLineup,
  loadCoachPitchLineup,
  normalizeCoachPitchLineup,
  saveCoachPitchLineup,
  swapPitchSlots,
  type CoachPitchLineup,
} from '../../utils/coachPitchLineup';
import {
  COACH_PITCH_FORMATIONS,
  type CoachPitchFormation,
} from '../../utils/formationPitch';
import {
  shortPitchName,
  starterUidsToStadiumCells,
} from '../../utils/coachStadiumPitchLayout';

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
  const { teamId: contextTeamId } = useCoachTheme();
  const teamId = contextTeamId ?? null;
  const [lineup, setLineup] = useState<CoachPitchLineup>(() => emptyCoachPitchLineup());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const loadedKey = useRef<string | null>(null);
  const pendingRaw = useRef<Partial<CoachPitchLineup> | null>(null);
  const rosterUidsRef = useRef<string[]>([]);

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
      benchUidsForLineup(lineup, rosterUids)
        .map((uid) => byUid.get(uid))
        .filter((p): p is PitchPlayer => Boolean(p))
        .map((p) => ({
          uid: p.uid,
          shortName: p.shortName,
          jerseyNumber: p.jerseyNumber,
        })),
    [lineup, rosterUids, byUid],
  );

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
    <CoachStadiumPitch
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
      formations={COACH_PITCH_FORMATIONS}
      onFormationChange={(formation) =>
        setLineup((prev) =>
          changeCoachPitchFormation(prev, formation as CoachPitchFormation),
        )
      }
    />
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    empty: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: tokens.surface,
    },
  });
}

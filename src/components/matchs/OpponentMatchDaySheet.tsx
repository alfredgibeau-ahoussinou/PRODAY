import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import { teamEventsService } from '../../services/teamEvents.service';
import { matchTalkService } from '../../services/matchTalk.service';
import { buildOpponentMatchDaySheet } from '../../utils/opponentMatchDaySheet';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

type Props = {
  event: TeamEvent;
  /** Affiche les notes coach (causerie) si disponibles. */
  showCoachNotes?: boolean;
};

/**
 * Fiche adversaire jour J — H2H + forces/faiblesses heuristiques + notes coach.
 * Réutilise Smart Tactics / MatchTalk sans nouvelle collection.
 */
export const OpponentMatchDaySheet: React.FC<Props> = ({
  event,
  showCoachNotes = true,
}) => {
  const { colors } = useAppTheme();
  const [clubEvents, setClubEvents] = useState<TeamEvent[]>([]);
  const [coachNotes, setCoachNotes] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    const clubId = event.club_id;
    if (clubId) {
      void teamEventsService.listForClub(clubId, 80).then((rows) => {
        if (!cancelled) setClubEvents(rows);
      });
    } else {
      setClubEvents([event]);
    }
    if (showCoachNotes) {
      void matchTalkService.getForEvent(event.id).then((brief) => {
        if (!cancelled && brief?.opponent_notes?.trim()) {
          setCoachNotes(brief.opponent_notes.trim());
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [event, showCoachNotes]);

  const model = useMemo(
    () =>
      buildOpponentMatchDaySheet({
        event,
        clubEvents: clubEvents.length ? clubEvents : [event],
        coachNotes,
      }),
    [clubEvents, coachNotes, event],
  );

  const bullet = (items: string[]) =>
    items.length === 0 ? (
      <ProDayText variant="caption" muted>
        —
      </ProDayText>
    ) : (
      items.map((line) => (
        <ProDayText key={line} variant="caption" style={styles.bullet}>
          · {line}
        </ProDayText>
      ))
    );

  return (
    <ProDaySurface
      variant="module"
      style={[styles.card, { borderColor: colors.border }]}
    >
      <ProDayText variant="caption" accent style={styles.kicker}>
        Fiche adversaire · jour J
      </ProDayText>
      <ProDayText variant="section" style={styles.title}>
        {model.homeLabel} vs {model.opponentName}
      </ProDayText>
      {model.metaLine ? (
        <ProDayText variant="caption" muted numberOfLines={2}>
          {model.metaLine}
        </ProDayText>
      ) : null}

      <ProDayText variant="caption" muted style={styles.block}>
        {model.h2hLabel}
      </ProDayText>
      <ProDayText variant="caption" muted>
        {model.confidenceLabel}
      </ProDayText>

      {model.analysis.formation_guess ? (
        <ProDayText variant="caption" style={styles.block}>
          Formation estimée · {model.analysis.formation_guess}
        </ProDayText>
      ) : null}

      <ProDayText variant="caption" accent style={styles.block}>
        Forces
      </ProDayText>
      {bullet(model.analysis.strengths)}

      <ProDayText variant="caption" accent style={styles.block}>
        Faiblesses
      </ProDayText>
      {bullet(model.analysis.weaknesses)}

      {model.analysis.suggested_approach ? (
        <>
          <ProDayText variant="caption" accent style={styles.block}>
            Approche
          </ProDayText>
          <ProDayText variant="caption">{model.analysis.suggested_approach}</ProDayText>
        </>
      ) : null}

      {model.analysis.risk_flags.length > 0 ? (
        <>
          <ProDayText variant="caption" accent style={styles.block}>
            Risques
          </ProDayText>
          {bullet(model.analysis.risk_flags)}
        </>
      ) : null}

      {model.coachNotes ? (
        <>
          <ProDayText variant="caption" accent style={styles.block}>
            Notes coach
          </ProDayText>
          <ProDayText variant="caption">{model.coachNotes}</ProDayText>
        </>
      ) : (
        <ProDayText variant="caption" muted style={styles.block}>
          Notes adversaire : ajoutez-les dans la causerie match.
        </ProDayText>
      )}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: 4 },
  kicker: { fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', fontSize: 10 },
  title: { marginTop: 2 },
  block: { marginTop: spacing.sm },
  bullet: { lineHeight: 18 },
});

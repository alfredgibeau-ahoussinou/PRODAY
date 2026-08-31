import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { matchTalkService } from '../../services/matchTalk.service';
import { tacticalShareService } from '../../services/matchTalk.service';
import type { MatchTalkBrief } from '../../models/MatchTalkBrief';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import { recipientsForAudience } from '../../models/TacticalShare';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { coachTokensAsAppColors } from '../../features/coach/shell/coachTokensAsAppColors';
import { radius, spacing } from '../../theme/designTokens';

/** Causerie match + partage consigne tactique (clips uniquement si analysis_verified). */
export const MatchTalkPanel: React.FC<{
  event: TeamEvent;
  profile: User;
  members: User[];
}> = ({ event, profile, members }) => {
  const { tokens } = useCoachTheme();
  const colors = coachTokensAsAppColors(tokens);
  const [brief, setBrief] = useState<MatchTalkBrief | null>(null);
  const [objective, setObjective] = useState('');
  const [points, setPoints] = useState('');
  const [formation, setFormation] = useState('');
  const [opponentNotes, setOpponentNotes] = useState('');
  const [playerNote, setPlayerNote] = useState('');
  const [playerUid, setPlayerUid] = useState(members[0]?.uid ?? '');
  const memberUids = members.map((m) => m.uid);

  useEffect(() => {
    void matchTalkService.getForEvent(event.id).then((existing) => {
      if (existing) {
        setBrief(existing);
        setObjective(existing.match_objective ?? '');
        setPoints(existing.key_points.join('\n'));
        setFormation(existing.formation ?? '');
        setOpponentNotes(existing.opponent_notes ?? '');
      } else {
        setBrief(
          matchTalkService.createEmpty(event.id, profile.uid, event.club_id ?? profile.profile.club_id),
        );
      }
    });
  }, [event.id, event.club_id, profile.uid, profile.profile.club_id]);

  const save = async () => {
    if (!brief) return;
    const next: MatchTalkBrief = {
      ...brief,
      match_objective: objective.trim() || undefined,
      key_points: points
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      formation: formation.trim() || undefined,
      opponent_notes: opponentNotes.trim() || undefined,
      clips: brief.clips.filter((c) => c.analysis_verified),
      updated_at: new Date(),
    };
    try {
      const saved = await matchTalkService.upsert(next);
      setBrief(saved);
      Alert.alert('OK', 'Causerie enregistrée. Clips non vérifiés exclus.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Sauvegarde impossible');
    }
  };

  const shareTactical = async () => {
    if (!playerUid) {
      Alert.alert('Donnée indisponible', 'Ajoutez un joueur destinataire.');
      return;
    }
    try {
      await tacticalShareService.publish({
        board_event_id: event.id,
        club_id: event.club_id ?? profile.profile.club_id,
        author_uid: profile.uid,
        title: `Consigne · ${event.title}`,
        phase_label: formation.trim() || 'Phase',
        note: playerNote.trim() || 'Voir le positionnement demandé.',
        audience: 'player',
        recipient_uids: recipientsForAudience({
          audience: 'player',
          teamUids: memberUids,
          playerUid,
        }),
      });
      Alert.alert('Envoyé', 'Le joueur verra uniquement sa consigne.');
      setPlayerNote('');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Envoi impossible');
    }
  };

  const shareTeam = async () => {
    try {
      await tacticalShareService.publish({
        board_event_id: event.id,
        club_id: event.club_id ?? profile.profile.club_id,
        author_uid: profile.uid,
        title: `Causerie · ${event.title}`,
        phase_label: 'Équipe',
        note: objective.trim() || points.trim() || 'Consigne collective.',
        audience: 'team',
        recipient_uids: recipientsForAudience({ audience: 'team', teamUids: memberUids }),
      });
      Alert.alert('OK', 'Consigne collective envoyée à l’effectif.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Envoi impossible');
    }
  };

  return (
    <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
      <ProDayText variant="section">Causerie match</ProDayText>
      <ProDayText variant="caption" muted>
        {event.title} — présentation vestiaire. L’IA n’invente aucun clip.
      </ProDayText>
      <TextInput
        placeholder="Objectif du match"
        value={objective}
        onChangeText={setObjective}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
      />
      <TextInput
        placeholder="Points clés (1 ligne = 1 point)"
        value={points}
        onChangeText={setPoints}
        multiline
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.multi, { borderColor: colors.border, color: colors.ink }]}
      />
      <TextInput
        placeholder="Formation"
        value={formation}
        onChangeText={setFormation}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
      />
      <TextInput
        placeholder="Notes adversaire (set-pieces, joueurs clés…)"
        value={opponentNotes}
        onChangeText={setOpponentNotes}
        multiline
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.multi, { borderColor: colors.border, color: colors.ink }]}
      />
      <PressableSpring onPress={() => void save()} scaleTo={0.96} haptic>
        <ProDayText variant="caption" accent style={styles.link}>
          Enregistrer la causerie
        </ProDayText>
      </PressableSpring>
      <PressableSpring onPress={() => void shareTeam()} scaleTo={0.96} haptic>
        <ProDayText variant="caption" accent style={styles.link}>
          Envoyer à toute l’équipe
        </ProDayText>
      </PressableSpring>

      <ProDayText variant="caption" accent style={styles.section}>
        Consigne individuelle
      </ProDayText>
      <View style={styles.chips}>
        {members.slice(0, 12).map((m) => (
          <PressableSpring
            key={m.uid}
            onPress={() => setPlayerUid(m.uid)}
            scaleTo={0.96}
            style={[
              styles.chip,
              {
                borderColor: playerUid === m.uid ? colors.accent : colors.border,
                backgroundColor: playerUid === m.uid ? colors.accentSoft : colors.surfaceMuted,
              },
            ]}
          >
            <ProDayText variant="caption" accent={playerUid === m.uid} numberOfLines={1}>
              {m.display_name}
            </ProDayText>
          </PressableSpring>
        ))}
      </View>
      {members.length === 0 ? (
        <ProDayText variant="caption" muted>
          Donnée indisponible — aucun joueur dans l’effectif.
        </ProDayText>
      ) : null}
      <TextInput
        placeholder="Message (ex. positionnement perte de balle)"
        value={playerNote}
        onChangeText={setPlayerNote}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
      />
      <PressableSpring onPress={() => void shareTactical()} scaleTo={0.96} haptic>
        <ProDayText variant="caption" accent style={styles.link}>
          Envoyer la consigne au joueur
        </ProDayText>
      </PressableSpring>
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  section: { fontWeight: '800', textTransform: 'uppercase', fontSize: 11, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  multi: { minHeight: 72, textAlignVertical: 'top' },
  link: { fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 140,
  },
});

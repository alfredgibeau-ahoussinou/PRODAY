import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { friendlyMatchesService } from '../../services/friendlyMatches.service';
import {
  FRIENDLY_MATCH_KIND_LABELS,
  FRIENDLY_STATUS_LABELS,
  FRIENDLY_VENUE_LABELS,
  type FriendlyMatch,
  type FriendlyMatchKind,
  type FriendlyVenueSide,
} from '../../models/FriendlyMatch';
import type { User } from '../../models/User';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type MatchTab = 'received' | 'sent' | 'create';

interface ClubFriendlyMatchesPanelProps {
  clubId: string;
  clubName: string;
  profile: User;
}

export const ClubFriendlyMatchesPanel: React.FC<ClubFriendlyMatchesPanelProps> = ({
  clubId,
  clubName,
  profile,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [tab, setTab] = useState<MatchTab>('received');
  const [matches, setMatches] = useState<FriendlyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpponent, setFormOpponent] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formCategory, setFormCategory] = useState('U15');
  const [formLevel, setFormLevel] = useState('Départemental');
  const [formKind, setFormKind] = useState<FriendlyMatchKind>('amical');
  const [formVenue, setFormVenue] = useState<FriendlyVenueSide>('home');
  const [formMessage, setFormMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMatches(await friendlyMatchesService.listForClub(clubId));
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const received = matches.filter((m) => m.opponent_club_id === clubId);
  const sent = matches.filter((m) => m.requester_club_id === clubId);

  const createMatch = async () => {
    if (!formCity.trim() || !formDate.trim() || !formTime.trim()) {
      Alert.alert('Champs requis', 'Ville, date et heure sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const date = new Date(formDate);
      if (isNaN(date.getTime())) {
        Alert.alert('Date invalide', 'Format attendu : AAAA-MM-JJ');
        return;
      }
      await friendlyMatchesService.create({
        requester_uid: profile.uid,
        requester_club_id: clubId,
        requester_club_name: clubName,
        opponent_club_name: formOpponent.trim() || undefined,
        city: formCity.trim(),
        date,
        time_label: formTime.trim(),
        category: formCategory,
        level: formLevel,
        level_type: 'competition',
        match_kind: formKind,
        venue_side: formVenue,
        message: formMessage.trim() || undefined,
        mode: formOpponent.trim() ? 'direct' : 'open',
      });
      Alert.alert(
        'Invitation envoyée',
        formOpponent.trim()
          ? `Invitation directe envoyée à ${formOpponent.trim()}.`
          : 'Match publié sur le tableau ouvert.',
      );
      setFormOpponent('');
      setFormMessage('');
      setTab('sent');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec.');
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = (m: FriendlyMatch) => {
    Alert.alert('Accepter', `Confirmer le match contre ${m.requester_club_name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Accepter',
        onPress: () =>
          void friendlyMatchesService.acceptMatch(m.id, clubId, clubName).then(load),
      },
    ]);
  };

  const handleDecline = (m: FriendlyMatch) => {
    void friendlyMatchesService.declineMatch(m.id, clubId).then(load);
  };

  const renderMatch = (m: FriendlyMatch) => {
    const isReceived = m.opponent_club_id === clubId;
    const opponent = isReceived ? m.requester_club_name : (m.opponent_club_name ?? 'Ouvert');
    return (
      <ProDaySurface key={m.id} variant="module" style={[styles.card, { borderColor: c.border }]}>
        <ProDayText variant="section">{opponent}</ProDayText>
        <ProDayText variant="caption">
          {m.category} · {m.city} · {m.date.toLocaleDateString('fr-FR')}
          {m.time_label ? ` · ${m.time_label}` : ''}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {FRIENDLY_STATUS_LABELS[m.status]}
          {m.match_kind ? ` · ${FRIENDLY_MATCH_KIND_LABELS[m.match_kind]}` : ''}
        </ProDayText>
        {m.counter_proposal ? (
          <ProDaySurface variant="module" style={[styles.counter, { borderColor: c.accentSoft }]}>
            <ProDayText variant="caption" accent>
              Contre-proposition de {m.counter_proposal.proposed_by_club_name}
            </ProDayText>
            <ProDayText variant="caption">
              {m.counter_proposal.city} ·{' '}
              {m.counter_proposal.date.toLocaleDateString('fr-FR')} ·{' '}
              {m.counter_proposal.time_label}
            </ProDayText>
            {m.counter_proposal.message ? (
              <ProDayText variant="caption" muted>
                {m.counter_proposal.message}
              </ProDayText>
            ) : null}
          </ProDaySurface>
        ) : null}
        {m.message ? (
          <ProDayText variant="caption" muted numberOfLines={2}>
            {m.message}
          </ProDayText>
        ) : null}
        {isReceived && (m.status === 'INVITED' || m.status === 'OPEN') ? (
          <View style={styles.actions}>
            <PressableSpring
              style={[styles.cta, { backgroundColor: c.brand }]}
              onPress={() => handleAccept(m)}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" inverse>
                Accepter
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              style={[styles.miniCta, { borderColor: c.border, borderWidth: 1 }]}
              onPress={() => handleDecline(m)}
              scaleTo={0.96}
            >
              <ProDayText variant="caption">Refuser</ProDayText>
            </PressableSpring>
          </View>
        ) : null}
        {m.status === 'COUNTERED' && m.requester_club_id === clubId ? (
          <View style={styles.actions}>
            <PressableSpring
              style={[styles.cta, { backgroundColor: c.brand }]}
              onPress={() =>
                void friendlyMatchesService.acceptMatch(m.id, clubId, clubName).then(load)
              }
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" inverse>
                Accepter la contre-proposition
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              style={[styles.miniCta, { borderColor: c.border, borderWidth: 1 }]}
              onPress={() => handleDecline(m)}
              scaleTo={0.96}
            >
              <ProDayText variant="caption">Refuser</ProDayText>
            </PressableSpring>
          </View>
        ) : null}
      </ProDaySurface>
    );
  };

  if (loading) {
    return <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />;
  }

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Matchs amicaux</ProDayText>
      <ProDayText variant="caption" muted>
        Proposez un match, recevez des invitations, contre-proposez.
      </ProDayText>

      <View style={styles.tabs}>
        {(
          [
            { id: 'received' as const, label: `Reçues (${received.length})` },
            { id: 'sent' as const, label: `Envoyées (${sent.length})` },
            { id: 'create' as const, label: '+ Proposer' },
          ] as const
        ).map((t) => (
          <PressableSpring
            key={t.id}
            style={[styles.tabChip, tab === t.id && { backgroundColor: c.brand }]}
            onPress={() => setTab(t.id)}
            scaleTo={0.96}
          >
            <ProDayText
              variant="caption"
              inverse={tab === t.id}
              style={tab !== t.id ? { color: c.textSecondary } : undefined}
            >
              {t.label}
            </ProDayText>
          </PressableSpring>
        ))}
      </View>

      {tab === 'received'
        ? received.length === 0
          ? (
            <ProDayText variant="caption" muted>
              Aucune invitation reçue.
            </ProDayText>
          )
          : received.map(renderMatch)
        : null}

      {tab === 'sent'
        ? sent.length === 0
          ? (
            <ProDayText variant="caption" muted>
              Aucune invitation envoyée.
            </ProDayText>
          )
          : sent.map(renderMatch)
        : null}

      {tab === 'create' ? (
        <ProDaySurface variant="module" style={[styles.form, { borderColor: c.border }]}>
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Nom du club adversaire (vide = tableau ouvert)"
            placeholderTextColor={c.textMuted}
            value={formOpponent}
            onChangeText={setFormOpponent}
          />
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Ville"
            placeholderTextColor={c.textMuted}
            value={formCity}
            onChangeText={setFormCity}
          />
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Date (AAAA-MM-JJ)"
            placeholderTextColor={c.textMuted}
            value={formDate}
            onChangeText={setFormDate}
          />
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Heure (ex: 15h00)"
            placeholderTextColor={c.textMuted}
            value={formTime}
            onChangeText={setFormTime}
          />
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Catégorie (ex: U15)"
            placeholderTextColor={c.textMuted}
            value={formCategory}
            onChangeText={setFormCategory}
          />

          <ProDayText variant="caption" muted>
            Type de match
          </ProDayText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {(Object.keys(FRIENDLY_MATCH_KIND_LABELS) as FriendlyMatchKind[]).map((k) => (
                <PressableSpring
                  key={k}
                  style={[
                    styles.chip,
                    formKind === k && { backgroundColor: c.brand },
                    { borderColor: c.border },
                  ]}
                  onPress={() => setFormKind(k)}
                  scaleTo={0.96}
                >
                  <ProDayText variant="caption" inverse={formKind === k}>
                    {FRIENDLY_MATCH_KIND_LABELS[k]}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </ScrollView>

          <ProDayText variant="caption" muted>
            Lieu
          </ProDayText>
          <View style={styles.chipRow}>
            {(Object.keys(FRIENDLY_VENUE_LABELS) as FriendlyVenueSide[]).map((v) => (
              <PressableSpring
                key={v}
                style={[
                  styles.chip,
                  formVenue === v && { backgroundColor: c.brand },
                  { borderColor: c.border },
                ]}
                onPress={() => setFormVenue(v)}
                scaleTo={0.96}
              >
                <ProDayText variant="caption" inverse={formVenue === v}>
                  {FRIENDLY_VENUE_LABELS[v]}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>

          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Message (optionnel)"
            placeholderTextColor={c.textMuted}
            value={formMessage}
            onChangeText={setFormMessage}
            multiline
          />

          <PressableSpring
            style={[styles.cta, { backgroundColor: c.brand }]}
            onPress={() => void createMatch()}
            disabled={saving}
            scaleTo={0.97}
            haptic
          >
            {saving ? (
              <ActivityIndicator color={c.brandInverse} />
            ) : (
              <ProDayText variant="caption" inverse>
                Envoyer l'invitation
              </ProDayText>
            )}
          </PressableSpring>
        </ProDaySurface>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm, marginTop: spacing.md },
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    tabChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
    },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 4,
      marginTop: spacing.xs,
    },
    counter: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: 2,
      marginTop: spacing.xs,
    },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
    cta: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    miniCta: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
    },
    form: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
  });
}

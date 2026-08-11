import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { PressableSpring } from '../components/motion';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useAuth } from '../context/AuthContext';
import { useMatchActions } from '../hooks/useMatchActions';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import {
  FRIENDLY_STATUS_LABELS,
  type FriendlyMatch,
  type FriendlyMatchStatus,
} from '../models/FriendlyMatch';
import { parseFrenchDate } from '../utils/parseFrenchDate';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

type OrganizeFilter =
  | 'received'
  | 'sent'
  | 'countered'
  | 'confirmed'
  | 'pending';

const FILTERS: { id: OrganizeFilter; label: string }[] = [
  { id: 'received', label: 'Reçues' },
  { id: 'sent', label: 'Envoyées' },
  { id: 'countered', label: 'Contre-propositions' },
  { id: 'confirmed', label: 'Confirmés' },
  { id: 'pending', label: 'En attente' },
];

interface MatchOrganizeScreenProps {
  onBack: () => void;
  onPropose: () => void;
}

export const MatchOrganizeScreen: React.FC<MatchOrganizeScreenProps> = ({
  onBack,
  onPropose,
}) => {
  const { profile } = useAuth();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const {
    acceptMatch,
    declineMatch,
    counterPropose,
    getClubIdentity,
  } = useMatchActions(profile);

  const [filter, setFilter] = useState<OrganizeFilter>('received');
  const [rows, setRows] = useState<FriendlyMatch[]>([]);
  const [clubId, setClubId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [counterDraft, setCounterDraft] = useState<{
    match: FriendlyMatch;
    date: string;
    time: string;
    city: string;
  } | null>(null);

  const load = useCallback(async () => {
    const club = await getClubIdentity();
    if (!club) {
      setRows([]);
      setClubId(null);
      return;
    }
    setClubId(club.id);
    const list = await friendlyMatchesService.listForClub(club.id);
    setRows(list);
  }, [getClubIdentity]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (!clubId) return [];
    return rows.filter((m) => {
      switch (filter) {
        case 'received':
          return (
            m.opponent_club_id === clubId &&
            (m.status === 'INVITED' || m.status === 'OPEN')
          );
        case 'sent':
          return m.requester_club_id === clubId && m.status !== 'ACCEPTED';
        case 'countered':
          return m.status === 'COUNTERED';
        case 'confirmed':
          return m.status === 'ACCEPTED' || m.status === 'PLAYED';
        case 'pending':
          return (
            m.status === 'INVITED' ||
            m.status === 'COUNTERED' ||
            m.status === 'OPEN'
          );
        default:
          return true;
      }
    });
  }, [rows, filter, clubId]);

  const statusLabel = (s: FriendlyMatchStatus) => FRIENDLY_STATUS_LABELS[s] ?? s;

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Matchs à organiser" onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={c.brand} />
        }
      >
        <ProDayText variant="caption" muted>
          Invitations reçues et envoyées, contre-propositions et matchs confirmés.
        </ProDayText>

        <PressableSpring
          style={[styles.cta, { backgroundColor: c.brand }]}
          onPress={onPropose}
          scaleTo={0.97}
          haptic
        >
          <Text style={[styles.ctaText, { color: c.brandInverse }]}>+ Proposer un match</Text>
        </PressableSpring>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {FILTERS.map((f) => (
            <PressableSpring
              key={f.id}
              style={[styles.filterChip, filter === f.id && { backgroundColor: c.brand }]}
              onPress={() => setFilter(f.id)}
              scaleTo={0.96}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.id ? c.brandInverse : c.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </PressableSpring>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <ProDaySurface variant="module" style={[styles.empty, { borderColor: c.border }]}>
            <ProDayText variant="caption" muted>
              Aucun match dans cette section.
            </ProDayText>
          </ProDaySurface>
        ) : null}

        {filtered.map((m) => {
          const isRequester = clubId === m.requester_club_id;
          const title = isRequester
            ? `À ${m.opponent_club_name ?? 'adversaire ouvert'}`
            : `De ${m.requester_club_name}`;
          const counter = m.counter_proposal;
          return (
            <ProDaySurface
              key={m.id}
              variant="module"
              style={[styles.card, { borderColor: c.border }]}
            >
              <ProDayText variant="section">{title}</ProDayText>
              <ProDayText variant="caption" muted>
                {statusLabel(m.status)} · {m.category} · {m.level}
              </ProDayText>
              <ProDayText variant="caption">
                {m.date.toLocaleDateString('fr-FR')} {m.time_label ? `· ${m.time_label}` : ''} ·{' '}
                {m.city}
              </ProDayText>
              {m.message ? (
                <ProDayText variant="caption" muted>
                  {m.message}
                </ProDayText>
              ) : null}
              {counter ? (
                <View style={[styles.counterBox, { backgroundColor: c.surfaceMuted }]}>
                  <ProDayText variant="caption" accent>
                    Contre-proposition de {counter.proposed_by_club_name}
                  </ProDayText>
                  <ProDayText variant="caption">
                    {counter.date.toLocaleDateString('fr-FR')} · {counter.time_label} ·{' '}
                    {counter.city}
                  </ProDayText>
                  {counter.message ? (
                    <ProDayText variant="caption" muted>
                      {counter.message}
                    </ProDayText>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.actions}>
                {(m.status === 'INVITED' || m.status === 'OPEN') && !isRequester ? (
                  <>
                    <ActionBtn
                      styles={styles}
                      colors={c}
                      label="Accepter"
                      onPress={() =>
                        void acceptMatch(m, () => {
                          void load();
                        })
                      }
                      primary
                    />
                    <ActionBtn
                      styles={styles}
                      colors={c}
                      label="Refuser"
                      onPress={() => void declineMatch(m, () => void load())}
                    />
                    <ActionBtn
                      styles={styles}
                      colors={c}
                      label="Autre date"
                      onPress={() =>
                        setCounterDraft({
                          match: m,
                          date: '',
                          time: m.time_label ?? '15:00',
                          city: m.city,
                        })
                      }
                    />
                  </>
                ) : null}
                {m.status === 'COUNTERED' && isRequester ? (
                  <>
                    <ActionBtn
                      styles={styles}
                      colors={c}
                      label="Accepter la contre-proposition"
                      onPress={() =>
                        void acceptMatch(m, () => {
                          void load();
                        })
                      }
                      primary
                    />
                    <ActionBtn
                      styles={styles}
                      colors={c}
                      label="Refuser"
                      onPress={() => void declineMatch(m, () => void load())}
                    />
                  </>
                ) : null}
              </View>
            </ProDaySurface>
          );
        })}

        {counterDraft ? (
          <ProDaySurface variant="elevated" style={[styles.counterForm, { borderColor: c.brand }]}>
            <ProDayText variant="section">Proposer une autre date</ProDayText>
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Date (jj/mm/aaaa)</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.ink }]}
              value={counterDraft.date}
              onChangeText={(date) => setCounterDraft({ ...counterDraft, date })}
              placeholder="12/09/2026"
              placeholderTextColor={c.textMuted}
            />
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Heure</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.ink }]}
              value={counterDraft.time}
              onChangeText={(time) => setCounterDraft({ ...counterDraft, time })}
              placeholder="15:00"
              placeholderTextColor={c.textMuted}
            />
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Lieu</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.ink }]}
              value={counterDraft.city}
              onChangeText={(city) => setCounterDraft({ ...counterDraft, city })}
              placeholderTextColor={c.textMuted}
            />
            <View style={styles.actions}>
              <ActionBtn
                styles={styles}
                colors={c}
                label="Envoyer"
                primary
                onPress={() => {
                  const parsed = parseFrenchDate(counterDraft.date);
                  if (!parsed) {
                    Alert.alert('Date invalide', 'Utilisez jj/mm/aaaa.');
                    return;
                  }
                  void counterPropose(
                    counterDraft.match,
                    {
                      date: parsed,
                      time_label: counterDraft.time.trim() || '15:00',
                      city: counterDraft.city.trim(),
                      message: `Le club adverse propose le ${counterDraft.date} à ${counterDraft.time}.`,
                    },
                    () => {
                      setCounterDraft(null);
                      void load();
                    },
                  );
                }}
              />
              <ActionBtn
                styles={styles}
                colors={c}
                label="Annuler"
                onPress={() => setCounterDraft(null)}
              />
            </View>
          </ProDaySurface>
        ) : null}
      </ScrollView>
    </View>
  );
};

const ActionBtn: React.FC<{
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  label: string;
  onPress: () => void;
  primary?: boolean;
}> = ({ styles, colors, label, onPress, primary }) => (
  <PressableSpring
    style={[
      styles.actionBtn,
      {
        backgroundColor: primary ? colors.brand : colors.surfaceMuted,
        borderColor: colors.border,
      },
    ]}
    onPress={onPress}
    scaleTo={0.96}
  >
    <Text
      style={{
        color: primary ? colors.brandInverse : colors.ink,
        fontWeight: '700',
        fontSize: 12,
      }}
    >
      {label}
    </Text>
  </PressableSpring>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    pad: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    cta: {
      alignSelf: 'flex-start',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    ctaText: { fontWeight: '800', fontSize: 14 },
    filters: { flexGrow: 0 },
    filterChip: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.xs,
      backgroundColor: c.surfaceMuted,
    },
    filterText: { fontSize: 12, fontWeight: '700' },
    empty: { padding: spacing.lg, borderRadius: radius.lg },
    card: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs },
    counterBox: { padding: spacing.sm, borderRadius: radius.md, gap: 4, marginTop: spacing.xs },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
    actionBtn: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    counterForm: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs },
    fieldLabel: { fontSize: 11, fontWeight: '700', marginTop: spacing.xs },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
  });
}

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { useDetectionEvents } from '../hooks/useAppData';
import { countRsvpYes } from '../models/TeamEvent';
import { formatCalendarDate } from '../utils/seasonCalendar';
import { TeamEventDetailScreen } from './TeamEventDetailScreen';
import { CreateTeamEventScreen } from './CreateTeamEventScreen';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme/designTokens';

interface DetectionEventsScreenProps {
  onBack: () => void;
}

type DetectionView = 'list' | 'detail' | 'create';

export const DetectionEventsScreen: React.FC<DetectionEventsScreenProps> = ({
  onBack,
}) => {
  const [view, setView] = useState<DetectionView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { profile } = useAuth();
  const { events, loading, refresh } = useDetectionEvents();

  const canCreate =
    profile &&
    (profile.role === 'coach' ||
      profile.role === 'organizer' ||
      profile.role === 'agent');

  if (view === 'create' && canCreate) {
    return (
      <CreateTeamEventScreen
        defaultType="detection"
        onBack={() => setView('list')}
        onCreated={(id) => {
          refresh();
          setSelectedId(id);
          setView('detail');
        }}
      />
    );
  }

  if (view === 'detail' && selectedId) {
    return (
      <TeamEventDetailScreen
        eventId={selectedId}
        onBack={() => {
          setView('list');
          refresh();
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Journées détection"
        subtitle="Journées de scouting intégrées à votre calendrier ProDay"
        onBack={onBack}
        centered
      />

      <View style={styles.heroBanner}>
        <View style={styles.heroIcon}>
          <Icon name="football" size={22} color={colors.accent} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Scouting ProDay</Text>
          <Text style={styles.heroSub}>
            Journées de détection reliées à votre calendrier — inscrivez-vous ou
            organisez une session pour votre club.
          </Text>
        </View>
      </View>

      {canCreate && (
        <TouchableOpacity style={styles.createBtn} onPress={() => setView('create')}>
          <Icon name="add" size={20} color={colors.brandInverse} />
          <Text style={styles.createText}>Organiser une détection</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const yes = countRsvpYes(item);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedId(item.id);
                  setView('detail');
                }}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{formatCalendarDate(item.starts_at)}</Text>
                <Text style={styles.cardMeta}>
                  {item.city} · {item.organizer_name}
                </Text>
                {item.categories?.length ? (
                  <Text style={styles.cardCats}>{item.categories.join(' · ')}</Text>
                ) : null}
                {item.max_participants ? (
                  <Text style={styles.cardSlots}>
                    {yes} / {item.max_participants} inscrits
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aucune détection programmée. Les clubs et organisateurs peuvent en créer une.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  heroCopy: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  heroSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginTop: 4 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.ink,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  cardCats: { fontSize: 12, color: colors.accent, fontWeight: '700', marginTop: 6 },
  cardSlots: { fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 4 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 48,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
});

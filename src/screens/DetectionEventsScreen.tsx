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
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';

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
  const { colors: themeColors } = useAppTheme();

  const canCreate =
    profile &&
    (profile.role === 'coach' ||
      profile.role === 'organizer' ||
      profile.role === 'agent' ||
      profile.role === 'club');

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
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScreenHeader
        title="Journées détection"
        subtitle="Journées de scouting intégrées à votre calendrier ProDay"
        onBack={onBack}
        centered
      />

      <View
        style={[
          styles.heroBanner,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          },
        ]}
      >
        <View
          style={[
            styles.heroIcon,
            {
              backgroundColor: themeColors.accentSoft,
              borderColor: themeColors.brand,
            },
          ]}
        >
          <Icon name="football" size={22} color={themeColors.brand} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { color: themeColors.text }]}>Scouting ProDay</Text>
          <Text style={[styles.heroSub, { color: themeColors.textSecondary }]}>
            Journées de détection reliées à votre calendrier — inscrivez-vous ou
            organisez une session pour votre club.
          </Text>
        </View>
      </View>

      {canCreate && (
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: themeColors.brand }]}
          onPress={() => setView('create')}
        >
          <Icon name="add" size={20} color={themeColors.brandInverse} />
          <Text style={[styles.createText, { color: themeColors.brandInverse }]}>
            Organiser une détection
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator color={themeColors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const yes = countRsvpYes(item);
            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedId(item.id);
                  setView('detail');
                }}
              >
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.title}</Text>
                <Text style={[styles.cardMeta, { color: themeColors.textMuted }]}>
                  {formatCalendarDate(item.starts_at)}
                </Text>
                <Text style={[styles.cardMeta, { color: themeColors.textMuted }]}>
                  {item.city} · {item.organizer_name}
                </Text>
                {item.categories?.length ? (
                  <Text style={[styles.cardCats, { color: themeColors.brand }]}>
                    {item.categories.join(' · ')}
                  </Text>
                ) : null}
                {item.max_participants ? (
                  <Text style={[styles.cardSlots, { color: themeColors.text }]}>
                    {yes} / {item.max_participants} inscrits
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: themeColors.textMuted }]}>
              Aucune détection programmée. Les clubs et organisateurs peuvent en créer une.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroCopy: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: '900' },
  heroSub: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  createText: { fontWeight: '900', fontSize: 14 },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '900' },
  cardMeta: { fontSize: 13, marginTop: 4 },
  cardCats: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  cardSlots: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  empty: {
    textAlign: 'center',
    marginTop: 48,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
});

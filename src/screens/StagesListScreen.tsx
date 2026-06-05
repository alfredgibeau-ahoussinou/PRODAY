import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { User } from '../models/User';
import type { StageOffer } from '../models/Stage';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { stagesService } from '../services/stages.service';
import { canPublishStages } from '../utils/roleCapabilities';
import { useAppSpace } from '../context/AppSpaceContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { postMatchesAppSpace } from '../constants/appSpaces';
import { formatCalendarDate } from '../utils/seasonCalendar';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

interface StagesListScreenProps {
  profile: User | null;
  onBack: () => void;
  onSelectStage: (stageId: string) => void;
  onCreateStage?: () => void;
}

export const StagesListScreen: React.FC<StagesListScreenProps> = ({
  profile,
  onBack,
  onSelectStage,
  onCreateStage,
}) => {
  const { appSpace } = useAppSpace();
  const { productLine } = useAppTheme();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [offers, setOffers] = useState<StageOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canCreate = profile ? canPublishStages(profile.role) : false;

  const load = useCallback(async () => {
    const list = await stagesService.listOpenOffers();
    setOffers(list);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => offers.filter((o) => postMatchesAppSpace(o, appSpace, productLine)),
    [offers, appSpace, productLine]
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Stages & camps" onBack={onBack} centered />
      {loading ? (
        <ActivityIndicator color={c.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aucun stage ouvert pour le moment. Les clubs peuvent publier des camps et stages
              foot.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectStage(item.id)}
              activeOpacity={0.9}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardClub}>{item.club_name}</Text>
              <Text style={styles.cardMeta}>
                {item.category} · {item.city}
              </Text>
              <Text style={styles.cardDates}>
                {formatCalendarDate(item.start_date)} → {formatCalendarDate(item.end_date)}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.spots}>
                  {item.spots_total - item.spots_taken} place
                  {item.spots_total - item.spots_taken !== 1 ? 's' : ''} restante
                  {item.spots_total - item.spots_taken !== 1 ? 's' : ''}
                </Text>
                {item.price_eur != null ? (
                  <Text style={styles.price}>{item.price_eur} €</Text>
                ) : (
                  <Text style={styles.price}>Sur devis</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      {canCreate && onCreateStage ? (
        <TouchableOpacity style={styles.fab} onPress={onCreateStage}>
          <Icon name="add" size={20} color={c.brandInverse} />
          <Text style={styles.fabText}>Publier un stage</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    loader: { marginTop: spacing.xl },
    list: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md },
    empty: {
      textAlign: 'center',
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: spacing.xl,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitle: { fontSize: 17, fontWeight: '900', color: c.text },
    cardClub: { fontSize: 13, color: c.brand, fontWeight: '700', marginTop: 4 },
    cardMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    cardDates: { fontSize: 12, color: c.text, marginTop: 6 },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    spots: { fontSize: 12, fontWeight: '700', color: c.text },
    price: { fontSize: 12, fontWeight: '800', color: c.brand },
    fab: {
      position: 'absolute',
      bottom: spacing.lg,
      right: spacing.lg,
      left: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.brand,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
    },
    fabText: { color: c.brandInverse, fontWeight: '800', fontSize: 15 },
  });
}

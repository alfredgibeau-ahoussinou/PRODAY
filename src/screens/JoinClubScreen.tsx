import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { Club } from '../models/Club';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { clubsService } from '../services/clubs.service';
import { membershipsService } from '../services/memberships.service';
import type { Membership } from '../models/Membership';
import { Icon } from '../components/ui/Icon';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useTranslation } from '../context/LocaleContext';

interface JoinClubScreenProps {
  profile: User;
  onBack: () => void;
  onJoined: () => void;
}

export const JoinClubScreen: React.FC<JoinClubScreenProps> = ({
  profile,
  onBack,
  onJoined,
}) => {
  const { t } = useTranslation();
  const { colors: themeColors, rootStyle } = useThemedScreen();
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [blockingMembership, setBlockingMembership] = useState<Membership | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [clubResults, memberships] = await Promise.all([
      clubsService.searchByName(query),
      membershipsService.listByPlayer(profile.uid),
    ]);
    setClubs(clubResults);
    setBlockingMembership(
      memberships.find((m) => m.status === 'active' || m.status === 'pending') ?? null
    );
    setLoading(false);
  }, [query, profile.uid]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const blockingClubName = blockingMembership
    ? clubs.find((club) => club.id === blockingMembership.club_id)?.name ?? blockingMembership.club_id
    : null;

  const handleJoin = async (club: Club) => {
    Alert.alert(t('joinClub.confirm.title'), t('joinClub.confirm.body', { name: club.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('joinClub.confirm.join'),
        onPress: async () => {
          setJoiningId(club.id);
          try {
            await membershipsService.requestJoin({
              club_id: club.id,
              player_uid: profile.uid,
              player_name: profile.display_name,
            });
            Alert.alert(
              t('joinClub.pending.title'),
              t('joinClub.pending.body', { name: club.name })
            );
            onJoined();
          } catch (e) {
            Alert.alert(
              t('feed.alert.error'),
              e instanceof Error ? e.message : t('joinClub.error.join')
            );
          } finally {
            setJoiningId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={rootStyle}>
      <ScreenHeader title={t('joinClub.title')} onBack={onBack} centered />
      <Text style={[styles.hint, { color: themeColors.textSecondary }]}>{t('joinClub.hint')}</Text>
      {blockingMembership ? (
        <Text style={[styles.blocked, { color: themeColors.warning ?? themeColors.textSecondary }]}>
          {blockingMembership.status === 'active'
            ? t('joinClub.active.current', { name: blockingClubName ?? blockingMembership.club_id })
            : t('joinClub.pending.current', { name: blockingClubName ?? blockingMembership.club_id })}
        </Text>
      ) : null}
      <SearchBar placeholder={t('joinClub.search')} value={query} onChangeText={setQuery} />
      {loading ? (
        <ActivityIndicator color={themeColors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: themeColors.textMuted }]}>
              {t('joinClub.empty')}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                shadows.card,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => void handleJoin(item)}
              disabled={joiningId === item.id || Boolean(blockingMembership)}
            >
              <View style={styles.cardBody}>
                <Text style={[styles.name, { color: themeColors.text }]}>{item.name}</Text>
                <Text style={[styles.meta, { color: themeColors.textMuted }]}>
                  {[item.city, item.categories?.[0]].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {joiningId === item.id ? (
                <ActivityIndicator color={themeColors.brand} />
              ) : (
                <Icon name="chevron-forward" size={20} color={themeColors.textMuted} />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  loader: { marginTop: spacing.xl },
  blocked: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { textAlign: 'center', marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  cardBody: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 4 },
});

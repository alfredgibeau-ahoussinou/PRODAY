import React, { useMemo, useState } from 'react';
import { useTranslation } from '../context/LocaleContext';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { User } from '../models/User';
import { CoachListCard } from '../components/CoachListCard';
import { DataState } from '../components/DataState';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { useUsersByRole } from '../hooks/useRecruitmentData';
import type { StaffType } from '../services/users.service';
import { isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { isSubScreenShellEnabled } from '../hooks/useSubScreenShell';
import { StaggerReveal, PressableSpring } from '../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';



interface CoachesListScreenProps {
  initialType?: StaffType;
  onBack: () => void;
  onSelect: (user: User) => void;
  onCreatePost?: () => void;
}

export const CoachesListScreen: React.FC<CoachesListScreenProps> = ({
  initialType = 'coach',
  onBack,
  onSelect,
  onCreatePost,
}) => {
  const { t } = useTranslation();
  const [staffType, setStaffType] = useState<StaffType>(initialType);
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const { profile } = useAuth();
  const { isFavorite, toggle } = useFavorites(profile?.uid);
  const { users, loading } = useUsersByRole(staffType, query);
  const { colors: c, rootStyle, productLine } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const useShellHeader = isSubScreenShellEnabled(profile, 'staff');
  const intelligence = useSectionIntelligence('recrutement', profile ?? null, productLine, {
    staffMode: true,
    mercatoPosts: users.length,
  });
  const filterChips = useMemo(
    () => [
      t('coaches.filter.specialty'),
      t('coaches.filter.level'),
      t('coaches.filter.location'),
      t('coaches.filter.filters'),
    ],
    [t]
  );

  const filtersBlock = (
    <>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, staffType === 'coach' && styles.toggleActive]}
          onPress={() => setStaffType('coach')}
        >
          <Text style={[styles.toggleText, staffType === 'coach' && styles.toggleTextActive]}>
            {t('role.coach')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, staffType === 'agent' && styles.toggleActive]}
          onPress={() => setStaffType('agent')}
        >
          <Text style={[styles.toggleText, staffType === 'agent' && styles.toggleTextActive]}>
            {t('role.agent')}
          </Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        placeholder={
          staffType === 'coach' ? t('coaches.search.coach') : t('coaches.search.agent')
        }
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.chips}>
        {filterChips.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, activeChip === chip && styles.chipActive]}
            onPress={() => setActiveChip(activeChip === chip ? null : chip)}
          >
            <Text style={[styles.chipText, activeChip === chip && styles.chipTextActive]}>
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!useShellHeader ? (
        <Text style={styles.section}>
          {staffType === 'coach' ? 'Coachs populaires' : 'Agents en avant'}
        </Text>
      ) : null}
    </>
  );

  const listBody = (
    <DataState
      loading={loading}
      empty={!loading && users.length === 0}
      emptyMessage={
        isFirebaseConfigured()
          ? `Aucun ${staffType === 'coach' ? 'coach' : 'agent'} inscrit pour le moment.`
          : undefined
      }
      firebaseMissing={!isFirebaseConfigured()}
    >
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        ListHeaderComponent={useShellHeader ? filtersBlock : undefined}
        renderItem={({ item, index }) => {
          const row = (
            <CoachListCard
              user={item}
              onPress={onSelect}
              bookmarked={isFavorite(item.uid)}
              onBookmark={() => profile && toggle(item.uid, staffType)}
            />
          );
          return useShellHeader ? <StaggerReveal index={Math.min(index, 8)}>{row}</StaggerReveal> : row;
        }}
        contentContainerStyle={styles.list}
      />
    </DataState>
  );

  const fab = onCreatePost ? (
    <PressableSpring style={[styles.fab, shadows.fab]} onPress={onCreatePost} scaleTo={0.98} haptic>
      <Text style={styles.fabText}>Publier une annonce</Text>
    </PressableSpring>
  ) : null;

  if (useShellHeader) {
    return (
      <TabScreenShell
        caption={t('coaches.caption')}
        title="Recrutement"
        subtitle={
          staffType === 'coach'
            ? `${users.length} coach(s) disponibles`
            : `${users.length} agent(s) disponibles`
        }
        left={<ScreenBackButton onPress={onBack} />}
        flat
      >
        {listBody}
        {fab}
      </TabScreenShell>
    );
  }

  return (
    <View style={[styles.container, rootStyle]}>
      <ScreenHeader
        title="Recrutement"
        subtitle={
          staffType === 'coach' ? `${users.length} coachs` : `${users.length} agents`
        }
        onBack={onBack}
        centered
      />
      {filtersBlock}
      {listBody}
      {fab}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    toggle: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.md,
      padding: 4,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: radius.sm,
    },
    toggleActive: { backgroundColor: c.surface },
    toggleText: { color: c.textSecondary, fontWeight: '600' },
    toggleTextActive: { color: c.brand, fontWeight: '700' },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: c.brand, borderColor: c.brand },
    chipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    chipTextActive: { color: c.brandInverse },
    section: {
      paddingHorizontal: spacing.lg,
      color: c.text,
      fontWeight: '700',
      fontSize: 16,
      marginBottom: spacing.sm,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    },
    fab: {
      position: 'absolute',
      bottom: TAB_BAR_CONTENT_INSET - spacing.sm,
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: c.brand,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    fabText: { color: c.brandInverse, fontWeight: '700' },
  });
}

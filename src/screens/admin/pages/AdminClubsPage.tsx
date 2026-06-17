import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../context/LocaleContext';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { adminConfirmDelete } from '../../../utils/adminConfirm';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { spacing, radius } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';

type ClubsSegment = 'clubs' | 'announcements';

const SEGMENTS: { id: ClubsSegment; label: string }[] = [
  { id: 'clubs', label: 'Clubs' },
  { id: 'announcements', label: 'Annonces' },
];

export const AdminClubsPage: React.FC = () => {
  const { t } = useTranslation();
  const { loading, clubs, announcements, refresh } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [segment, setSegment] = useState<ClubsSegment>('clubs');

  return (
    <AdminPageScaffold
      title="Clubs"
      subtitle="Structures · annonces club"
      loading={loading}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segments}>
        {SEGMENTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.pill, segment === s.id && styles.pillOn]}
            onPress={() => setSegment(s.id)}
          >
            <Text style={[styles.pillText, segment === s.id && styles.pillTextOn]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {segment === 'clubs' && (
        <>
          <AdminSectionHeader title="CLUBS" count={clubs.length} />
          {clubs.length === 0 ? (
            <AdminEmptyState icon="business" title={t('admin.clubs.empty')} subtitle={t('admin.clubs.emptySub')} />
          ) : (
            clubs.map((club) => (
              <AdminEntityCard
                key={club.id}
                icon="business"
                title={club.name}
                subtitle={`${club.city}${club.verified ? t('admin.clubs.verified') : ''}`}
                meta={`${club.categories.join(', ') || '—'} · owner ${club.owner_uid.slice(0, 8)}…`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer le club', club.name, () => adminService.deleteClub(club.id), refresh)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'announcements' && (
        <>
          <AdminSectionHeader title="ANNONCES CLUB" count={announcements.length} />
          {announcements.length === 0 ? (
            <AdminEmptyState icon="notifications" title={t('admin.clubs.postsEmpty')} subtitle={t('admin.clubs.postsEmptySub')} />
          ) : (
            announcements.map((a) => (
              <AdminEntityCard
                key={a.id}
                icon="notifications"
                title={a.title}
                subtitle={a.body.slice(0, 80)}
                meta={`${a.author_name} · ${a.club_id.slice(0, 8)}…`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', a.title, () => adminService.deleteClubAnnouncement(a.id), refresh)
                }
              />
            ))
          )}
        </>
      )}
    </AdminPageScaffold>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    segments: { maxHeight: 44, marginBottom: spacing.md },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      marginRight: spacing.sm,
    },
    pillOn: { backgroundColor: c.ink, borderColor: c.ink },
    pillText: { fontSize: 12, fontWeight: '800', color: c.text },
    pillTextOn: { color: c.brandInverse },
  });
}

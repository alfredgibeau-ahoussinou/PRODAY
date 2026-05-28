import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { adminConfirmDelete } from '../../../utils/adminConfirm';
import { colors, spacing, radius } from '../../../theme/designTokens';

type ClubsSegment = 'clubs' | 'finance' | 'announcements';

const SEGMENTS: { id: ClubsSegment; label: string }[] = [
  { id: 'clubs', label: 'Clubs' },
  { id: 'finance', label: 'Cotisations' },
  { id: 'announcements', label: 'Annonces' },
];

export const AdminClubsPage: React.FC = () => {
  const { loading, clubs, payments, announcements, refresh } = useAdminData();
  const [segment, setSegment] = useState<ClubsSegment>('clubs');

  return (
    <AdminPageScaffold
      title="Clubs & finance"
      subtitle="Structures · cotisations équipe · annonces club"
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
            <AdminEmptyState icon="business" title="Aucun club" subtitle="Structures créées." />
          ) : (
            clubs.map((c) => (
              <AdminEntityCard
                key={c.id}
                icon="business"
                title={c.name}
                subtitle={`${c.city}${c.verified ? ' · vérifié' : ''}`}
                meta={`${c.categories.join(', ') || '—'} · owner ${c.owner_uid.slice(0, 8)}…`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer le club', c.name, () => adminService.deleteClub(c.id), refresh)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'finance' && (
        <>
          <AdminSectionHeader title="COTISATIONS CLUB" count={payments.length} />
          {payments.length === 0 ? (
            <AdminEmptyState icon="calendar" title="Aucune cotisation" subtitle="Demandes de paiement équipe." />
          ) : (
            payments.map((p) => (
              <AdminEntityCard
                key={p.id}
                icon="calendar"
                title={`${p.member_name} — ${p.amount_eur} €`}
                subtitle={p.label}
                meta={`${p.status} · échéance ${p.due_at.toLocaleDateString('fr-FR')}`}
                secondaryLabel={p.status === 'paid' ? 'Remettre pending' : 'Marquer payé'}
                onSecondary={() =>
                  adminService
                    .updatePaymentStatus(p.id, p.status === 'paid' ? 'pending' : 'paid')
                    .then(() => refresh())
                }
                onDelete={() =>
                  adminConfirmDelete('Supprimer', p.label, () => adminService.deletePaymentRequest(p.id), refresh)
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
            <AdminEmptyState icon="notifications" title="Aucune annonce" subtitle="Annonces publiées par les clubs." />
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

const styles = StyleSheet.create({
  segments: { maxHeight: 44, marginBottom: spacing.md },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  pillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.text },
  pillTextOn: { color: colors.brandInverse },
});

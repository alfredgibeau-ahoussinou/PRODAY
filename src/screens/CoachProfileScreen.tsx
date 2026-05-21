import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import type { User } from '../models/User';
import { canContactMinors } from '../models/User';
import { VerificationBadge } from '../components/VerificationBadge';
import { StarRating } from '../components/StarRating';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

type TabId = 'profil' | 'experience' | 'diplomes' | 'avis';

const TABS: { id: TabId; label: string }[] = [
  { id: 'profil', label: 'Profil' },
  { id: 'experience', label: 'Expérience' },
  { id: 'diplomes', label: 'Diplômes' },
  { id: 'avis', label: 'Avis' },
];

interface CoachProfileScreenProps {
  staff: User;
  onBack: () => void;
  onContact?: (user: User) => void;
  onHire?: (user: User) => void;
}

export const CoachProfileScreen: React.FC<CoachProfileScreenProps> = ({
  staff,
  onBack,
  onContact,
  onHire,
}) => {
  const [tab, setTab] = useState<TabId>('profil');
  const p = staff.profile;
  const canContact = canContactMinors(staff);
  const roleLabel = staff.role === 'agent' ? 'Agent sportif' : 'Coach';

  const handleShare = async () => {
    await Share.share({
      message: `ProDay — ${staff.display_name}, ${p.job_title ?? roleLabel}`,
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {staff.display_name}
        </Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.share}>Partager</Text>
        </TouchableOpacity>
      </View>

      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{staff.display_name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{staff.display_name}</Text>
          <Text style={styles.jobTitle}>{p.job_title ?? roleLabel}</Text>
          <Text style={styles.meta}>
            {p.years_experience ? `${p.years_experience} ans d'expérience · ` : ''}
            {staff.city}
            {staff.department ? ` (${staff.department})` : ''}
          </Text>
          {p.rating != null && (
            <View style={styles.ratingWrap}>
              <StarRating rating={p.rating} />
            </View>
          )}
          {(staff.role === 'coach' || staff.role === 'agent') && (
            <View style={styles.badgeWrap}>
              <VerificationBadge user={staff} />
            </View>
          )}
        </View>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === 'profil' && <TabProfil staff={staff} />}
          {tab === 'experience' && <TabExperience staff={staff} />}
          {tab === 'diplomes' && <TabDiplomes staff={staff} />}
          {tab === 'avis' && <TabAvis staff={staff} />}
        </View>
      </ScrollView>

      <View style={[styles.footer, shadows.card]}>
        <TouchableOpacity
          style={[styles.btnOutline, !canContact && styles.btnDisabled]}
          onPress={() => canContact && onContact?.(staff)}
          disabled={!canContact}
        >
          <Text style={styles.btnOutlineText}>
            {canContact ? 'Contacter' : '🔒 Contacter'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, !canContact && styles.btnDisabledPrimary]}
          onPress={() => canContact && onHire?.(staff)}
          disabled={!canContact}
        >
          <Text style={styles.btnPrimaryText}>Engager</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TabProfil: React.FC<{ staff: User }> = ({ staff }) => {
  const p = staff.profile;
  return (
    <>
      {p.bio && (
        <View style={[styles.block, shadows.card]}>
          <Text style={styles.blockTitle}>À propos</Text>
          <Text style={styles.bodyText}>{p.bio}</Text>
        </View>
      )}
      {p.specialties && p.specialties.length > 0 && (
        <View style={[styles.block, shadows.card]}>
          <Text style={styles.blockTitle}>Spécialités</Text>
          <View style={styles.tags}>
            {p.specialties.map((s) => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {p.license_number && (
        <View style={[styles.block, shadows.card]}>
          <Text style={styles.blockTitle}>Licence</Text>
          <Text style={styles.bodyText}>{p.license_number}</Text>
        </View>
      )}
    </>
  );
};

const TabExperience: React.FC<{ staff: User }> = ({ staff }) => {
  const items = staff.profile.experiences ?? [];
  if (!items.length) {
    return <Text style={styles.empty}>Aucune expérience renseignée.</Text>;
  }
  return (
    <View style={[styles.block, shadows.card]}>
      <Text style={styles.blockTitle}>Expérience</Text>
      {items.map((exp, i) => (
        <View key={exp.id} style={[styles.timelineItem, i > 0 && styles.timelineBorder]}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineBody}>
            <Text style={styles.expTitle}>{exp.title}</Text>
            <Text style={styles.expOrg}>{exp.organization}</Text>
            <Text style={styles.expPeriod}>{exp.period}</Text>
            {exp.description && (
              <Text style={styles.expDesc}>{exp.description}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const TabDiplomes: React.FC<{ staff: User }> = ({ staff }) => {
  const items = staff.profile.diplomas_list ?? [];
  if (!items.length) {
    return <Text style={styles.empty}>Aucun diplôme uploadé.</Text>;
  }
  return (
    <View style={[styles.block, shadows.card]}>
      <Text style={styles.blockTitle}>Diplômes & certifications</Text>
      {items.map((d) => (
        <View key={d.id} style={styles.diplomaRow}>
          <View style={styles.diplomaInfo}>
            <Text style={styles.diplomaName}>{d.name}</Text>
            <Text style={styles.diplomaInst}>
              {d.institution}
              {d.year ? ` · ${d.year}` : ''}
            </Text>
          </View>
          {d.verified ? (
            <View style={styles.diplomaVerified}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.diplomaVerifiedText}>Vérifié</Text>
            </View>
          ) : (
            <View style={styles.diplomaPending}>
              <Text style={styles.diplomaPendingText}>
                {d.status === 'pending' ? 'En attente' : 'À vérifier'}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const TabAvis: React.FC<{ staff: User }> = ({ staff }) => {
  const items = staff.profile.reviews ?? [];
  if (!items.length) {
    return <Text style={styles.empty}>Pas encore d&apos;avis.</Text>;
  }
  return (
    <>
      {staff.profile.rating != null && (
        <View style={[styles.block, shadows.card, styles.reviewSummary]}>
          <Text style={styles.reviewAvg}>{staff.profile.rating.toFixed(1)}</Text>
          <StarRating rating={staff.profile.rating} />
          <Text style={styles.reviewCount}>{items.length} avis</Text>
        </View>
      )}
      {items.map((r) => (
        <View key={r.id} style={[styles.block, shadows.card, styles.reviewCard]}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewAuthor}>{r.author_name}</Text>
            <StarRating rating={r.rating} size="sm" />
          </View>
          <Text style={styles.bodyText}>{r.comment}</Text>
          <Text style={styles.reviewDate}>{r.created_at}</Text>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { fontSize: 22, color: colors.bluePrimary, marginRight: spacing.md },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  share: { color: colors.bluePrimary, fontWeight: '600' },
  hero: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.blueCyan + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarLetter: { fontSize: 40, fontWeight: '800', color: colors.bluePrimary },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  jobTitle: { color: colors.bluePrimary, fontSize: 16, fontWeight: '600', marginTop: 4 },
  meta: { color: colors.textSecondary, fontSize: 14, marginTop: 4, textAlign: 'center' },
  ratingWrap: { marginTop: spacing.sm },
  badgeWrap: { marginTop: spacing.md },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.bluePrimary },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: colors.bluePrimary },
  tabContent: { padding: spacing.lg, paddingBottom: 100 },
  block: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  bodyText: { color: colors.textSecondary, lineHeight: 22, fontSize: 15 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.blueBright,
  },
  tagText: { color: colors.bluePrimary, fontSize: 12, fontWeight: '600' },
  timelineItem: { flexDirection: 'row', paddingVertical: spacing.md },
  timelineBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bluePrimary,
    marginTop: 6,
    marginRight: spacing.md,
  },
  timelineBody: { flex: 1 },
  expTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  expOrg: { color: colors.bluePrimary, marginTop: 2, fontSize: 14 },
  expPeriod: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  expDesc: { color: colors.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 20 },
  diplomaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  diplomaInfo: { flex: 1 },
  diplomaName: { fontWeight: '700', color: colors.text, fontSize: 14 },
  diplomaInst: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  diplomaVerified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  check: { color: colors.success, fontWeight: '800', fontSize: 16 },
  diplomaVerifiedText: { color: colors.success, fontWeight: '700', fontSize: 12 },
  diplomaPending: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diplomaPendingText: { color: colors.warning, fontSize: 11, fontWeight: '700' },
  reviewSummary: { alignItems: 'center' },
  reviewAvg: { fontSize: 36, fontWeight: '800', color: colors.text },
  reviewCount: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  reviewCard: {},
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewAuthor: { fontWeight: '700', color: colors.text },
  reviewDate: { color: colors.textMuted, fontSize: 11, marginTop: spacing.sm },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.bluePrimary, fontWeight: '700' },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  btnDisabled: { borderColor: colors.textMuted, opacity: 0.6 },
  btnDisabledPrimary: { backgroundColor: colors.textMuted },
});

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { User } from '../models/User';
import { canContactMinors } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { StarRating } from '../components/StarRating';
import { Icon } from '../components/ui/Icon';
import { spacing, radius, shadows } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useAppTheme } from '../context/ProductLineContext';
import { useAuth } from '../context/AuthContext';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { isSubScreenShellEnabled } from '../hooks/useSubScreenShell';

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
  const { colors: themeColors, productLine } = useAppTheme();
  const { profile: myProfile } = useAuth();
  const styles = useMemo(() => createCoachStyles(themeColors), [themeColors]);
  const useShellHeader =
    isSubScreenShellEnabled(myProfile, 'staff') && myProfile?.uid !== staff.uid;
  const intelligence = useSectionIntelligence('recrutement', myProfile ?? null, productLine, {
    staffMode: true,
  });
  const [tab, setTab] = useState<TabId>('profil');
  const p = staff.profile;
  const canContact = canContactMinors(staff);
  const roleLabel = staff.role === 'agent' ? 'Agent sportif' : 'Entraîneur principal';
  const verified = staff.is_verified && staff.verification_status === 'VERIFIED';
  const profileTitle = staff.role === 'agent' ? 'Profil agent' : 'Profil coach';

  const scrollBody = (
    <>
      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{staff.display_name.charAt(0)}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{staff.display_name}</Text>
            {verified && (
              <Icon name="checkmark-circle" size={20} color={themeColors.brandLight} />
            )}
          </View>
          <Text style={styles.jobTitle}>{p.job_title ?? roleLabel}</Text>
          <View style={styles.locRow}>
            <Icon name="location" size={14} color={themeColors.textMuted} />
            <Text style={styles.meta}>
              {staff.city ?? 'France'}
              {staff.department ? ` (${staff.department})` : ''}
            </Text>
          </View>
          {verified && (
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
          {p.rating != null && (
            <View style={styles.ratingWrap}>
              <StarRating rating={p.rating} />
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

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnOutline, !canContact && styles.btnDisabled]}
          onPress={() => canContact && onContact?.(staff)}
          disabled={!canContact}
        >
          <Icon name="mail" size={18} color={themeColors.brand} />
          <Text style={styles.btnOutlineText}>Contacter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, !canContact && styles.btnDisabledPrimary]}
          onPress={() => canContact && onHire?.(staff)}
          disabled={!canContact}
        >
          <Icon name="briefcase" size={18} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>Engager</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (useShellHeader) {
    return (
      <TabScreenShell
        caption="Mercato"
        title={profileTitle}
        subtitle={staff.display_name}
        left={<ScreenBackButton onPress={onBack} />}
        
        flat
      >
        <View style={styles.root}>{scrollBody}</View>
      </TabScreenShell>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title={profileTitle} onBack={onBack} onMenu={() => {}} centered />
      {scrollBody}
    </View>
  );
};

const TabProfil: React.FC<{ staff: User }> = ({ staff }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createCoachStyles(colors), [colors]);
  const p = staff.profile;
  return (
    <>
      <View style={[styles.block, shadows.card]}>
        <Text style={styles.blockTitle}>À propos</Text>
        <Text style={styles.bodyText}>
          {p.bio ??
            'Coach passionné avec une expérience en formation de jeunes talents et préparation physique.'}
        </Text>
      </View>
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
      <TabDiplomes staff={staff} />
    </>
  );
};

const TabExperience: React.FC<{ staff: User }> = ({ staff }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createCoachStyles(colors), [colors]);
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
          </View>
        </View>
      ))}
    </View>
  );
};

const TabDiplomes: React.FC<{ staff: User }> = ({ staff }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createCoachStyles(colors), [colors]);
  const items = staff.profile.diplomas_list ?? [
    {
      id: 'd1',
      name: 'Brevet d\'Entraîneur de Football',
      institution: 'FFF · 2019',
      verified: staff.is_verified,
    },
    {
      id: 'd2',
      name: 'UEFA A Licence',
      institution: 'UEFA · 2022',
      verified: staff.is_verified,
    },
  ];
  return (
    <View style={[styles.block, shadows.card]}>
      <Text style={styles.blockTitle}>Diplômes</Text>
      {items.map((d) => (
        <View key={d.id} style={styles.diplomaRow}>
          <View style={styles.diplomaIcon}>
            <Icon name="school" size={20} color={colors.brand} />
          </View>
          <View style={styles.diplomaInfo}>
            <Text style={styles.diplomaName}>{d.name}</Text>
            <Text style={styles.diplomaInst}>{d.institution}</Text>
          </View>
          {d.verified ? (
            <View style={styles.diplomaVerified}>
              <Text style={styles.diplomaVerifiedText}>Vérifié</Text>
            </View>
          ) : (
            <View style={styles.diplomaPending}>
              <Text style={styles.diplomaPendingText}>À vérifier</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const TabAvis: React.FC<{ staff: User }> = ({ staff }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createCoachStyles(colors), [colors]);
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
        </View>
      )}
      {items.map((r) => (
        <View key={r.id} style={[styles.block, shadows.card]}>
          <Text style={styles.reviewAuthor}>{r.author_name}</Text>
          <StarRating rating={r.rating} size="sm" />
          <Text style={styles.bodyText}>{r.comment}</Text>
        </View>
      ))}
    </>
  );
};

function createCoachStyles(c: AppColors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  hero: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: c.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: c.brand,
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: c.brand },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: '800', color: c.text },
  jobTitle: { color: c.brand, fontSize: 15, fontWeight: '600', marginTop: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { color: c.textSecondary, fontSize: 14 },
  verifiedPill: {
    marginTop: spacing.md,
    backgroundColor: c.successBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  verifiedText: { color: c.success, fontWeight: '700', fontSize: 12 },
  ratingWrap: { marginTop: spacing.sm },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: c.brand },
  tabText: { color: c.textMuted, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: c.brand, fontWeight: '700' },
  tabContent: { padding: spacing.lg, paddingBottom: 100 },
  block: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  blockTitle: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: spacing.md },
  bodyText: { color: c.textSecondary, lineHeight: 22, fontSize: 15 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    backgroundColor: c.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagText: { color: c.brand, fontSize: 12, fontWeight: '600' },
  timelineItem: { flexDirection: 'row', paddingVertical: spacing.md },
  timelineBorder: { borderTopWidth: 1, borderTopColor: c.border },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.brand,
    marginTop: 6,
    marginRight: spacing.md,
  },
  timelineBody: { flex: 1 },
  expTitle: { fontWeight: '700', color: c.text, fontSize: 15 },
  expOrg: { color: c.brand, marginTop: 2, fontSize: 14 },
  expPeriod: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  diplomaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  diplomaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  diplomaInfo: { flex: 1 },
  diplomaName: { fontWeight: '700', color: c.text, fontSize: 14 },
  diplomaInst: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  diplomaVerified: {
    backgroundColor: c.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diplomaVerifiedText: { color: c.success, fontWeight: '700', fontSize: 11 },
  diplomaPending: {
    backgroundColor: c.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diplomaPendingText: { color: c.warning, fontSize: 11, fontWeight: '700' },
  reviewSummary: { alignItems: 'center' },
  reviewAvg: { fontSize: 36, fontWeight: '800', color: c.text },
  reviewAuthor: { fontWeight: '700', color: c.text, marginBottom: spacing.sm },
  empty: { color: c.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: c.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  btnOutlineText: { color: c.brand, fontWeight: '700' },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: c.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  btnPrimaryText: { color: c.brandInverse, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  btnDisabledPrimary: { backgroundColor: c.textMuted },
});
}

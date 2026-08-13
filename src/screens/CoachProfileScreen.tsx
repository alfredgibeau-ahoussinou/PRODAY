import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { User } from '../models/User';
import { canContactMinors } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { StarRating } from '../components/StarRating';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import { PressableSpring } from '../components/motion';
import {
  CoachActionRow,
  CoachEmptyState,
  CoachKpiRow,
  CoachSectionCard,
} from '../components/coach/coachPortalUi';
import { CoachPageFrame } from '../components/coach/CoachPageFrame';
import { COACH_SITE, getCoachPageIdentity } from '../content/coachPageIdentity';
import { spacing } from '../theme/designTokens';
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
  const { productLine } = useAppTheme();
  const { profile: myProfile } = useAuth();
  const useShellHeader =
    isSubScreenShellEnabled(myProfile, 'staff') && myProfile?.uid !== staff.uid;
  useSectionIntelligence('recrutement', myProfile ?? null, productLine, {
    staffMode: true,
  });
  const [tab, setTab] = useState<TabId>('profil');
  const p = staff.profile;
  const canContact = canContactMinors(staff);
  const roleLabel = staff.role === 'agent' ? 'Agent sportif' : 'Entraîneur principal';
  const verified = staff.is_verified && staff.verification_status === 'VERIFIED';
  const profileTitle = staff.role === 'agent' ? 'Profil agent' : 'Profil coach';
  const identity = getCoachPageIdentity('profil');
  const title = p.job_title?.trim() || roleLabel;
  const experiences = p.experiences ?? [];
  const diplomas = p.diplomas_list ?? [];
  const reviews = p.reviews ?? [];
  const initial = (staff.display_name?.trim()?.charAt(0) || 'C').toUpperCase();

  const scrollBody = (
    <CoachPageFrame identity={identity} showHero={false}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <ProDayText variant="caption" style={styles.kicker}>
                {profileTitle}
              </ProDayText>
              {verified ? (
                <View style={styles.verifiedPill}>
                  <Icon name="checkmark-circle" size={12} color={COACH_SITE.accent} />
                  <ProDayText variant="caption" style={styles.verifiedText}>
                    Vérifié
                  </ProDayText>
                </View>
              ) : null}
            </View>
            <View style={styles.avatar}>
              <ProDayText variant="title" style={styles.avatarLetter}>
                {initial}
              </ProDayText>
            </View>
            <ProDayText variant="title" style={styles.name}>
              {staff.display_name}
            </ProDayText>
            <ProDayText variant="caption" style={styles.job}>
              {title}
            </ProDayText>
            <ProDayText variant="caption" style={styles.meta}>
              {staff.city ?? 'France'}
              {staff.department ? ` (${staff.department})` : ''}
            </ProDayText>
            {p.rating != null ? (
              <View style={styles.ratingWrap}>
                <StarRating rating={p.rating} />
              </View>
            ) : null}
          </View>

          <CoachKpiRow
            items={[
              { label: 'Exp.', value: String(experiences.length) },
              { label: 'Diplômes', value: String(diplomas.length || (p.diploma ? 1 : 0)) },
              { label: 'Avis', value: String(reviews.length) },
              {
                label: 'Note',
                value: p.rating != null ? p.rating.toFixed(1) : '—',
                tone: p.rating != null ? COACH_SITE.accent : undefined,
              },
            ]}
          />

          <View style={styles.tabBar}>
            {TABS.map((item) => {
              const on = tab === item.id;
              return (
                <PressableSpring
                  key={item.id}
                  onPress={() => setTab(item.id)}
                  scaleTo={0.97}
                  style={[styles.tab, on && styles.tabOn]}
                >
                  <ProDayText
                    variant="caption"
                    style={[styles.tabText, on && styles.tabTextOn]}
                  >
                    {item.label}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          {tab === 'profil' ? (
            <CoachSectionCard kicker="À propos" title={title}>
              <ProDayText variant="body" style={styles.body}>
                {p.bio?.trim() ||
                  'Coach passionné, formation et préparation physique.'}
              </ProDayText>
              {p.specialties?.length ? (
                <View style={styles.tags}>
                  {p.specialties.map((s) => (
                    <View key={s} style={styles.tag}>
                      <ProDayText variant="caption" style={styles.tagText}>
                        {s}
                      </ProDayText>
                    </View>
                  ))}
                </View>
              ) : null}
              {p.diploma ? (
                <ProDayText variant="caption" style={styles.diplomaLine}>
                  Diplôme · {p.diploma}
                </ProDayText>
              ) : null}
            </CoachSectionCard>
          ) : null}

          {tab === 'experience' ? (
            experiences.length ? (
              <CoachSectionCard kicker="Parcours" title="Expérience">
                {experiences.map((exp, i) => (
                  <View
                    key={exp.id}
                    style={[styles.timelineRow, i > 0 && styles.timelineBorder]}
                  >
                    <View style={styles.dot} />
                    <View style={styles.timelineBody}>
                      <ProDayText variant="section" style={styles.expTitle}>
                        {exp.title}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.expOrg}>
                        {exp.organization}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.expPeriod}>
                        {exp.period}
                      </ProDayText>
                    </View>
                  </View>
                ))}
              </CoachSectionCard>
            ) : (
              <CoachEmptyState
                title="Aucune expérience"
                body="Ce coach n’a pas encore renseigné son parcours."
              />
            )
          ) : null}

          {tab === 'diplomes' ? (
            diplomas.length || p.diploma ? (
              <CoachSectionCard kicker="Certifications" title="Diplômes">
                {(diplomas.length
                  ? diplomas
                  : [
                      {
                        id: 'diploma',
                        name: p.diploma!,
                        institution: 'Renseigné',
                        verified: verified,
                      },
                    ]
                ).map((d) => (
                  <View key={d.id} style={styles.diplomaRow}>
                    <View style={styles.diplomaIcon}>
                      <Icon name="school" size={16} color={COACH_SITE.accent} />
                    </View>
                    <View style={styles.diplomaInfo}>
                      <ProDayText variant="section" style={styles.diplomaName}>
                        {d.name}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.diplomaInst}>
                        {d.institution}
                      </ProDayText>
                    </View>
                    <ProDayText
                      variant="caption"
                      style={d.verified ? styles.badgeOk : styles.badgePending}
                    >
                      {d.verified ? 'Vérifié' : 'À vérifier'}
                    </ProDayText>
                  </View>
                ))}
              </CoachSectionCard>
            ) : (
              <CoachEmptyState
                title="Aucun diplôme"
                body="Pas encore de certification publiée."
              />
            )
          ) : null}

          {tab === 'avis' ? (
            reviews.length ? (
              <CoachSectionCard kicker="Retours" title="Avis">
                {p.rating != null ? (
                  <View style={styles.reviewSummary}>
                    <ProDayText variant="title" style={styles.reviewAvg}>
                      {p.rating.toFixed(1)}
                    </ProDayText>
                    <StarRating rating={p.rating} />
                  </View>
                ) : null}
                {reviews.map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <ProDayText variant="section" style={styles.reviewAuthor}>
                      {r.author_name}
                    </ProDayText>
                    <StarRating rating={r.rating} size="sm" />
                    <ProDayText variant="body" style={styles.body}>
                      {r.comment}
                    </ProDayText>
                  </View>
                ))}
              </CoachSectionCard>
            ) : (
              <CoachEmptyState title="Pas encore d’avis" body="Les retours apparaîtront ici." />
            )
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <CoachActionRow
            primary="Engager"
            onPrimary={() => canContact && onHire?.(staff)}
            secondary="Contacter"
            onSecondary={() => canContact && onContact?.(staff)}
          />
          {!canContact ? (
            <ProDayText variant="caption" style={styles.footerHint}>
              Contact limité pour ce profil.
            </ProDayText>
          ) : null}
        </View>
      </View>
    </CoachPageFrame>
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
        {scrollBody}
      </TabScreenShell>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={profileTitle} onBack={onBack} onMenu={() => {}} centered />
      {scrollBody}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COACH_SITE.bg },
  root: { flex: 1, minHeight: 0 },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  hero: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    borderLeftWidth: 2,
    borderLeftColor: COACH_SITE.accent,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  kicker: {
    color: COACH_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    fontSize: 10,
    fontWeight: '800',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COACH_SITE.accent}88`,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    color: COACH_SITE.accent,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.soft,
    borderWidth: 1,
    borderColor: `${COACH_SITE.accent}99`,
  },
  avatarLetter: { color: COACH_SITE.foreground, fontWeight: '800' },
  name: {
    color: COACH_SITE.foreground,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 26,
    marginTop: spacing.sm,
  },
  job: { color: COACH_SITE.accent, fontWeight: '700' },
  meta: { color: COACH_SITE.muted },
  ratingWrap: { marginTop: spacing.xs },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tabOn: {
    borderColor: COACH_SITE.accent,
    backgroundColor: COACH_SITE.soft,
  },
  tabText: {
    color: COACH_SITE.muted,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  tabTextOn: { color: COACH_SITE.foreground },
  body: { color: COACH_SITE.muted, lineHeight: 20, marginTop: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  tag: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COACH_SITE.accent}66`,
    backgroundColor: COACH_SITE.soft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { color: COACH_SITE.foreground, fontWeight: '700', fontSize: 11 },
  diplomaLine: { color: COACH_SITE.accent, marginTop: spacing.sm, fontWeight: '700' },
  timelineRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  timelineBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COACH_SITE.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COACH_SITE.accent,
    marginTop: 6,
  },
  timelineBody: { flex: 1, gap: 2 },
  expTitle: { color: COACH_SITE.foreground, fontWeight: '800' },
  expOrg: { color: COACH_SITE.accent, fontWeight: '700' },
  expPeriod: { color: COACH_SITE.muted },
  diplomaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  diplomaIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
  },
  diplomaInfo: { flex: 1, gap: 2 },
  diplomaName: { color: COACH_SITE.foreground, fontWeight: '800' },
  diplomaInst: { color: COACH_SITE.muted },
  badgeOk: { color: COACH_SITE.accent, fontWeight: '800', fontSize: 10 },
  badgePending: { color: COACH_SITE.muted, fontWeight: '700', fontSize: 10 },
  reviewSummary: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  reviewAvg: { color: COACH_SITE.foreground, fontWeight: '800', fontSize: 36 },
  reviewCard: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COACH_SITE.border,
  },
  reviewAuthor: { color: COACH_SITE.foreground, fontWeight: '800' },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COACH_SITE.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: COACH_SITE.bg,
  },
  footerHint: { color: COACH_SITE.muted, marginTop: spacing.xs },
});

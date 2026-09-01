import React, { useState, useMemo } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  ScrollView,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useProductLine } from '../../context/ProductLineContext';
import { useAuth } from '../../context/AuthContext';
import { useLaunchIntro } from '../../context/LaunchIntroContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { PressableSpring, PushScreenTransition, StaggerReveal } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySymbol } from '../../components/branding/ProDaySymbol';
import { Icon } from '../../components/ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { ProfileMenuSection, type ProfileMenuItem } from '../../components/profile/ProfileMenuSection';
import { EditProfileScreen } from '../EditProfileScreen';
import { LegalDocumentScreen } from '../LegalDocumentScreen';
import type { LegalDocumentId } from '../../content/legalDocuments';
import { ReferralScreen } from '../ReferralScreen';
import { LanguageSettingControl } from '../../components/settings/LanguageSettingControl';

export const SupporterProfileScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const { parentGuestSupporter, returnParentFromSupporterGuest } = useProductLine();
  const { openSpacePicker } = useLaunchIntro();
  const { setActiveTab } = useTabNavigation();

  const [showEdit, setShowEdit] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);
  const [showReferral, setShowReferral] = useState(false);

  const showReturn = profile?.role === 'parent' && parentGuestSupporter;
  const initial = (profile?.display_name?.trim()?.charAt(0) || 'S').toUpperCase();
  const displayName = profile?.display_name?.trim() || 'Supporter ProDay';
  const email = profile?.email || 'Non renseigné';
  const city = profile?.city || 'France';

  const supporterActions: ProfileMenuItem[] = useMemo(
    () => [
      {
        icon: 'person',
        title: 'Modifier mon profil',
        subtitle: 'Nom, ville, photo de profil',
        onPress: () => setShowEdit(true),
      },
      {
        icon: 'football',
        title: 'Mes clubs favoris',
        subtitle: 'Suivez vos équipes de cœur',
        onPress: () => setActiveTab('plus'),
      },
      {
        icon: 'trophy',
        title: 'Compétitions favorites',
        subtitle: 'Classements et alertes de matchs',
        onPress: () => setActiveTab('feed'),
      },
      {
        icon: 'people',
        title: 'Parrainage Supporter',
        subtitle: 'Invitez vos proches sur ProDay',
        onPress: () => setShowReferral(true),
      },
    ],
    [setActiveTab],
  );

  const securityActions: ProfileMenuItem[] = useMemo(
    () => [
      {
        icon: 'document',
        title: 'Conditions d’utilisation',
        onPress: () => setLegalDocument('terms'),
      },
      {
        icon: 'shield',
        title: 'Politique de confidentialité',
        onPress: () => setLegalDocument('privacy'),
      },
      {
        icon: 'share',
        title: 'Partager ProDay',
        subtitle: 'Faites découvrir l’application à votre club',
        onPress: () => {
          void Share.share({
            message: 'Rejoins-moi sur ProDay, l’application officielle du football amateur et pro ! https://proday.app',
          });
        },
      },
    ],
    [],
  );

  const handleSignOut = () => {
    Alert.alert('Se déconnecter', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  };

  if (showEdit && profile) {
    return (
      <PushScreenTransition active>
        <EditProfileScreen
          user={profile}
          onBack={() => setShowEdit(false)}
          onSaved={() => setShowEdit(false)}
        />
      </PushScreenTransition>
    );
  }

  if (legalDocument) {
    return (
      <PushScreenTransition active>
        <LegalDocumentScreen documentId={legalDocument} onBack={() => setLegalDocument(null)} />
      </PushScreenTransition>
    );
  }

  if (showReferral) {
    return (
      <PushScreenTransition active>
        <ReferralScreen onBack={() => setShowReferral(false)} />
      </PushScreenTransition>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Carte Supporter */}
        <StaggerReveal index={0}>
          <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.headerTop}>
              <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                <ProDayText variant="section" style={[styles.avatarText, { color: colors.accent }]}>
                  {initial}
                </ProDayText>
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.badgeRow}>
                  <View style={[styles.supporterBadge, { backgroundColor: colors.accentSoft, borderColor: colors.borderMedium }]}>
                    <Icon name="heart" size={12} color={colors.accent} />
                    <ProDayText variant="caption" style={[styles.badgeText, { color: colors.accent }]}>
                      12E HOMME
                    </ProDayText>
                  </View>
                </View>
                <ProDayText variant="title" style={styles.name} numberOfLines={1}>
                  {displayName}
                </ProDayText>
                <ProDayText variant="caption" muted numberOfLines={1}>
                  {email} · {city}
                </ProDayText>
              </View>
            </View>

            {/* Quick KPIs Supporter */}
            <View style={[styles.statsRow, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <View style={styles.statCol}>
                <ProDayText variant="section" style={[styles.statNum, { color: colors.accent }]}>
                  {profile?.profile.club_id ? '1' : '0'}
                </ProDayText>
                <ProDayText variant="caption" muted style={styles.statLabel}>
                  Club favori
                </ProDayText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statCol}>
                <ProDayText variant="section" style={[styles.statNum, { color: colors.tone4 }]}>
                  Actif
                </ProDayText>
                <ProDayText variant="caption" muted style={styles.statLabel}>
                  Statut Fan
                </ProDayText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statCol}>
                <ProDayText variant="section" style={[styles.statNum, { color: colors.bookmark }]}>
                  Gratuit
                </ProDayText>
                <ProDayText variant="caption" muted style={styles.statLabel}>
                  Accès Libre
                </ProDayText>
              </View>
            </View>
          </View>
        </StaggerReveal>

        {/* Section Actions Fan */}
        <StaggerReveal index={1}>
          <ProfileMenuSection title="EXPÉRIENCE SUPPORTER" items={supporterActions} colors={colors} />
        </StaggerReveal>

        {/* Section Langue & Préférences */}
        <StaggerReveal index={2}>
          <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ProDayText variant="eyebrow" muted style={styles.sectionHeaderTitle}>
              PRÉFÉRENCES D’AFFICHAGE
            </ProDayText>
            <LanguageSettingControl variant="card" />
          </View>
        </StaggerReveal>

        {/* Section Sécurité & Légal */}
        <StaggerReveal index={3}>
          <ProfileMenuSection title="INFORMATIONS & SÉCURITÉ" items={securityActions} colors={colors} />
        </StaggerReveal>

        {/* Passerelle Parent si visiteur */}
        {showReturn ? (
          <StaggerReveal index={4}>
            <PressableSpring
              onPress={() => {
                void returnParentFromSupporterGuest().catch((e) =>
                  Alert.alert('Retour impossible', e instanceof Error ? e.message : 'Réessayez plus tard.'),
                );
              }}
              scaleTo={0.97}
              haptic
              style={[styles.returnCta, { backgroundColor: colors.accent }]}
            >
              <Icon name="people" size={18} color="#FFFFFF" />
              <ProDayText variant="caption" style={styles.returnCtaText}>
                Retourner à l’Espace Parent
              </ProDayText>
            </PressableSpring>
          </StaggerReveal>
        ) : null}

        {/* Changer d'Univers & Déconnexion */}
        <StaggerReveal index={5}>
          <View style={styles.footerActions}>
            <PressableSpring
              onPress={openSpacePicker}
              scaleTo={0.97}
              haptic
              style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <ProDaySymbol size={18} tone="white" />
              <ProDayText variant="caption" style={styles.actionBtnText}>
                Changer d’univers
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={handleSignOut}
              scaleTo={0.97}
              haptic
              style={[styles.actionBtn, styles.signOutBtn]}
            >
              <Icon name="log-out" size={18} color="#EF4444" />
              <ProDayText variant="caption" style={styles.signOutBtnText}>
                Se déconnecter
              </ProDayText>
            </PressableSpring>
          </View>
        </StaggerReveal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  headerCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  supporterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 20,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 16,
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionContainer: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  sectionHeaderTitle: {
    letterSpacing: 0.8,
  },
  returnCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  returnCtaText: {
    color: '#FFFFFF',
  },
  footerActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 48,
  },
  actionBtnText: {
    color: '#FAFAFA',
  },
  signOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutBtnText: {
    color: '#EF4444',
  },
});


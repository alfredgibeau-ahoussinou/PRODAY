import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { Icon } from '../../components/ui/Icon';
import { SponsorScreenHeader } from '../../components/sponsor/SponsorScreenHeader';
import { ProfileMenuSection, type ProfileMenuItem } from '../../components/profile/ProfileMenuSection';
import { ProfileSubscriptionCard } from '../../components/profile/ProfileSubscriptionCard';
import { EditProfileScreen } from '../EditProfileScreen';
import { LegalDocumentScreen } from '../LegalDocumentScreen';
import type { LegalDocumentId } from '../../content/legalDocuments';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useSponsorShellOptional, sponsorTabRoute } from '../../context/SponsorShellContext';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { getSponsorAppColors, SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';
import { useSponsorDashboard } from '../../hooks/useSponsorDashboard';
import { SponsorAnalyticsPanel } from '../../components/sponsor/SponsorAnalyticsPanel';
import { PushScreenTransition } from '../../components/motion';
import { SponsorGuestGate } from '../../components/sponsor/SponsorGuestGate';

export const SponsorProfileTabScreen: React.FC<{ shellMode?: boolean }> = ({
  shellMode = false,
}) => {
  const { refreshProfile, signOut } = useAuth();
  const profile = useSessionProfile();
  const sponsorColors = getSponsorAppColors();
  const nav = useTabNavigationActions();
  const sponsorShell = useSponsorShellOptional();
  const bottomInset = shellMode ? SPONSOR_NAV_INSET : TAB_BAR_CONTENT_INSET;
  const subscriptionCtx = useSubscriptionOptional();
  const company = profile?.profile.job_title ?? profile?.display_name;
  const { analytics, stats } = useSponsorDashboard(profile?.uid, company);
  const [showEdit, setShowEdit] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);

  if (!profile) {
    return <SponsorGuestGate message="Connectez-vous pour gérer votre marque, formules et réglages." />;
  }

  const zone = [profile.city, profile.department].filter(Boolean).join(' · ');

  const goTo = (tab: 'offres' | 'reseau' | 'pilotage') => {
    if (sponsorShell) {
      sponsorShell.navigate(
        tab === 'reseau' ? sponsorTabRoute('reseau', 'messages') : sponsorTabRoute(tab),
      );
      return;
    }
    if (tab === 'offres') nav.setActiveTab('matchs');
    else if (tab === 'reseau') nav.setActiveTab('messages');
    else nav.setActiveTab('home');
  };

  const brandItems: ProfileMenuItem[] = [
    {
      title: 'Modifier la marque',
      subtitle: 'Nom, ville, présentation',
      icon: 'business',
      onPress: () => setShowEdit(true),
    },
    {
      title: 'Mes campagnes',
      subtitle: 'Offres et financements clubs',
      icon: 'briefcase',
      onPress: () => goTo('offres'),
    },
    {
      title: 'Réseau sponsors',
      subtitle: `${stats.leads} contacts · prospects locaux`,
      icon: 'chat',
      onPress: () => goTo('reseau'),
    },
    {
      title: 'Performance marque',
      subtitle: `${stats.impressions} impressions ce mois`,
      icon: 'search',
      onPress: () => goTo('pilotage'),
    },
  ];

  const accountItems: ProfileMenuItem[] = [
    { title: 'Conditions générales', icon: 'document', onPress: () => setLegalDocument('terms') },
    { title: 'Confidentialité', icon: 'lock', onPress: () => setLegalDocument('privacy') },
  ];

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Quitter votre session sponsor ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + spacing.xl }]}
      >
      {!shellMode ? (
        <SponsorScreenHeader
          title="Ma marque"
          subtitle="Identité publique, zone d’intervention et abonnement sponsor."
        />
      ) : null}

      <View style={styles.identityCard}>
        <View style={styles.identityRow}>
          <View style={styles.identityIcon}>
            <Icon name="briefcase" size={22} color={SPONSOR_THEME.primary} variant="filled" />
          </View>
          <View style={styles.identityBody}>
            <Text style={styles.identityName}>{company}</Text>
            {zone ? <Text style={styles.identityZone}>{zone}</Text> : null}
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Compte sponsor vérifié</Text>
            </View>
          </View>
        </View>
        {profile.profile.bio ? <Text style={styles.bio}>{profile.profile.bio}</Text> : null}
      </View>

      {analytics ? <SponsorAnalyticsPanel analytics={analytics} /> : null}

      {subscriptionCtx ? (
        <ProfileSubscriptionCard
          profile={profile}
          tier={subscriptionCtx.subscription?.tier ?? 'free'}
          usage={subscriptionCtx.usage}
          onPress={() => subscriptionCtx.openPlansScreen()}
        />
      ) : null}

      <ProfileMenuSection title="Marque" items={brandItems} colors={sponsorColors} />
      <ProfileMenuSection title="Compte" items={accountItems} colors={sponsorColors} />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
      </ScrollView>
      <PushScreenTransition active={showEdit || legalDocument != null}>
        {showEdit ? (
          <EditProfileScreen
            user={profile}
            onBack={() => setShowEdit(false)}
            onSaved={async () => {
              await refreshProfile();
              setShowEdit(false);
            }}
          />
        ) : legalDocument ? (
          <LegalDocumentScreen documentId={legalDocument} onBack={() => setLegalDocument(null)} />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: { padding: spacing.lg },
  guest: { textAlign: 'center', color: SPONSOR_THEME.textMuted, padding: spacing.xl },
  identityCard: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.lg,
  },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  identityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SPONSOR_THEME.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityBody: { flex: 1 },
  identityName: { fontSize: 18, fontWeight: '900', color: SPONSOR_THEME.text },
  identityZone: { fontSize: 13, color: SPONSOR_THEME.textSecondary, marginTop: 4 },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: SPONSOR_THEME.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: SPONSOR_THEME.heroSubtext,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bio: {
    fontSize: 13,
    color: SPONSOR_THEME.textSecondary,
    marginTop: spacing.md,
    lineHeight: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SPONSOR_THEME.borderSubtle,
    paddingTop: spacing.md,
  },
  logoutBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    alignItems: 'center',
    backgroundColor: SPONSOR_THEME.surface,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
});

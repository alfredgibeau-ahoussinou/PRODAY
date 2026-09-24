import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ShellAccountSection } from '../../../components/shell/ShellAccountSection';
import { useAccountDeletion } from '../../../hooks/useAccountDeletion';
import { GlobalSearchBar } from '../../../components/search/GlobalSearchBar';
import { GlobalSearchModal } from '../../../components/search/GlobalSearchModal';
import { CrestWatermark } from '../../../screens/joueur/PlayerSaisonIcons';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useCoachTheme } from './CoachThemeContext';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { useCoachShellNav } from './CoachShellNavContext';
import { LegalDocumentModal } from '../../../components/legal/LegalDocumentModal';
import { UnifiedSettingsModal } from '../../../components/settings/UnifiedSettingsModal';
import { TAB_BAR_CONTENT_INSET } from '../../../navigation/tabBarLayout';
import { spacing } from '../../../theme/designTokens';
import { coachChrome } from '../theme/coachDesignSystem';
import type { CoachNavItemId } from '../navigation/coachNavConfig';
import { COACH_SITE } from '../../../content/coachPageIdentity';

type Props = {
  /** Liste d’outils résolus (deep link Menu / plus). */
  items?: CoachNavResolvedItem[];
};

type CoachMenuItemDef = {
  id: CoachNavItemId;
  label: string;
  subtitle: string;
  icon: IconName;
  aiBadge?: boolean;
};

export const COACH_MENU_ITEMS: CoachMenuItemDef[] = [
  {
    id: 'match_center',
    label: 'Matchs & Live',
    subtitle: 'Direct, convocs & scores',
    icon: 'trophy',
  },
  {
    id: 'entrainements',
    label: 'Entraînements',
    subtitle: 'Séances, exercices & présences',
    icon: 'calendar',
  },
  {
    id: 'joueurs',
    label: 'Effectif & Joueurs',
    subtitle: 'Fiches, forme & stats',
    icon: 'people',
  },
  {
    id: 'coach_ia',
    label: 'Assistant Coach IA',
    subtitle: 'Conseils & causeries match',
    icon: 'star-four-points',
    aiBadge: true,
  },
  {
    id: 'copilot_chat',
    label: 'Chat Copilote IA',
    subtitle: 'Conversation, historique & reprise',
    icon: 'chat',
    aiBadge: true,
  },
  {
    id: 'mes_videos',
    label: 'Mes Vidéos',
    subtitle: 'Captations, clips & IA',
    icon: 'videocam',
    aiBadge: true,
  },
  {
    id: 'forme',
    label: 'Forme & Charge',
    subtitle: 'Suivi physique & alertes',
    icon: 'heart',
  },
  {
    id: 'gestion',
    label: 'Gestion Équipe',
    subtitle: 'Licences & organisation',
    icon: 'settings',
  },
  {
    id: 'com_staff',
    label: 'Messagerie',
    subtitle: 'DM · groupes staff · parents',
    icon: 'chat',
  },
  {
    id: 'rsvp_log',
    label: 'Historique des relances',
    subtitle: 'Relances envoyées aux joueurs',
    icon: 'notifications',
  },
  {
    id: 'carpool',
    label: 'Covoiturage',
    subtitle: 'Trajets & véhicules match',
    icon: 'car',
  },
  {
    id: 'coaching_perso',
    label: 'Coaching Perso',
    subtitle: 'Créneaux & tarifs à l’heure',
    icon: 'time',
  },
];

/** Hub Menu Coach — menu complet Tout ProDay comme le pôle joueur */
export function CoachMenuPane({ items = [] }: Props) {
  const shellNav = useCoachShellNav();
  const profile = useSessionProfile();
  const { tokens } = useCoachTheme();
  const { confirmDeleteAccount } = useAccountDeletion();
  const { width } = useWindowDimensions();
  const wide = width >= coachChrome.wideBreakpoint;
  const isNarrow = width < 380;
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalModalDoc, setLegalModalDoc] = useState<'terms' | 'privacy' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const resolvedById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );

  const clubName = profile?.display_name ? `Coach ${profile.display_name}` : 'Coach ProDay';
  const teamAccent = tokens.accent;

  const menuList = useMemo(() => {
    return COACH_MENU_ITEMS.map((entry) => {
      const resolved = resolvedById.get(entry.id);
      return {
        ...entry,
        locked: resolved?.locked ?? false,
        lockReason: resolved?.lockReason,
        aiBadge: entry.aiBadge || resolved?.aiBadge,
      };
    });
  }, [resolvedById]);

  const handleSelect = (id: CoachNavItemId, locked?: boolean) => {
    if (locked) return;
    shellNav?.requestNav(id);
  };

  return (
    <View style={styles.root}>
      {/* 1. Header ProDay Stylisé */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View
            style={[
              styles.clubCrest,
              { borderColor: `${teamAccent}40`, backgroundColor: `${teamAccent}18` },
            ]}
          >
            <CrestWatermark width={22} height={26} color={teamAccent} opacity={0.95} />
          </View>
          <View style={styles.titleCol}>
            <ProDayText variant="title" style={styles.headerTitleText}>
              Tout ProDay
            </ProDayText>
            {clubName ? (
              <View style={styles.clubSubtitleRow}>
                <View style={[styles.clubDot, { backgroundColor: teamAccent }]} />
                <ProDayText
                  variant="caption"
                  style={[styles.clubSubtitleText, { color: `${teamAccent}D0` }]}
                >
                  {clubName}
                </ProDayText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.pad, { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <ProDayText variant="caption" style={styles.lead}>
          Retrouve matchs, entraînements, effectif, tactique IA, vidéos et messagerie sans chercher dans l’accueil.
        </ProDayText>

        <GlobalSearchBar
          onPress={() => setSearchOpen(true)}
          accent={teamAccent}
          style={styles.searchBarWrap}
        />

        {/* 2. Grille de Cartes Premium 2 Colonnes ou Lignes Réactives Étroites */}
        <View style={styles.grid}>
          {menuList.map((item) => (
            <PressableSpring
              key={item.id}
              style={[
                styles.tile,
                isNarrow ? styles.tileNarrow : { width: '48.5%' },
                item.locked && styles.tileLocked,
              ]}
              onPress={() => handleSelect(item.id, item.locked)}
              scaleTo={0.97}
              haptic={!item.locked}
              testID={`coach-menu-${item.id}`}
            >
              {isNarrow ? (
                <>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: `${teamAccent}14`,
                        borderColor: `${teamAccent}33`,
                      },
                    ]}
                  >
                    <Icon
                      name={item.icon}
                      size={22}
                      color={item.locked ? tokens.muted : teamAccent}
                      variant="outline"
                    />
                  </View>
                  <View style={styles.tileCopyNarrow}>
                    <ProDayText variant="section" style={styles.tileLabel}>
                      {item.label}
                    </ProDayText>
                    {item.subtitle ? (
                      <ProDayText variant="caption" style={styles.tileSub}>
                        {item.subtitle}
                      </ProDayText>
                    ) : null}
                  </View>
                  {item.aiBadge ? (
                    <View style={[styles.aiBadge, { backgroundColor: `${teamAccent}26` }]}>
                      <ProDayText variant="caption" style={[styles.aiBadgeText, { color: teamAccent }]}>
                        IA
                      </ProDayText>
                    </View>
                  ) : item.locked ? (
                    <View style={styles.lockedBadge}>
                      <Icon name="lock" size={12} color={tokens.muted} />
                    </View>
                  ) : (
                    <Icon name="chevron-forward" size={16} color={tokens.muted} />
                  )}
                </>
              ) : (
                <>
                  <View style={styles.tileTop}>
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: `${teamAccent}14`,
                          borderColor: `${teamAccent}33`,
                        },
                      ]}
                    >
                      <Icon
                        name={item.icon}
                        size={24}
                        color={item.locked ? tokens.muted : teamAccent}
                        variant="outline"
                      />
                    </View>

                    {item.aiBadge ? (
                      <View style={[styles.aiBadge, { backgroundColor: `${teamAccent}26` }]}>
                        <ProDayText variant="caption" style={[styles.aiBadgeText, { color: teamAccent }]}>
                          IA
                        </ProDayText>
                      </View>
                    ) : item.locked ? (
                      <View style={styles.lockedBadge}>
                        <Icon name="lock" size={12} color={tokens.muted} />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.tileBottom}>
                    <ProDayText variant="section" style={styles.tileLabel}>
                      {item.label}
                    </ProDayText>
                    {item.subtitle ? (
                      <ProDayText variant="caption" style={styles.tileSub}>
                        {item.subtitle}
                      </ProDayText>
                    ) : null}
                  </View>
                </>
              )}
            </PressableSpring>
          ))}
        </View>

        {/* 3. Section Compte & Déconnexion */}
        <ShellAccountSection
          tone={{
            foreground: tokens.foreground,
            muted: tokens.muted,
            faint: tokens.muted,
            surface: COACH_SITE.surface,
            border: COACH_SITE.elevated,
            destructive: '#DC2626',
            iconBg: `${teamAccent}15`,
          }}
          links={[
            {
              key: 'profil',
              label: 'Profil Coach',
              hint: 'Vitrine, diplômes et paramètres',
              icon: 'person',
              onPress: () => shellNav?.requestNav('profil'),
            },
            {
              key: 'settings',
              label: 'Paramètres & Liquid Glass',
              hint: 'Apparence, notifications et tactique',
              icon: 'settings',
              onPress: () => setSettingsOpen(true),
            },
            {
              key: 'cgu',
              label: 'Conditions Générales (CGU)',
              hint: 'Règles d’utilisation du service',
              icon: 'document-text',
              onPress: () => setLegalModalDoc('terms'),
            },
            {
              key: 'privacy',
              label: 'Politique de Confidentialité',
              hint: 'Données personnelles & RGPD',
              icon: 'shield',
              onPress: () => setLegalModalDoc('privacy'),
            },
          ]}
          onSignOut={shellNav?.signOut}
          onDeleteAccount={confirmDeleteAccount}
          safeBottom={!wide}
        />
      </ScrollView>

      <GlobalSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        accent={teamAccent}
      />

      <LegalDocumentModal
        visible={legalModalDoc !== null}
        documentId={legalModalDoc}
        onClose={() => setLegalModalDoc(null)}
      />

      <UnifiedSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userRole="coach"
        user={profile}
        onSignOut={shellNav?.signOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubCrest: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  clubSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  clubDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  clubSubtitleText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  scroll: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  lead: {
    color: '#8B8B9A',
    fontSize: 12.5,
    lineHeight: 18,
  },
  searchBarWrap: {
    marginTop: 2,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  tile: {
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COACH_SITE.elevated,
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: COACH_SITE.surface,
  },
  tileNarrow: {
    width: '100%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tileCopyNarrow: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tileLocked: {
    opacity: 0.5,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tileBottom: {
    gap: 2,
    marginTop: 8,
  },
  tileLabel: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  tileSub: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
  },
  aiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  lockedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});


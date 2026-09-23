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
import { useClubTheme } from './ClubThemeContext';
import { useClubShellNav } from './ClubShellNavContext';
import { LegalDocumentModal } from '../../../components/legal/LegalDocumentModal';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { CLUB_TOOL_GROUPS, type ClubNavItemId } from '../navigation/clubNavConfig';
import { ClubActionRow, ClubListGroup } from '../ui/clubUi';
import { TAB_BAR_CONTENT_INSET } from '../../../navigation/tabBarLayout';
import { spacing } from '../../../theme/designTokens';
import { clubChrome, clubForm, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  /** Liste d'outils résolus (deep link Menu / plus). */
  items?: ClubNavResolvedItem[];
};

export type ClubMenuItemDef = {
  id: ClubNavItemId;
  label: string;
  subtitle: string;
  icon: IconName;
  aiBadge?: boolean;
};

export const CLUB_MENU_ITEMS: ClubMenuItemDef[] = [
  {
    id: 'matches',
    label: 'Matchs & Live',
    subtitle: 'Direct, convocs & scores',
    icon: 'trophy',
  },
  {
    id: 'trainings',
    label: 'Entraînements',
    subtitle: 'Séances, exercices & présences',
    icon: 'calendar',
  },
  {
    id: 'teams',
    label: 'Équipes & Pôles',
    subtitle: 'U7 à Seniors, catégories',
    icon: 'football',
  },
  {
    id: 'players',
    label: 'Effectif & Licences',
    subtitle: 'Joueurs, fiches & affiliations',
    icon: 'people',
  },
  {
    id: 'coaches',
    label: 'Staff & Coachs',
    subtitle: 'Affectations & encadrement',
    icon: 'school',
  },
  {
    id: 'assistant',
    label: 'Copilote Club IA',
    subtitle: 'Briefings, requêtes & copilote',
    icon: 'star-four-points',
    aiBadge: true,
  },
  {
    id: 'communication',
    label: 'Communication',
    subtitle: 'Annonces, parents & groupes',
    icon: 'chat',
  },
  {
    id: 'calendar',
    label: 'Calendrier Général',
    subtitle: 'Agenda global & tournois',
    icon: 'calendar',
  },
  {
    id: 'finances',
    label: 'Finances & Cotisations',
    subtitle: 'Trésorerie, adhésions & suivi',
    icon: 'bag',
  },
  {
    id: 'sponsoring',
    label: 'Sponsoring & Partenaires',
    subtitle: 'Dossiers, mécénat & visibilité',
    icon: 'gift',
  },
  {
    id: 'licenses',
    label: 'Documents & Licences',
    subtitle: 'Bordereaux FFF, certificats',
    icon: 'document',
  },
  {
    id: 'events',
    label: 'Événements & Tournois',
    subtitle: 'Organisation, stages & rassemblements',
    icon: 'flag',
  },
  {
    id: 'standings',
    label: 'Classements FFF',
    subtitle: 'Votre championnat en priorité · toutes les divisions',
    icon: 'trophy',
  },
  {
    id: 'notifications',
    label: 'Centre de Notifications',
    subtitle: 'Alertes adhésions, convocations & staff',
    icon: 'notifications',
  },
  {
    id: 'permissions',
    label: 'Rôles & Permissions',
    subtitle: 'Droits d’accès staff & dirigeants',
    icon: 'shield',
  },
  {
    id: 'video',
    label: 'Vidéo & Analyse IA',
    subtitle: 'Veo, Smartphone, smart clipping & tags',
    icon: 'videocam',
  },
  {
    id: 'carpool',
    label: 'Covoiturage & Logistique',
    subtitle: 'Déplacements extérieurs, places & GPS',
    icon: 'car',
  },
  {
    id: 'club',
    label: 'Identité du club',
    subtitle: 'Couleurs, logo, saison & réglages',
    icon: 'business',
  },
  {
    id: 'pack',
    label: 'Pack Club & Options',
    subtitle: 'Formules, options & services',
    icon: 'shield',
  },
];

/**
 * Hub Menu Club — Tout ProDay unifié (même design system que Coach & Joueur)
 */
export function ClubMenuPane({ items = [] }: Props) {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const { confirmDeleteAccount } = useAccountDeletion();
  const { width } = useWindowDimensions();
  const wide = width >= clubChrome.wideBreakpoint;
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalModalDoc, setLegalModalDoc] = useState<'terms' | 'privacy' | null>(null);

  const resolvedById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );

  const clubName = profile?.display_name ? profile.display_name : 'Club ProDay';
  const clubAccent = tokens.accent;

  const menuList = useMemo(() => {
    return CLUB_MENU_ITEMS.map((entry) => {
      const resolved = resolvedById.get(entry.id);
      return {
        ...entry,
        locked: resolved?.locked ?? false,
        lockReason: resolved?.lockReason,
        aiBadge: entry.aiBadge || resolved?.aiBadge,
      };
    });
  }, [resolvedById]);

  const handleSelect = (id: ClubNavItemId, locked?: boolean) => {
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
              { borderColor: `${clubAccent}40`, backgroundColor: `${clubAccent}18` },
            ]}
          >
            <CrestWatermark width={22} height={26} color={clubAccent} opacity={0.95} />
          </View>
          <View style={styles.titleCol}>
            <ProDayText variant="title" style={styles.headerTitleText}>
              Tout ProDay
            </ProDayText>
            {clubName ? (
              <View style={styles.clubSubtitleRow}>
                <View style={[styles.clubDot, { backgroundColor: clubAccent }]} />
                <ProDayText
                  variant="caption"
                  style={[styles.clubSubtitleText, { color: `${clubAccent}D0` }]}
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
          Pilotez équipes, matchs, entraînements, effectifs, finances, vidéo IA et direction sans chercher dans l’accueil.
        </ProDayText>

        {/* Une seule recherche pour tout le pôle : celle du shell Club (CA-07/CA-10). */}
        <GlobalSearchBar
          onPress={() => {
            if (shellNav?.openSearch) {
              shellNav.openSearch();
              return;
            }
            setSearchOpen(true);
          }}
          accent={clubAccent}
          style={styles.searchBarWrap}
        />

        {/* Bannière Pôle Président si autorisé */}
        {shellNav?.openPresident ? (
          <PressableSpring
            onPress={() => shellNav.openPresident?.()}
            scaleTo={0.98}
            haptic
            style={[styles.presidentBanner, { borderColor: `${tokens.pitch}55` }]}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le Pôle Président"
          >
            <View style={[styles.presidentPill, { backgroundColor: tokens.pitch }]}>
              <Icon name="shield" size={16} color="#000000" />
            </View>
            <View style={styles.presidentInfo}>
              <View style={styles.presidentTitleRow}>
                <ProDayText variant="section" style={styles.presidentTitle}>
                  Pôle Président & Direction
                </ProDayText>
                <View style={styles.presidentTag}>
                  <ProDayText variant="caption" style={styles.presidentTagText}>
                    EXÉCUTIF
                  </ProDayText>
                </View>
              </View>
              <ProDayText variant="caption" style={styles.presidentSub}>
                Cockpit stratégique, gouvernance et arbitrage du club
              </ProDayText>
            </View>
            <Icon name="chevron-forward" size={16} color={tokens.pitch} />
          </PressableSpring>
        ) : null}

        {/*
         * 2. Modules groupés — forme reprise de la référence Fitness Park :
         * libellé de section en majuscules, puis un encart arrondi unique par
         * groupe, lignes à icône contour + libellé + chevron et filets en retrait.
         * Les destinations du dock (Accueil, Calendrier, Équipes, Menu) ne sont
         * pas répétées ici.
         */}
        {CLUB_TOOL_GROUPS.map((group) => {
          const rows = group.ids
            .map((id) => menuList.find((entry) => entry.id === id))
            .filter((entry): entry is (typeof menuList)[number] => Boolean(entry));
          if (rows.length === 0) return null;
          return (
            <View key={group.title} style={styles.groupSection}>
              <ProDayText variant="caption" style={styles.groupLabel}>
                {group.title.toUpperCase()}
              </ProDayText>
              <ClubListGroup>
                {rows.map((item) => (
                  <ClubActionRow
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    hint={item.subtitle}
                    onPress={() => shellNav?.requestNav(item.id)}
                    trailing={
                      item.locked ? <Icon name="lock" size={16} color={tokens.muted} /> : undefined
                    }
                  />
                ))}
              </ClubListGroup>
            </View>
          );
        })}

        {/* 3. Section Compte & Déconnexion */}
        <ShellAccountSection
          tone={{
            foreground: tokens.foreground,
            muted: tokens.muted,
            faint: tokens.muted,
            surface: tokens.surface,
            border: tokens.borderStrong,
            destructive: '#DC2626',
            iconBg: `${clubAccent}15`,
          }}
          links={[
            // « Profil club » et « Rôles & Permissions » sont **volontairement absents** :
            // ces deux destinations existent déjà comme lignes de menu (« Identité du
            // club », « Rôles & Permissions »). Deux entrées pour une seule page, sous
            // deux libellés différents, rendaient la navigation ambiguë.
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

      {/* Recherche Globale Overlay — repli si le shell n'en fournit pas (CA-10). */}
      <GlobalSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        accent={clubAccent}
        clubId={null}
      />

      <LegalDocumentModal
        visible={legalModalDoc !== null}
        documentId={legalModalDoc}
        onClose={() => setLegalModalDoc(null)}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#000000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubCrest: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  headerTitleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  clubSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  clubDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  clubSubtitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  lead: {
    color: '#8E8E9F',
    fontSize: 13,
    lineHeight: 18,
  },
  searchBarWrap: {
    marginVertical: -4,
  },
  presidentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
  },
  presidentPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presidentInfo: {
    flex: 1,
    gap: 2,
  },
  presidentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presidentTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  presidentTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  presidentTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  presidentSub: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  /** Section de modules — libellé en majuscules + encart groupé (référence). */
  groupSection: {
    gap: clubSpace.sm,
    marginBottom: clubForm.groupGap,
  },
  groupLabel: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginLeft: clubSpace.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '48.5%',
    // Surface mesurée `#191E23` (D-011), translucide sur le contenu.
    backgroundColor: 'rgba(25, 30, 35, 0.72)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  tileLocked: {
    opacity: 0.6,
    backgroundColor: 'rgba(14, 14, 18, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  lockedBadge: {
    padding: 4,
  },
  tileBottom: {
    gap: 2,
  },
  tileLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tileSub: {
    color: '#7D7D92',
    fontSize: 11,
    lineHeight: 15,
  },
});

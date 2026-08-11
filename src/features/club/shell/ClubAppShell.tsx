import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { ClubSidebar } from './ClubSidebar';
import { ClubShellNavProvider } from './ClubShellNavContext';
import { ClubAssistantPane } from './ClubAssistantPane';
import { ClubPitchPane } from './ClubPitchPane';
import { ClubLockedPane } from './ClubLockedPane';
import { openClubHelpChatbot } from './clubHelpOpen';
import {
  clubNavFromTab,
  findClubNavItem,
  tabFromClubNav,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import {
  findResolvedClubNavItem,
  resolveClubNavFolders,
} from '../navigation/resolveClubNavAccess';
import { ClubPageFrame } from '../../../components/club/ClubPageFrame';
import {
  CLUB_LOCKED_IDENTITY,
  getClubPageIdentity,
} from '../../../content/clubPageIdentity';
import { ClubPortalScreen } from '../../../screens/club/dashboard/ClubPortalScreen';
import { ClubRecruitmentScreen } from '../../../screens/club/recruitment/ClubRecruitmentScreen';
import { ClubCalendarScreen } from '../../../screens/club/calendar/ClubCalendarScreen';
import { ClubCommunicationScreen } from '../../../screens/club/communication/ClubCommunicationScreen';
import { ClubVitrineScreen } from '../../../screens/club/vitrine/ClubVitrineScreen';
import { CarpoolScreen } from '../../../screens/CarpoolScreen';
import { ShopScreen } from '../../../screens/ShopScreen';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { useAuth } from '../../../context/AuthContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { usePlatformFeatureFlags } from '../../../hooks/usePlatformFeatureFlags';
import { CLUB_OFFERS } from '../../../content/clubOffers';
import { CLUB_SITE } from '../../../content/clubPageIdentity';
import { resolveClubOfferId } from '../../../utils/clubFeatureAccess';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import { spacing } from '../../../theme/designTokens';

const SIDEBAR_WIDTH = 268;
const WIDE_BREAKPOINT = 900;

type Props = {
  activeTab: MainTabId;
  onTabChange: (tab: MainTabId) => void;
};

/**
 * Shell Pôle Club — sidebar dossiers (macOS) filtrée par formule + Assistant IA.
 */
export function ClubAppShell({ activeTab, onTabChange }: Props) {
  const profile = useSessionProfile();
  const { signOut } = useAuth();
  const { isEnabled } = usePlatformFeatureFlags();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const styles = useMemo(() => createStyles(), []);

  const offerId = resolveClubOfferId(profile);
  const formulaLabel = offerId ? CLUB_OFFERS[offerId].label : 'Sans formule';

  const folders = useMemo(
    () =>
      resolveClubNavFolders({
        offerId,
        isFeatureEnabled: isEnabled,
      }),
    [offerId, isEnabled],
  );

  const [navId, setNavId] = useState<ClubNavItemId>(() => clubNavFromTab(activeTab));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setNavId((prev) => {
      if (tabFromClubNav(prev) === activeTab) return prev;
      return clubNavFromTab(activeTab);
    });
  }, [activeTab]);

  const clubName = profile?.display_name ?? 'Club';
  const resolved = findResolvedClubNavItem(folders, navId);
  const activeItem = resolved ?? findClubNavItem(navId);
  const title = activeItem?.label ?? 'Club';

  const onSelect = (id: ClubNavItemId) => {
    setNavId(id);
    onTabChange(tabFromClubNav(id));
    setDrawerOpen(false);
  };

  const onOpenHelp = () => {
    setDrawerOpen(false);
    openClubHelpChatbot();
  };

  const onSignOut = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous quitter votre session club ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          setDrawerOpen(false);
          void signOut();
        },
      },
    ]);
  };

  const sidebarProps = {
    activeId: navId,
    clubName,
    formulaLabel,
    folders,
    onSelect,
    onOpenHelp,
    onSignOut,
    width: SIDEBAR_WIDTH,
  } as const;

  const content =
    resolved?.locked ? (
      <ClubPageFrame identity={CLUB_LOCKED_IDENTITY}>
        <ClubLockedPane item={resolved} />
      </ClubPageFrame>
    ) : (
      wrapClubPane(navId, renderClubPane(navId))
    );

  return (
    <ClubShellNavProvider requestNav={onSelect}>
      <View style={[styles.root, !wide && styles.rootColumn]}>
        {wide ? <ClubSidebar {...sidebarProps} /> : (
          <View style={styles.mobileBar}>
            <PressableSpring
              onPress={() => setDrawerOpen(true)}
              scaleTo={0.96}
              haptic
              style={styles.menuBtn}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le menu"
            >
            <Icon name="menu" size={20} color={CLUB_SITE.foreground} />
          </PressableSpring>
          <View style={styles.mobileTitles}>
            <ProDayText variant="caption" style={styles.mobileKicker}>
              {clubName} · {formulaLabel}
            </ProDayText>
            <ProDayText variant="section" numberOfLines={1} style={styles.mobileTitle}>
              {title}
            </ProDayText>
          </View>
          <PressableSpring
            onPress={() => onSelect('assistant')}
            scaleTo={0.96}
            haptic
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Assistant IA"
          >
            <Icon name="star-four-points" size={18} color={CLUB_SITE.accent} />
            </PressableSpring>
          </View>
        )}

        <View style={styles.pane}>{content}</View>

        {!wide ? (
          <Modal
            visible={drawerOpen}
            animationType="fade"
            transparent
            onRequestClose={() => setDrawerOpen(false)}
          >
            <View style={styles.drawerRoot}>
              <Pressable style={styles.drawerScrim} onPress={() => setDrawerOpen(false)} />
              <View style={styles.drawerPanel}>
                <ClubSidebar {...sidebarProps} inDrawer />
              </View>
            </View>
          </Modal>
        ) : null}
      </View>
    </ClubShellNavProvider>
  );
}

function wrapClubPane(navId: ClubNavItemId, node: React.ReactNode) {
  const identity = getClubPageIdentity(navId);
  // Matchs / Messages / Covoit / Shop ont déjà un header métier → accent + wash seulement.
  const chromeOwn: ClubNavItemId[] = ['calendar', 'messages', 'carpool', 'shop'];
  const showHero = !chromeOwn.includes(navId);
  return (
    <ClubPageFrame identity={identity} showHero={showHero}>
      {node}
    </ClubPageFrame>
  );
}

function renderClubPane(navId: ClubNavItemId) {
  switch (navId) {
    case 'today':
      return <ClubPortalScreen embedded hideRail chapter="aujourdhui" />;
    case 'assistant':
      return <ClubAssistantPane />;
    case 'pitch':
      return <ClubPitchPane />;
    case 'structure':
      return <ClubPortalScreen embedded hideRail chapter="structure" />;
    case 'vivier':
      return <ClubPortalScreen embedded hideRail chapter="vivier" />;
    case 'invites':
      return (
        <ClubPortalScreen
          embedded
          hideRail
          chapter="competition"
          competitionFocus="invites"
        />
      );
    case 'events':
      return (
        <ClubPortalScreen
          embedded
          hideRail
          chapter="competition"
          competitionFocus="events"
        />
      );
    case 'video':
      return <ClubPortalScreen embedded hideRail chapter="outils" outilsFocus="video" />;
    case 'offers':
      return <ClubPortalScreen embedded hideRail chapter="outils" outilsFocus="offers" />;
    case 'equipment':
      return <ClubPortalScreen embedded hideRail chapter="outils" outilsFocus="equipment" />;
    case 'sponsors':
      return <ClubPortalScreen embedded hideRail chapter="outils" outilsFocus="sponsors" />;
    case 'pipeline':
      return <ClubRecruitmentScreen />;
    case 'calendar':
      return <ClubCalendarScreen />;
    case 'messages':
      return <ClubCommunicationScreen />;
    case 'vitrine':
      return <ClubVitrineScreen />;
    case 'carpool':
      return <CarpoolScreen />;
    case 'shop':
      return <ShopScreen />;
    default:
      return <ClubPortalScreen embedded hideRail chapter="aujourdhui" />;
  }
}

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: CLUB_SITE.bg,
      minHeight: 0,
    },
    rootColumn: {
      flexDirection: 'column',
    },
    pane: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      backgroundColor: CLUB_SITE.bg,
    },
    mobileBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: CLUB_SITE.border,
      backgroundColor: CLUB_SITE.bg,
      flexShrink: 0,
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLUB_SITE.border,
      backgroundColor: 'rgba(255,255,255,0.02)',
    },
    mobileTitles: { flex: 1, minWidth: 0 },
    mobileKicker: {
      color: CLUB_SITE.muted,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontSize: 10,
      fontWeight: '800',
    },
    mobileTitle: { color: CLUB_SITE.foreground, fontWeight: '800', letterSpacing: -0.4 },
    drawerRoot: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    drawerScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    drawerPanel: {
      width: SIDEBAR_WIDTH,
      maxWidth: '82%',
      alignSelf: 'stretch',
      height: '100%',
      flexDirection: 'column',
      zIndex: 2,
      backgroundColor: CLUB_SITE.bg,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 4, height: 0 },
      elevation: 10,
    },
  });
}

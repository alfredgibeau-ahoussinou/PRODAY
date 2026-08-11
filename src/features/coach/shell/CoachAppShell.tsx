import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { CoachSidebar } from './CoachSidebar';
import { CoachShellNavProvider } from './CoachShellNavContext';
import { CoachPitchPane } from './CoachPitchPane';
import { CoachLockedPane } from './CoachLockedPane';
import { openCoachHelpChatbot } from './coachHelpOpen';
import {
  coachNavFromTab,
  findCoachNavItem,
  tabFromCoachNav,
  type CoachNavItemId,
} from '../navigation/coachNavConfig';
import {
  findResolvedCoachNavItem,
  resolveCoachNavFolders,
} from '../navigation/resolveCoachNavAccess';
import { CoachPageFrame } from '../../../components/coach/CoachPageFrame';
import {
  COACH_LOCKED_IDENTITY,
  COACH_SITE,
  getCoachPageIdentity,
} from '../../../content/coachPageIdentity';
import { CoachPortalScreen } from '../../../screens/coach/CoachPortalScreen';
import { SmartTacticsPortalScreen } from '../../../screens/smartTactics/SmartTacticsPortalScreen';
import { TeamManagementScreen } from '../../../screens/TeamManagementScreen';
import { MatchsScreen } from '../../../screens/MatchsScreen';
import { MessagesScreen } from '../../../screens/MessagesScreen';
import { CarpoolScreen } from '../../../screens/CarpoolScreen';
import { ProfilTabScreen } from '../../../screens/ProfilTabScreen';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { useAuth } from '../../../context/AuthContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useTabNavigation } from '../../../context/TabNavigationContext';
import { usersService } from '../../../services/users.service';
import {
  resolveClubCoversCoachFromMembers,
  userCanAccessSmartTactics,
} from '../../../utils/clubFeatureAccess';
import { isSubscriptionAccessActive } from '../../../utils/subscriptionLogic';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import type { User } from '../../../models/User';
import { spacing } from '../../../theme/designTokens';
import { useCoachShellNav } from './CoachShellNavContext';

const SIDEBAR_WIDTH = 268;
const WIDE_BREAKPOINT = 900;

function CoachGestionPane({ profile }: { profile: User }) {
  const shellNav = useCoachShellNav();
  return (
    <TeamManagementScreen
      profile={profile}
      onBack={() => shellNav?.requestNav('effectif')}
    />
  );
}

type Props = {
  activeTab: MainTabId;
  onTabChange: (tab: MainTabId) => void;
};

/**
 * Shell Pôle Coach — sidebar dossiers FOC + panes (chapters / ST / matchs).
 */
export function CoachAppShell({ activeTab, onTabChange }: Props) {
  const profile = useSessionProfile();
  const { signOut } = useAuth();
  const { pendingDashboardView, clearPendingDashboard } = useTabNavigation();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const styles = useMemo(() => createStyles(), []);

  const [members, setMembers] = useState<User[]>([]);
  const clubId = profile?.profile.club_id;

  useEffect(() => {
    if (!clubId) {
      setMembers([]);
      return;
    }
    void usersService.listMembersByClubId(clubId).then(setMembers).catch(() => setMembers([]));
  }, [clubId]);

  const clubCoversCoach = useMemo(
    () => resolveClubCoversCoachFromMembers(members),
    [members],
  );
  const canSmartTactics = userCanAccessSmartTactics(profile, { clubCoversCoach });
  const formulaLabel = clubCoversCoach
    ? 'Couvert club'
    : profile && isSubscriptionAccessActive(profile)
      ? 'Coach Pro'
      : 'Gratuit';

  const folders = useMemo(
    () => resolveCoachNavFolders({ canSmartTactics }),
    [canSmartTactics],
  );

  const [navId, setNavId] = useState<CoachNavItemId>(() => coachNavFromTab(activeTab));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setNavId((prev) => {
      if (tabFromCoachNav(prev) === activeTab) return prev;
      return coachNavFromTab(activeTab);
    });
  }, [activeTab]);

  useEffect(() => {
    if (pendingDashboardView === 'smart_tactics') {
      setNavId('smart_tactics');
      onTabChange(tabFromCoachNav('smart_tactics'));
      clearPendingDashboard();
    } else if (pendingDashboardView === 'gestion') {
      setNavId('gestion');
      onTabChange(tabFromCoachNav('gestion'));
      clearPendingDashboard();
    }
  }, [pendingDashboardView, clearPendingDashboard, onTabChange]);

  const coachName = profile?.display_name ?? 'Coach';
  const resolved = findResolvedCoachNavItem(folders, navId);
  const activeItem = resolved ?? findCoachNavItem(navId);
  const title = activeItem?.label ?? 'Coach';

  const onSelect = (id: CoachNavItemId) => {
    setNavId(id);
    onTabChange(tabFromCoachNav(id));
    setDrawerOpen(false);
  };

  const onSignOut = () => {
    Alert.alert('Se déconnecter', 'Quitter la session coach ?', [
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
    coachName,
    formulaLabel,
    folders,
    onSelect,
    onOpenHelp: () => {
      setDrawerOpen(false);
      openCoachHelpChatbot();
    },
    onSignOut,
    width: SIDEBAR_WIDTH,
  } as const;

  const content =
    resolved?.locked ? (
      <CoachPageFrame identity={COACH_LOCKED_IDENTITY}>
        <CoachLockedPane item={resolved} />
      </CoachPageFrame>
    ) : (
      wrapCoachPane(navId, renderCoachPane(navId, profile))
    );

  return (
    <CoachShellNavProvider requestNav={onSelect}>
      <View style={[styles.root, !wide && styles.rootColumn]}>
        {wide ? <CoachSidebar {...sidebarProps} /> : (
          <View style={styles.mobileBar}>
            <PressableSpring
              onPress={() => setDrawerOpen(true)}
              scaleTo={0.96}
              haptic
              style={styles.menuBtn}
            >
              <Icon name="menu" size={20} color={COACH_SITE.foreground} />
            </PressableSpring>
            <View style={styles.mobileTitles}>
              <ProDayText variant="caption" style={styles.mobileKicker}>
                {coachName} · {formulaLabel}
              </ProDayText>
              <ProDayText variant="section" numberOfLines={1} style={styles.mobileTitle}>
                {title}
              </ProDayText>
            </View>
            <PressableSpring
              onPress={() => onSelect('smart_tactics')}
              scaleTo={0.96}
              haptic
              style={styles.menuBtn}
            >
              <Icon name="star-four-points" size={18} color={COACH_SITE.accent} />
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
                <CoachSidebar {...sidebarProps} inDrawer />
              </View>
            </View>
          </Modal>
        ) : null}
      </View>
    </CoachShellNavProvider>
  );
}

function wrapCoachPane(navId: CoachNavItemId, node: React.ReactNode) {
  const identity = getCoachPageIdentity(navId);
  const chromeOwn: CoachNavItemId[] = [
    'messages',
    'carpool',
    'profil',
    'smart_tactics',
    'gestion',
  ];
  const showHero = !chromeOwn.includes(navId);
  return (
    <CoachPageFrame identity={identity} showHero={showHero}>
      {node}
    </CoachPageFrame>
  );
}

function renderCoachPane(navId: CoachNavItemId, profile: User | null | undefined) {
  switch (navId) {
    case 'today':
      return <CoachPortalScreen embedded hideRail chapter="cockpit" />;
    case 'pitch':
      return <CoachPitchPane />;
    case 'effectif':
      return <CoachPortalScreen embedded hideRail chapter="effectif" />;
    case 'planning':
      return <CoachPortalScreen embedded hideRail chapter="planning" />;
    case 'matchs':
      return <CoachPortalScreen embedded hideRail chapter="matchs" />;
    case 'forme':
      return <CoachPortalScreen embedded hideRail chapter="performance" />;
    case 'com_staff':
      return <CoachPortalScreen embedded hideRail chapter="communication" />;
    case 'smart_tactics':
      return <SmartTacticsPortalScreen />;
    case 'gestion':
      return profile ? <CoachGestionPane profile={profile} /> : null;
    case 'match_center':
      return <MatchsScreen defaultChapter="centre" embeddedInShell />;
    case 'messages':
      return <MessagesScreen />;
    case 'carpool':
      return <CarpoolScreen />;
    case 'profil':
      return <ProfilTabScreen />;
    default:
      return <CoachPortalScreen embedded hideRail chapter="cockpit" />;
  }
}

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: COACH_SITE.bg,
      minHeight: 0,
    },
    rootColumn: { flexDirection: 'column' },
    pane: { flex: 1, minWidth: 0, minHeight: 0, backgroundColor: COACH_SITE.bg },
    mobileBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COACH_SITE.border,
      backgroundColor: COACH_SITE.bg,
      flexShrink: 0,
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: COACH_SITE.border,
      backgroundColor: 'rgba(255,255,255,0.02)',
    },
    mobileTitles: { flex: 1, minWidth: 0 },
    mobileKicker: {
      color: COACH_SITE.muted,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontSize: 10,
      fontWeight: '800',
    },
    mobileTitle: { color: COACH_SITE.foreground, fontWeight: '800', letterSpacing: -0.4 },
    drawerRoot: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
    drawerScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    drawerPanel: {
      width: SIDEBAR_WIDTH,
      maxWidth: '82%',
      alignSelf: 'stretch',
      height: '100%',
      zIndex: 2,
      backgroundColor: COACH_SITE.bg,
    },
  });
}

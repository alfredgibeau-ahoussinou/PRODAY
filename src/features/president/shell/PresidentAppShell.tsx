import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../club/hooks/useClubWorkspace';
import { canAccessPresidentPole } from '../navigation/canAccessPresidentPole';
import { type PresidentNavItemId } from '../navigation/presidentNavConfig';

import {
  resolvePresidentCommandItems,
  resolvePresidentMenuItems,
  resolvePresidentNavFolders,
  resolvePresidentPrimaryNav,
} from '../navigation/resolvePresidentNavAccess';
import { usePresidentShellBridge } from '../bridge/PresidentShellBridge';
import { PresidentCommandPalette } from '../ui/PresidentCommandPalette';
import { PresidentLoading, PresidentText } from '../ui/presidentUi';
import { PressableSpring } from '../../../components/motion';
import { PresidentSidebar } from './PresidentSidebar';
import { PresidentTabBar } from './PresidentTabBar';
import { PresidentShellNavProvider } from './PresidentShellNavContext';
import { PresidentThemeProvider, usePresidentTheme } from './PresidentThemeContext';
import { renderPresidentPane } from './renderPresidentPane';
import {
  presidentChrome,
  presidentSpace,
} from '../theme/presidentDesignSystem';
import type { PresidentThemeTokens } from '../theme/presidentTokens';
import type { ClubNavItemId } from '../../club/navigation/clubNavConfig';

/**
 * Shell Pôle Président — sidebar desktop + dock mobile.
 */
export function PresidentAppShell() {
  return (
    <PresidentThemeProvider>
      <PresidentAppShellInner />
    </PresidentThemeProvider>
  );
}

function PresidentAppShellInner() {
  const { tokens } = usePresidentTheme();
  const profile = useSessionProfile();
  const { signOut } = useAuth();
  const ws = useClubWorkspace();
  const bridge = usePresidentShellBridge();
  const { width } = useWindowDimensions();
  const wide = width >= presidentChrome.wideBreakpoint;
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const [navId, setNavId] = useState<PresidentNavItemId>('cockpit');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const allowed = canAccessPresidentPole({
    role: profile?.role,
    uid: profile?.uid,
    clubId: ws.clubId ?? profile?.profile?.club_id,
    clubOwnerUid: ws.club?.owner_uid,
  });

  const folders = useMemo(() => resolvePresidentNavFolders(), []);
  const primaryItems = useMemo(() => resolvePresidentPrimaryNav(), []);
  const menuItems = useMemo(() => resolvePresidentMenuItems(), []);
  const commandItems = useMemo(() => resolvePresidentCommandItems(), []);

  const exitToClub = useCallback(
    (clubNav?: ClubNavItemId) => {
      bridge?.closePresident(clubNav ? { clubNav } : undefined);
    },
    [bridge],
  );

  const openClubDeepLink = useCallback(
    (id: ClubNavItemId) => {
      bridge?.closePresident({ clubNav: id });
    },
    [bridge],
  );

  const requestNav = useCallback((id: PresidentNavItemId) => {
    setNavId(id);
  }, []);

  useEffect(() => {
    if (!allowed && !ws.loading) {
      Alert.alert(
        'Pôle Président',
        'Accès réservé aux comptes Club dirigeants rattachés.',
        [{ text: 'Retour Club', onPress: () => exitToClub() }],
      );
    }
  }, [allowed, ws.loading, exitToClub]);

  if (ws.loading) {
    return (
      <View style={styles.root}>
        <PresidentLoading />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={[styles.root, styles.denied]}>
        <PresidentText variant="h2">Accès refusé</PresidentText>
        <PresidentText variant="body" muted style={{ textAlign: 'center' }}>
          Le Pôle Président est réservé aux dirigeants du club.
        </PresidentText>
        <PressableSpring
          onPress={() => exitToClub()}
          scaleTo={0.97}
          haptic
          style={styles.backBtn}
        >
          <PresidentText variant="body" style={{ color: tokens.accentText, fontWeight: '800' }}>
            Retour au Pôle Club
          </PresidentText>
        </PressableSpring>
      </View>
    );
  }

  const pane = renderPresidentPane(navId, menuItems, requestNav, () => exitToClub());

  return (
    <PresidentShellNavProvider
      requestNav={requestNav}
      openClubDeepLink={openClubDeepLink}
      openCommandPalette={() => setCommandOpen(true)}
      exitToClub={() => exitToClub()}
      signOut={() => void signOut()}
    >
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#0E1524', tokens.bg, '#03050A']}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(212,184,128,0.07)', 'transparent', 'transparent']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 0.55 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.row}>
          {wide ? (
            <PresidentSidebar
              activeId={navId === 'menu' ? 'cockpit' : navId}
              clubName={ws.club?.name ?? 'Club'}
              folders={folders}
              onSelect={requestNav}
              onExitClub={() => exitToClub()}
              onSignOut={() => void signOut()}
              onOpenCommand={() => setCommandOpen(true)}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            />
          ) : null}
          <View style={styles.content}>{pane}</View>
        </View>
        {!wide ? (
          <PresidentTabBar
            activeId={navId}
            items={primaryItems}
            onSelect={requestNav}
          />
        ) : null}
        <PresidentCommandPalette
          visible={commandOpen}
          items={commandItems}
          onClose={() => setCommandOpen(false)}
          onSelect={requestNav}
        />
      </View>
    </PresidentShellNavProvider>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    row: { flex: 1, flexDirection: 'row' },
    content: { flex: 1 },
    denied: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: presidentSpace.xl,
      gap: presidentSpace.md,
    },
    backBtn: {
      marginTop: presidentSpace.md,
      paddingHorizontal: presidentSpace.xl,
      paddingVertical: presidentSpace.md,
      borderRadius: 999,
      backgroundColor: tokens.accent,
    },
  });
}

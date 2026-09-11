import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import type { CarpoolChapterId } from '../content/carpoolChapters';
import { useTeamEvents } from '../hooks/useAppData';
import { useCarpoolOffers } from '../hooks/useCarpoolOffers';
import { CarpoolHomeScreen } from '../components/carpool/CarpoolHomeScreen';
import { CarpoolUiProvider } from '../components/carpool/CarpoolUiContext';
import { CarpoolEventDetailScreen } from '../components/carpool/CarpoolEventDetailScreen';
import { CarpoolGuestPrompt } from '../components/carpool/CarpoolGuestPrompt';
import { PushScreenTransition } from '../components/motion';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';
import { useCoachTokens } from '../features/coach/shell/CoachThemeContext';
import { usePlayerTheme, usePlayerThemeColors } from '../context/PlayerThemeContext';
import { PLAYER_DARK } from '../theme/playerDarkPremium';
import { ProDayText } from '../components/ui/ProDayText';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { useJoueurSecondaryTabBack } from '../hooks/useJoueurSecondaryTabBack';
import { CrestWatermark } from './joueur/PlayerSaisonIcons';

export const CarpoolScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const tabBack = useJoueurSecondaryTabBack();
  const joueurSession = useJoueurSession();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const coachShell = Boolean(useCoachShellNav());
  const coachTokens = useCoachTokens();
  const playerThemeCtx = usePlayerTheme();
  const playerColors = usePlayerThemeColors();
  const teamPrimary = playerColors.accent;
  const clubName = playerThemeCtx.clubName;
  const screenBg = coachShell ? coachTokens.bg : joueurLive ? PLAYER_DARK.bg : undefined;
  const { pendingCarpoolLink, clearPendingCarpool, openAuth } = useTabNavigation();
  const clubId = profile?.profile.club_id;
  const { events, loading, refresh } = useTeamEvents(profile?.uid, clubId);
  const {
    offers: standaloneOffers,
    allOffers: standaloneAllOffers,
    loading: standaloneLoading,
    refresh: refreshOffers,
  } = useCarpoolOffers(profile?.uid, profile?.profile?.club_id);

  const refreshAll = () => {
    void refresh();
    void refreshOffers();
  };
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialChapter, setInitialChapter] = useState<CarpoolChapterId>('evenements');

  useEffect(() => {
    if (!pendingCarpoolLink) return;
    if (pendingCarpoolLink.chapter) setInitialChapter(pendingCarpoolLink.chapter);
    if (pendingCarpoolLink.eventId) setSelectedEventId(pendingCarpoolLink.eventId);
    clearPendingCarpool();
  }, [pendingCarpoolLink, clearPendingCarpool]);

  const joueurShell = joueurLive && !coachShell;

  return (
    <CarpoolUiProvider coachShell={coachShell} joueurShell={joueurShell}>
      <View style={[styles.root, { backgroundColor: screenBg ?? '#000000' }]}>
        {joueurShell && !selectedEventId ? (
          <View style={[styles.header, { paddingTop: 6 }]}>
            <View style={styles.headerTitleRow}>
              {tabBack.showBack ? (
                <ScreenBackButton onPress={tabBack.onBack} />
              ) : (
                <View
                  style={[
                    styles.clubCrest,
                    { borderColor: `${teamPrimary}40`, backgroundColor: `${teamPrimary}18` },
                  ]}
                >
                  <CrestWatermark width={22} height={26} color={teamPrimary} opacity={0.95} />
                </View>
              )}
              <View style={styles.titleCol}>
                <ProDayText variant="title" style={styles.headerTitleText}>
                  Trajets & Covoiturage
                </ProDayText>
                {clubName ? (
                  <View style={styles.clubSubtitleRow}>
                    <View style={[styles.clubDot, { backgroundColor: teamPrimary }]} />
                    <ProDayText
                      variant="caption"
                      style={[styles.clubSubtitleText, { color: `${teamPrimary}D0` }]}
                    >
                      {clubName}
                    </ProDayText>
                  </View>
                ) : (
                  <ProDayText variant="caption" style={styles.headerSub}>
                    Matchs & Entraînements
                  </ProDayText>
                )}
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.content}>
          {!profile ? (
            <CarpoolGuestPrompt
              onLogin={() => openAuth('login')}
              onSignup={() => openAuth('signup')}
              joueurShell={joueurShell}
            />
          ) : (
            <CarpoolHomeScreen
              profile={profile}
              events={events}
              standaloneOffers={standaloneOffers}
              standaloneAllOffers={standaloneAllOffers}
              standaloneLoading={standaloneLoading}
              loading={loading || standaloneLoading}
              initialChapter={initialChapter}
              onOpenEvent={setSelectedEventId}
              onRefresh={refreshAll}
              onLoginRequired={() => openAuth('login')}
              hideHero={joueurShell}
              joueurShell={joueurShell}
            />
          )}
        </View>

        <PushScreenTransition active={selectedEventId != null}>
          {selectedEventId ? (
            <CarpoolEventDetailScreen
              eventId={selectedEventId}
              profile={profile!}
              onBack={() => {
                setSelectedEventId(null);
                void refreshAll();
              }}
            />
          ) : null}
        </PushScreenTransition>
      </View>
    </CarpoolUiProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#000000',
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
  headerSub: {
    fontSize: 11.5,
    color: '#8B8B9A',
    marginTop: 1,
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
});


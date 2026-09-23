import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ProDayText } from '../components/ui/ProDayText';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { usePlayerTheme, usePlayerThemeColors } from '../context/PlayerThemeContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { membershipsService } from '../services/memberships.service';
import { clubsService } from '../services/clubs.service';
import { clubAnnouncementsService } from '../services/clubAnnouncements.service';
import type { Membership } from '../models/Membership';
import type { Club } from '../models/Club';
import type { ClubAnnouncement } from '../models/ClubAnnouncement';
import { JoinClubScreen } from './JoinClubScreen';
import { ClubAnnouncementsScreen } from './ClubAnnouncementsScreen';
import { PlayersListScreen } from './PlayersListScreen';
import { CrestWatermark } from './joueur/PlayerSaisonIcons';
import { prodayHaptics } from '../utils/prodayHaptics';
import { fffScraperService, type MyFffTeamLink } from '../services/fffScraper.service';
import { frenchFootballStandingsService } from '../services/frenchFootballStandings.service';

import { colors } from '../theme/designTokens';
type Overlay = 'join' | 'announcements' | 'roster' | null;

export const AmateurClubScreen: React.FC = () => {
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const playerThemeCtx = usePlayerTheme();
  const themeColors = usePlayerThemeColors();
  const nav = useTabNavigationActions();
  const accent = themeColors.accent;

  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [myFffTeam, setMyFffTeam] = useState<MyFffTeamLink | null>(null);
  const [fffLeagueData, setFffLeagueData] = useState<Awaited<ReturnType<typeof frenchFootballStandingsService.getLeagueStandings>> | null>(null);

  useEffect(() => {
    void fffScraperService.getMyFffTeam().then((linked) => {
      if (linked) setMyFffTeam(linked);
    });
  }, []);

  useEffect(() => {
    let active = true;
    if (!myFffTeam?.leagueId) {
      setFffLeagueData(null);
      return () => {
        active = false;
      };
    }
    void frenchFootballStandingsService.getLeagueStandings(myFffTeam.leagueId).then((data) => {
      if (active) setFffLeagueData(data);
    });
    return () => {
      active = false;
    };
  }, [myFffTeam?.leagueId]);

  const fffTeamEntry = useMemo(() => {
    if (!fffLeagueData || !myFffTeam) return null;
    return fffLeagueData.standings.find((t) => t.team_id === myFffTeam.teamId) ?? null;
  }, [fffLeagueData, myFffTeam]);

  const load = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const active =
        (await membershipsService.getActiveForPlayer(profile.uid)) ??
        (await membershipsService.listByPlayer(profile.uid)).find((m) => m.status === 'pending') ??
        null;
      setMembership(active);
      const clubId = active?.club_id ?? profile.profile.club_id;
      if (clubId) {
        const [clubDoc, ann] = await Promise.all([
          clubsService.getById(clubId),
          clubAnnouncementsService.listByClub(clubId),
        ]);
        setClub(clubDoc);
        setAnnouncements(ann.slice(0, 3));
      } else {
        setClub(null);
        setAnnouncements([]);
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasTeam = Boolean(club || myFffTeam || profile?.profile?.club_id);
  const teamName = club?.name?.trim() || myFffTeam?.teamName || playerThemeCtx.clubName || 'Mon Équipe';
  const teamCity = club?.city?.trim() || 'Île-de-France';
  const isLicensed = membership?.status === 'active' || Boolean(profile?.profile?.club_id) || Boolean(myFffTeam);
  const divisionLabel = fffLeagueData?.divisionLabel ?? fffLeagueData?.name ?? 'Football Compétition';

  if (!profile) return null;

  return (
    <View style={styles.root}>
      <TabScreenShell
        caption="ÉQUIPE & CLUB"
        title={hasTeam ? teamName : 'Mon Équipe'}
        subtitle={hasTeam ? 'Effectif · Staff · Directives Vestiaire' : 'Rattachement & Équipe officielle'}
        flat
      >
        {loading ? (
          <ActivityIndicator color={accent} style={styles.loader} />
        ) : !hasTeam ? (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_CONTENT_INSET + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* ÉTAT VIDE / NON RATTACHÉ */}
            <View style={[styles.noClubCard, { borderColor: `${accent}40` }]}>
              <View style={[styles.crestContainer, { borderColor: `${accent}60`, backgroundColor: `${accent}18` }]}>
                <CrestWatermark width={36} height={42} color={accent} opacity={0.95} />
              </View>
              <ProDayText style={styles.noClubTitle}>Aucun club rattaché</ProDayText>
              <ProDayText style={styles.noClubSubtitle}>
                Rattachez votre club ou sélectionnez votre équipe officielle FFF pour synchroniser le vestiaire, le calendrier et les directives du staff.
              </ProDayText>
              <View style={styles.noClubBtnCol}>
                <PressableSpring
                  onPress={() => setOverlay('join')}
                  scaleTo={0.96}
                  haptic
                  style={[styles.noClubPrimaryBtn, { backgroundColor: accent }]}
                >
                  <Ionicons name="shield-outline" size={16} color="#000000" />
                  <ProDayText style={styles.noClubPrimaryBtnText}>Rejoindre un club</ProDayText>
                </PressableSpring>
                <PressableSpring
                  onPress={() => nav.setActiveTab('matchs')}
                  scaleTo={0.96}
                  haptic
                  style={[styles.noClubSecondaryBtn, { borderColor: `${accent}45`, backgroundColor: `${accent}12` }]}
                >
                  <Ionicons name="trophy-outline" size={16} color={accent} />
                  <ProDayText style={[styles.noClubSecondaryBtnText, { color: accent }]}>
                    Sélectionner mon équipe FFF (SportEasy)
                  </ProDayText>
                </PressableSpring>
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_CONTENT_INSET + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. HERO IDENTITÉ ÉQUIPE */}
            <View style={[styles.teamHeroCard, { borderColor: `${accent}40` }]}>
              <View style={styles.heroTopRow}>
                <View style={[styles.crestContainer, { borderColor: `${accent}60`, backgroundColor: `${accent}18` }]}>
                  {club?.logo_url ? (
                    <Image source={{ uri: club.logo_url }} style={styles.crestImg} resizeMode="contain" />
                  ) : (
                    <CrestWatermark width={32} height={38} color={accent} opacity={0.95} />
                  )}
                </View>

                <View style={styles.heroMetaCol}>
                  <ProDayText style={styles.heroTeamName} numberOfLines={1}>
                    {teamName}
                  </ProDayText>
                  <ProDayText style={styles.heroSubMeta}>
                    {divisionLabel} · {teamCity}
                  </ProDayText>
                  <View style={styles.licenseBadgeRow}>
                    <View
                      style={[
                        styles.licensePill,
                        {
                          backgroundColor: isLicensed ? '#22C55E1C' : '#F59E0B1C',
                          borderColor: isLicensed ? '#22C55E60' : '#F59E0B60',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isLicensed ? 'shield-checkmark' : 'alert-circle'}
                        size={11}
                        color={isLicensed ? '#22C55E' : '#F59E0B'}
                      />
                      <ProDayText
                        style={[
                          styles.licenseText,
                          { color: isLicensed ? '#22C55E' : '#F59E0B' },
                        ]}
                      >
                        {isLicensed ? 'Licence FFF Validée 2026/2027' : 'Licence en attente'}
                      </ProDayText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Stats Officielles FFF si l'équipe est identifiée au classement */}
              {fffTeamEntry ? (
                <View style={styles.seasonStatsStrip}>
                  <View style={styles.statCol}>
                    <ProDayText style={styles.statVal}>{fffTeamEntry.played}</ProDayText>
                    <ProDayText style={styles.statLbl}>Matchs</ProDayText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <ProDayText style={[styles.statVal, { color: '#22C55E' }]}>{fffTeamEntry.won}</ProDayText>
                    <ProDayText style={styles.statLbl}>Victoires</ProDayText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <ProDayText style={[styles.statVal, { color: '#9CA3AF' }]}>{fffTeamEntry.drawn}</ProDayText>
                    <ProDayText style={styles.statLbl}>Nuls</ProDayText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <ProDayText style={[styles.statVal, { color: '#EF4444' }]}>{fffTeamEntry.lost}</ProDayText>
                    <ProDayText style={styles.statLbl}>Défaites</ProDayText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <ProDayText style={[styles.statVal, { color: accent }]}>{fffTeamEntry.points}</ProDayText>
                    <ProDayText style={styles.statLbl}>Points ({fffTeamEntry.rank}e)</ProDayText>
                  </View>
                </View>
              ) : null}
            </View>

            {/* 2. ACTIONS DIRECTES VESTIAIRE */}
            <View style={styles.actionPillsRow}>
              <PressableSpring
                onPress={() => nav.setActiveTab('matchs')}
                scaleTo={0.96}
                haptic
                style={[styles.actionPill, { borderColor: `${accent}35`, backgroundColor: `${accent}14` }]}
              >
                <Ionicons name="trophy-outline" size={15} color={accent} />
                <ProDayText style={[styles.actionPillText, { color: accent }]}>
                  Centre Matchs
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => nav.setActiveTab('covoiturage')}
                scaleTo={0.96}
                haptic
                style={[styles.actionPill, { borderColor: `${accent}35`, backgroundColor: `${accent}14` }]}
              >
                <Ionicons name="car-outline" size={15} color={accent} />
                <ProDayText style={[styles.actionPillText, { color: accent }]}>
                  Covoiturage
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => nav.setActiveTab('messages')}
                scaleTo={0.96}
                haptic
                style={[styles.actionPill, { borderColor: `${accent}35`, backgroundColor: `${accent}14` }]}
              >
                <Ionicons name="chatbubbles-outline" size={15} color={accent} />
                <ProDayText style={[styles.actionPillText, { color: accent }]}>
                  Chat Vestiaire
                </ProDayText>
              </PressableSpring>
            </View>

            {/* 3. EFFECTIF & COÉQUIPIERS */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <ProDayText style={[styles.sectionKicker, { color: accent }]}>
                    GROUPE & EFFECTIF
                  </ProDayText>
                  <ProDayText style={styles.sectionTitle}>
                    Joueurs & Coéquipiers
                  </ProDayText>
                </View>

                <PressableSpring
                  onPress={() => setOverlay('roster')}
                  scaleTo={0.95}
                  haptic
                  style={[styles.smallBtn, { borderColor: `${accent}40`, backgroundColor: `${accent}14` }]}
                >
                  <ProDayText style={[styles.smallBtnText, { color: accent }]}>
                    Annuaire →
                  </ProDayText>
                </PressableSpring>
              </View>

              <View style={styles.rosterCard}>
                <View style={{ gap: 4 }}>
                  <ProDayText style={styles.rosterCardTitle}>Effectif officiel du club</ProDayText>
                  <ProDayText style={styles.rosterCardDesc}>
                    Consultez la liste des licenciés, fiches profils et coéquipiers enregistrés.
                  </ProDayText>
                </View>
                <PressableSpring
                  onPress={() => setOverlay('roster')}
                  scaleTo={0.96}
                  haptic
                  style={[styles.rosterOpenBtn, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}
                >
                  <Ionicons name="people-outline" size={16} color={accent} />
                  <ProDayText style={[styles.rosterOpenBtnText, { color: accent }]}>
                    Consulter l’annuaire du club
                  </ProDayText>
                </PressableSpring>
              </View>
            </View>

            {/* 4. STAFF TECHNIQUE */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <ProDayText style={[styles.sectionKicker, { color: accent }]}>
                    ENCADREMENT
                  </ProDayText>
                  <ProDayText style={styles.sectionTitle}>
                    Staff Technique
                  </ProDayText>
                </View>
              </View>

              <View style={styles.staffCard}>
                <View style={[styles.staffIconCircle, { backgroundColor: `${accent}16`, borderColor: `${accent}35` }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={accent} />
                </View>
                <View style={styles.staffMetaCol}>
                  <ProDayText style={styles.staffName}>Staff & Éducateurs FFF</ProDayText>
                  <ProDayText style={styles.staffRole}>
                    Coordonnées et contacts disponibles via la messagerie du club.
                  </ProDayText>
                </View>
                <PressableSpring
                  onPress={() => nav.setActiveTab('messages')}
                  scaleTo={0.92}
                  haptic
                  style={styles.staffMsgBtn}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={accent} />
                </PressableSpring>
              </View>
            </View>

            {/* 5. ANNONCES & VIE DU VESTIAIRE */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <ProDayText style={[styles.sectionKicker, { color: accent }]}>
                    COMMUNICATION
                  </ProDayText>
                  <ProDayText style={styles.sectionTitle}>
                    Annonces Officielles
                  </ProDayText>
                </View>

                {announcements.length > 0 ? (
                  <PressableSpring
                    onPress={() => setOverlay('announcements')}
                    scaleTo={0.95}
                    haptic
                    style={[styles.smallBtn, { borderColor: `${accent}40`, backgroundColor: `${accent}14` }]}
                  >
                    <ProDayText style={[styles.smallBtnText, { color: accent }]}>
                      Fil complet →
                    </ProDayText>
                  </PressableSpring>
                ) : null}
              </View>

              {announcements.length > 0 ? (
                <View style={styles.annList}>
                  {announcements.map((ann) => (
                    <View key={ann.id} style={styles.annCard}>
                      <View style={styles.annHeaderRow}>
                        <View
                          style={[
                            styles.annPriorityPill,
                            {
                              backgroundColor: ann.pinned ? '#EF444420' : `${accent}20`,
                              borderColor: ann.pinned ? '#EF444455' : `${accent}55`,
                            },
                          ]}
                        >
                          <ProDayText
                            style={[
                              styles.annPriorityText,
                              { color: ann.pinned ? '#EF4444' : accent },
                            ]}
                          >
                            {ann.pinned ? 'IMPORTANT' : 'INFO'}
                          </ProDayText>
                        </View>
                      </View>
                      <ProDayText style={styles.annTitleText}>{ann.title}</ProDayText>
                      <ProDayText style={styles.annBodyText}>{ann.body}</ProDayText>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyAnnCard}>
                  <Ionicons name="megaphone-outline" size={20} color="#71717A" />
                  <ProDayText style={styles.emptyAnnText}>
                    Aucune annonce officielle publiée pour le moment.
                  </ProDayText>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </TabScreenShell>

      <PushScreenTransition active={overlay === 'join'}>
        {overlay === 'join' ? (
          <JoinClubScreen
            profile={profile}
            onBack={() => setOverlay(null)}
            onJoined={() => {
              setOverlay(null);
              void load();
            }}
          />
        ) : null}
      </PushScreenTransition>
      <PushScreenTransition active={overlay === 'announcements'}>
        {overlay === 'announcements' ? (
          <ClubAnnouncementsScreen profile={profile} onBack={() => setOverlay(null)} />
        ) : null}
      </PushScreenTransition>
      <PushScreenTransition active={overlay === 'roster'}>
        {overlay === 'roster' ? (
          <PlayersListScreen onBack={() => setOverlay(null)} onSelectPlayer={() => undefined} />
        ) : null}
      </PushScreenTransition>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  loader: { marginTop: 40 },
  scroll: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 6,
  },
  teamHeroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  crestContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestImg: {
    width: 44,
    height: 44,
  },
  heroMetaCol: {
    flex: 1,
    gap: 2,
  },
  heroTeamName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSubMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  licenseBadgeRow: {
    marginTop: 4,
  },
  licensePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  licenseText: {
    fontSize: 10,
    fontWeight: '800',
  },
  seasonStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLbl: {
    fontSize: 9.5,
    color: '#71717A',
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionKicker: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  smallBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  noClubCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  noClubTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  noClubSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  noClubBtnCol: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  noClubPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  noClubPrimaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#000000',
  },
  noClubSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  noClubSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  rosterCard: {
    backgroundColor: colors.backgroundAlt,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  rosterCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rosterCardDesc: {
    fontSize: 12,
    color: '#8B8B9A',
    lineHeight: 16,
  },
  rosterOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  rosterOpenBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  staffIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMetaCol: {
    flex: 1,
    gap: 2,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  staffRole: {
    fontSize: 11,
    color: '#8B8B9A',
    fontWeight: '600',
  },
  staffMsgBtn: {
    padding: 8,
  },
  emptyAnnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.backgroundAlt,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  emptyAnnText: {
    fontSize: 12,
    color: '#8B8B9A',
    fontWeight: '600',
    flex: 1,
  },
  annList: {
    gap: 8,
  },
  annCard: {
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  annHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  annPriorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EF444455',
  },
  annPriorityText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  annDateText: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '600',
  },
  annTitleText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  annBodyText: {
    fontSize: 11.5,
    color: '#9CA3AF',
    lineHeight: 16,
  },
});


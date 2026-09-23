import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableSpring } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import type { User } from '../models/User';
import { usersService } from '../services/users.service';
import { membershipsService } from '../services/memberships.service';
import type { Membership } from '../models/Membership';
import {
  TEAM_STAFF_ROLE_LABELS,
  type TeamStaffMember,
  type TeamStaffRole,
} from '../models/TeamStaffMember';
import { teamStaffService } from '../services/teamStaff.service';
import { clubsService } from '../services/clubs.service';
import type { Club } from '../models/Club';
import { isOrganizerCapable } from '../utils/roleCapabilities';
import { useAuth } from '../context/AuthContext';
import { JoinClubScreen } from './JoinClubScreen';
import { proForm, proRadius, proSemantic } from '../theme/professionalDesign';
import { withAlpha, type CoachThemeTokens } from '../utils/coachTeamTheme';
import { useCoachTheme } from '../features/coach/shell/CoachThemeContext';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';

export type TeamAdminTab = 'identite' | 'staff' | 'licences' | 'invitations' | 'parametres';

interface TeamManagementScreenProps {
  profile: User;
  onBack: () => void;
}

interface TeamIdentityData {
  teamName: string;
  category: string;
  season: string;
  division: string;
  homeVenue: string;
  pitchType: string;
  homeColor: string;
  awayColor: string;
}

interface TeamSettingsData {
  lineupVisibility: 'immediate' | 'h2' | 'h24';
  rsvpDeadlineHours: 48 | 24 | 12;
  attendanceRule: 'strict' | 'open';
  autoReminders: boolean;
  guardianAlerts: boolean;
}

export const TeamManagementScreen: React.FC<TeamManagementScreenProps> = ({
  profile,
  onBack,
}) => {
  const { isAdmin } = useAuth();
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const clubId = profile.profile.club_id;
  const canManageRoster = isOrganizerCapable(profile.role) || isAdmin;

  const [tab, setTab] = useState<TeamAdminTab>('identite');
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [pendingMemberships, setPendingMemberships] = useState<Membership[]>([]);
  const [staff, setStaff] = useState<TeamStaffMember[]>([]);

  // Identity state
  const [identity, setIdentity] = useState<TeamIdentityData>({
    teamName: 'Équipe Première Seniors',
    category: 'Seniors',
    season: '2026 / 2027',
    division: 'Régional 1',
    homeVenue: 'Stade Municipal',
    pitchType: 'Pelouse naturelle',
    homeColor: 'Vert émeraude',
    awayColor: 'Blanc & Or',
  });
  const [identitySaved, setIdentitySaved] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<TeamSettingsData>({
    lineupVisibility: 'h2',
    rsvpDeadlineHours: 24,
    attendanceRule: 'strict',
    autoReminders: true,
    guardianAlerts: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Staff form state
  const [staffName, setStaffName] = useState('');
  const [staffUid, setStaffUid] = useState('');
  const [staffRole, setStaffRole] = useState<TeamStaffRole>('assistant');
  const [addingStaff, setAddingStaff] = useState(false);

  // Search & Invite state
  const [playerSearch, setPlayerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invitingUid, setInvitingUid] = useState<string | null>(null);

  // Licenses filter & Modals
  const [licenseFilter, setLicenseFilter] = useState<'all' | 'attention' | 'minors' | 'verified'>('all');
  const [jerseyModalPlayer, setJerseyModalPlayer] = useState<User | null>(null);
  const [jerseyInputValue, setJerseyInputValue] = useState('');
  const [guardianModalPlayer, setGuardianModalPlayer] = useState<User | null>(null);
  const [customJerseys, setCustomJerseys] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clubData, membersList, pending, staffRows] = await Promise.all([
        clubId ? clubsService.getById(clubId) : Promise.resolve(null),
        clubId ? usersService.listMembersByClubId(clubId) : Promise.resolve([]),
        clubId && canManageRoster
          ? membershipsService.listByClub(clubId, 'pending')
          : Promise.resolve([]),
        clubId ? teamStaffService.listForClub(clubId) : Promise.resolve([]),
      ]);

      setClub(clubData);
      setMembers(membersList);
      setPendingMemberships(pending);
      setStaff(staffRows);

      if (clubId) {
        // Load persisted identity
        const savedId = await AsyncStorage.getItem(`@proday:team_identity:${clubId}`);
        if (savedId) {
          try {
            setIdentity(JSON.parse(savedId));
          } catch {}
        } else if (clubData) {
          setIdentity((prev) => ({
            ...prev,
            teamName: clubData.name ? `${clubData.name} - Équipe 1` : prev.teamName,
            division: clubData.fff_division_label || prev.division,
            season: clubData.fff_season || prev.season,
            homeVenue: clubData.city ? `Stade de ${clubData.city}` : prev.homeVenue,
          }));
        }

        // Load persisted settings
        const savedSet = await AsyncStorage.getItem(`@proday:team_settings:${clubId}`);
        if (savedSet) {
          try {
            setSettings(JSON.parse(savedSet));
          } catch {}
        }

        // Load custom jersey numbers
        const savedJerseys = await AsyncStorage.getItem(`@proday:player_jerseys:${clubId}`);
        if (savedJerseys) {
          try {
            setCustomJerseys(JSON.parse(savedJerseys));
          } catch {}
        }
      }
    } finally {
      setLoading(false);
    }
  }, [clubId, canManageRoster]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveIdentity = async () => {
    if (!clubId) return;
    try {
      await AsyncStorage.setItem(`@proday:team_identity:${clubId}`, JSON.stringify(identity));
      setIdentitySaved(true);
      setTimeout(() => setIdentitySaved(false), 2500);
      Alert.alert('Identité enregistrée', 'Les informations officielles de l’équipe ont été mises à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder l’identité.');
    }
  };

  const handleSaveSettings = async () => {
    if (!clubId) return;
    try {
      await AsyncStorage.setItem(`@proday:team_settings:${clubId}`, JSON.stringify(settings));
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      Alert.alert('Paramètres enregistrés', 'Les règles de fonctionnement de l’équipe sont mises à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres.');
    }
  };

  const handleAddStaff = async () => {
    if (!clubId || !staffUid.trim() || !staffName.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir le nom et l’identifiant ProDay du membre de staff.');
      return;
    }
    setAddingStaff(true);
    try {
      await teamStaffService.add({
        club_id: clubId,
        uid: staffUid.trim(),
        display_name: staffName.trim(),
        staff_role: staffRole,
      });
      setStaffUid('');
      setStaffName('');
      setStaff(await teamStaffService.listForClub(clubId));
      Alert.alert('Staff affecté', `${staffName.trim()} a été rattaché à l’équipe comme ${TEAM_STAFF_ROLE_LABELS[staffRole]}.`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’ajouter le membre de staff.');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleRemoveStaff = (staffMember: TeamStaffMember) => {
    Alert.alert(
      'Retirer du staff',
      `Confirmez-vous le retrait de ${staffMember.display_name} (${TEAM_STAFF_ROLE_LABELS[staffMember.staff_role]}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await teamStaffService.remove(staffMember.id);
              if (clubId) setStaff(await teamStaffService.listForClub(clubId));
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
            }
          },
        },
      ],
    );
  };

  const handleMembershipDecision = async (membershipId: string, approve: boolean) => {
    try {
      if (approve) {
        await membershipsService.approve(membershipId, profile.uid);
      } else {
        await membershipsService.reject(membershipId, profile.uid);
      }
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  const searchPlayers = async () => {
    if (!playerSearch.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const players = await usersService.listPlayers(playerSearch.trim());
      const memberUids = new Set(members.map((m) => m.uid));
      const pendingUids = new Set(pendingMemberships.map((m) => m.player_uid));
      setSearchResults(
        players.filter((p) => !memberUids.has(p.uid) && !pendingUids.has(p.uid)).slice(0, 8),
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInvitePlayer = async (player: User) => {
    if (!clubId) return;
    setInvitingUid(player.uid);
    try {
      await membershipsService.invitePlayer({
        club_id: clubId,
        player_uid: player.uid,
        player_name: player.display_name,
        invited_by_uid: profile.uid,
      });
      Alert.alert('Invitation transmise', `${player.display_name} a reçu une notification d’invitation à rejoindre l’équipe.`);
      setPlayerSearch('');
      setSearchResults([]);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Invitation impossible.');
    } finally {
      setInvitingUid(null);
    }
  };

  const handleShareInvite = async () => {
    if (!clubId) return;
    try {
      await Share.share({
        title: `Rejoindre ${identity.teamName}`,
        message: `Rejoignez l'équipe ${identity.teamName} (${identity.category}) sur l'application ProDay !\nCode d'équipe : ${clubId}\nLien direct : https://proday75.fr/club/${clubId}`,
      });
    } catch {}
  };

  const handleSaveJerseyNumber = async () => {
    if (!jerseyModalPlayer || !clubId) return;
    const num = parseInt(jerseyInputValue.trim(), 10);
    if (isNaN(num) || num < 1 || num > 99) {
      Alert.alert('Numéro invalide', 'Le numéro de maillot doit être compris entre 1 et 99.');
      return;
    }
    const updated = { ...customJerseys, [jerseyModalPlayer.uid]: num };
    setCustomJerseys(updated);
    await AsyncStorage.setItem(`@proday:player_jerseys:${clubId}`, JSON.stringify(updated));
    setJerseyModalPlayer(null);
    setJerseyInputValue('');
  };

  // Administrative vigilance indicators
  const vigilance = useMemo(() => {
    let missingLicenses = 0;
    let unassignedJerseys = 0;
    let pendingCerts = 0;
    let minorCount = 0;

    for (const m of members) {
      const hasLic = m.verification_status === 'VERIFIED' || Boolean(m.profile?.license_number);
      if (!hasLic) missingLicenses += 1;
      const jersey = customJerseys[m.uid] ?? m.profile?.jersey_number;
      if (!jersey) unassignedJerseys += 1;
      const isMinor = m.profile?.gender === 'minor' || (m.profile?.age && m.profile.age < 18);
      if (isMinor) minorCount += 1;
    }

    return {
      missingLicenses,
      unassignedJerseys,
      pendingCerts,
      minorCount,
      pendingRequests: pendingMemberships.length,
      totalIssues: missingLicenses + unassignedJerseys + pendingMemberships.length,
    };
  }, [members, pendingMemberships, customJerseys]);

  const filteredMembers = useMemo(() => {
    if (licenseFilter === 'attention') {
      return members.filter((m) => {
        const noLic = m.verification_status !== 'VERIFIED' && !m.profile?.license_number;
        const noNum = !(customJerseys[m.uid] ?? m.profile?.jersey_number);
        return noLic || noNum;
      });
    }
    if (licenseFilter === 'minors') {
      return members.filter((m) => m.profile?.gender === 'minor' || (m.profile?.age && m.profile.age < 18));
    }
    if (licenseFilter === 'verified') {
      return members.filter((m) => m.verification_status === 'VERIFIED' || Boolean(m.profile?.license_number));
    }
    return members;
  }, [members, licenseFilter, customJerseys]);

  const joinAsRoot = !clubId;

  return (
    <>
      {joinAsRoot ? (
        <JoinClubScreen
          profile={profile}
          onBack={onBack}
          onJoined={() => void load()}
        />
      ) : (
        <View style={styles.root}>
          {/* Header */}
          <View style={styles.headerRow}>
            <PressableSpring
              style={styles.backBtn}
              onPress={onBack}
              scaleTo={0.92}
              haptic
            >
              <Ionicons name="arrow-back" size={20} color={tokens.foreground} />
            </PressableSpring>
            <View style={styles.headerTitles}>
              <ProDayText variant="title" style={styles.headerMainTitle}>
                {identity.teamName}
              </ProDayText>
              <ProDayText variant="caption" style={styles.headerSub}>
                {club?.name ? `${club.name} · ` : ''}{identity.category} · {identity.division}
              </ProDayText>
            </View>
            <PressableSpring
              style={styles.shareHeaderBtn}
              onPress={() => void handleShareInvite()}
              scaleTo={0.92}
              haptic
            >
              <Ionicons name="share-outline" size={18} color={tokens.accent} />
            </PressableSpring>
          </View>

          {/* Attention & Vigilance Summary Pill */}
          {vigilance.totalIssues > 0 ? (
            <View style={styles.vigilanceBanner}>
              <View style={styles.vigilanceHeader}>
                <Ionicons name="alert-circle" size={16} color={proSemantic.warning} />
                <ProDayText variant="caption" style={styles.vigilanceTitle}>
                  {vigilance.totalIssues} point{vigilance.totalIssues > 1 ? 's' : ''} administratif{vigilance.totalIssues > 1 ? 's' : ''} à régulariser
                </ProDayText>
              </View>
              <View style={styles.vigilanceChipsRow}>
                {vigilance.pendingRequests > 0 ? (
                  <TouchableOpacity
                    style={styles.vigilanceChip}
                    onPress={() => setTab('invitations')}
                    activeOpacity={0.8}
                  >
                    <Feather name="user-plus" size={11} color={proSemantic.info} />
                    <ProDayText variant="caption" style={styles.vigilanceChipText}>
                      {vigilance.pendingRequests} adhésion{vigilance.pendingRequests > 1 ? 's' : ''}
                    </ProDayText>
                  </TouchableOpacity>
                ) : null}
                {vigilance.missingLicenses > 0 ? (
                  <TouchableOpacity
                    style={styles.vigilanceChip}
                    onPress={() => { setTab('licences'); setLicenseFilter('attention'); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="card-outline" size={11} color={proSemantic.warning} />
                    <ProDayText variant="caption" style={styles.vigilanceChipText}>
                      {vigilance.missingLicenses} licence{vigilance.missingLicenses > 1 ? 's' : ''} FFF
                    </ProDayText>
                  </TouchableOpacity>
                ) : null}
                {vigilance.unassignedJerseys > 0 ? (
                  <TouchableOpacity
                    style={styles.vigilanceChip}
                    onPress={() => { setTab('licences'); setLicenseFilter('attention'); }}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="tshirt-crew-outline" size={11} color={tokens.muted} />
                    <ProDayText variant="caption" style={styles.vigilanceChipText}>
                      {vigilance.unassignedJerseys} maillot{vigilance.unassignedJerseys > 1 ? 's' : ''}
                    </ProDayText>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.conformityBanner}>
              <Ionicons name="checkmark-circle" size={15} color={proSemantic.success} />
              <ProDayText variant="caption" style={styles.conformityBannerText}>
                Dossiers d'équipe et affiliations à jour
              </ProDayText>
            </View>
          )}

          {/* Tab Navigation */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              <PressableSpring
                style={[styles.tabPill, tab === 'identite' && styles.tabPillActive]}
                onPress={() => setTab('identite')}
                scaleTo={0.96}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color={tab === 'identite' ? tokens.onAccent : tokens.muted}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.tabPillText, tab === 'identite' && styles.tabPillTextActive]}
                >
                  Identité
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                style={[styles.tabPill, tab === 'staff' && styles.tabPillActive]}
                onPress={() => setTab('staff')}
                scaleTo={0.96}
              >
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={tab === 'staff' ? tokens.onAccent : tokens.muted}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.tabPillText, tab === 'staff' && styles.tabPillTextActive]}
                >
                  Staff ({staff.length})
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                style={[styles.tabPill, tab === 'licences' && styles.tabPillActive]}
                onPress={() => setTab('licences')}
                scaleTo={0.96}
              >
                <Ionicons
                  name="card-outline"
                  size={14}
                  color={tab === 'licences' ? tokens.onAccent : tokens.muted}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.tabPillText, tab === 'licences' && styles.tabPillTextActive]}
                >
                  Licences ({members.length})
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                style={[styles.tabPill, tab === 'invitations' && styles.tabPillActive]}
                onPress={() => setTab('invitations')}
                scaleTo={0.96}
              >
                <Ionicons
                  name="person-add-outline"
                  size={14}
                  color={tab === 'invitations' ? tokens.onAccent : tokens.muted}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.tabPillText, tab === 'invitations' && styles.tabPillTextActive]}
                >
                  Invitations {pendingMemberships.length > 0 ? `(${pendingMemberships.length})` : ''}
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                style={[styles.tabPill, tab === 'parametres' && styles.tabPillActive]}
                onPress={() => setTab('parametres')}
                scaleTo={0.96}
              >
                <Ionicons
                  name="settings-outline"
                  size={14}
                  color={tab === 'parametres' ? tokens.onAccent : tokens.muted}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.tabPillText, tab === 'parametres' && styles.tabPillTextActive]}
                >
                  Paramètres
                </ProDayText>
              </PressableSpring>
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CONTENT_INSET + 32 }]}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={tokens.accent} size="large" />
                <ProDayText variant="caption" style={styles.loadingText}>
                  Chargement des données administratives...
                </ProDayText>
              </View>
            ) : null}

            {/* TAB 1: IDENTITE */}
            {!loading && tab === 'identite' ? (
              <View style={styles.tabSectionWrap}>
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="shield-checkmark" size={16} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.cardSectionTitle}>
                      Fiche officielle de l'équipe
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.cardBodyText}>
                    Coordonnées officielles, catégorie sportive, terrain principal et couleurs homologuées.
                  </ProDayText>

                  <View style={styles.formGroup}>
                    <ProDayText variant="caption" style={styles.formLabel}>
                      Nom officiel de l'équipe
                    </ProDayText>
                    <TextInput
                      style={styles.formInput}
                      value={identity.teamName}
                      onChangeText={(t) => setIdentity((p) => ({ ...p, teamName: t }))}
                      placeholder="Ex: ProDay FC Seniors A"
                      placeholderTextColor={tokens.muted}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <ProDayText variant="caption" style={styles.formLabel}>
                        Catégorie d'âge
                      </ProDayText>
                      <TextInput
                        style={styles.formInput}
                        value={identity.category}
                        onChangeText={(t) => setIdentity((p) => ({ ...p, category: t }))}
                        placeholder="Seniors, U19, U17..."
                        placeholderTextColor={tokens.muted}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <ProDayText variant="caption" style={styles.formLabel}>
                        Saison sportive
                      </ProDayText>
                      <TextInput
                        style={styles.formInput}
                        value={identity.season}
                        onChangeText={(t) => setIdentity((p) => ({ ...p, season: t }))}
                        placeholder="2026 / 2027"
                        placeholderTextColor={tokens.muted}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <ProDayText variant="caption" style={styles.formLabel}>
                      Championnat / Division / Niveau
                    </ProDayText>
                    <TextInput
                      style={styles.formInput}
                      value={identity.division}
                      onChangeText={(t) => setIdentity((p) => ({ ...p, division: t }))}
                      placeholder="Régional 1, Départemental 1, National 3..."
                      placeholderTextColor={tokens.muted}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1.4 }]}>
                      <ProDayText variant="caption" style={styles.formLabel}>
                        Stade / Terrain principal
                      </ProDayText>
                      <TextInput
                        style={styles.formInput}
                        value={identity.homeVenue}
                        onChangeText={(t) => setIdentity((p) => ({ ...p, homeVenue: t }))}
                        placeholder="Nom du stade ou complexe"
                        placeholderTextColor={tokens.muted}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <ProDayText variant="caption" style={styles.formLabel}>
                        Type de surface
                      </ProDayText>
                      <TextInput
                        style={styles.formInput}
                        value={identity.pitchType}
                        onChangeText={(t) => setIdentity((p) => ({ ...p, pitchType: t }))}
                        placeholder="Pelouse / Synthétique"
                        placeholderTextColor={tokens.muted}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <ProDayText variant="caption" style={styles.formLabel}>
                        Couleur Domicile
                      </ProDayText>
                      <TextInput
                        style={styles.formInput}
                        value={identity.homeColor}
                        onChangeText={(t) => setIdentity((p) => ({ ...p, homeColor: t }))}
                        placeholder="Vert / Blanc"
                        placeholderTextColor={tokens.muted}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <ProDayText variant="caption" style={styles.formLabel}>
                        Couleur Extérieur
                      </ProDayText>
                      <TextInput
                        style={styles.formInput}
                        value={identity.awayColor}
                        onChangeText={(t) => setIdentity((p) => ({ ...p, awayColor: t }))}
                        placeholder="Noir / Or"
                        placeholderTextColor={tokens.muted}
                      />
                    </View>
                  </View>

                  {/* FFF Federation Details */}
                  <View style={styles.federationBox}>
                    <View style={styles.federationHeader}>
                      <Ionicons name="ribbon-outline" size={14} color={proSemantic.info} />
                      <ProDayText variant="caption" style={styles.federationTitle}>
                        Affiliation Fédérale FFF
                      </ProDayText>
                    </View>
                    <View style={styles.federationRow}>
                      <ProDayText variant="caption" style={styles.federationLabel}>
                        N° Affiliation Club :
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.federationVal}>
                        {club?.fff_affiliation_number || 'Non renseigné (amateur)'}
                      </ProDayText>
                    </View>
                    <View style={styles.federationRow}>
                      <ProDayText variant="caption" style={styles.federationLabel}>
                        Ligue / District :
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.federationVal}>
                        {[club?.fff_district_code, club?.fff_league_id].filter(Boolean).join(' · ') || 'Rattachement automatique'}
                      </ProDayText>
                    </View>
                  </View>

                  <PressableSpring
                    style={[styles.primaryActionBtn, { backgroundColor: tokens.accent }]}
                    onPress={() => void handleSaveIdentity()}
                    scaleTo={0.97}
                    haptic
                  >
                    <Ionicons name="checkmark-sharp" size={16} color={tokens.onAccent} />
                    <ProDayText variant="section" style={[styles.primaryActionBtnText, { color: tokens.onAccent }]}>
                      {identitySaved ? 'Modifications enregistrées !' : 'Enregistrer la fiche d\'équipe'}
                    </ProDayText>
                  </PressableSpring>
                </View>
              </View>
            ) : null}

            {/* TAB 2: STAFF */}
            {!loading && tab === 'staff' ? (
              <View style={styles.tabSectionWrap}>
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="briefcase" size={16} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.cardSectionTitle}>
                      Encadrement & Staff technique ({staff.length})
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.cardBodyText}>
                    Responsables, adjoints, préparateurs et staff médical habilités sur l'équipe.
                  </ProDayText>

                  {staff.map((s) => (
                    <View key={s.id} style={styles.staffMemberRow}>
                      <View style={styles.staffAvatar}>
                        <Ionicons
                          name={
                            s.staff_role === 'coach'
                              ? 'person'
                              : s.staff_role === 'physio'
                              ? 'medkit-outline'
                              : s.staff_role === 'analyst'
                              ? 'videocam-outline'
                              : 'people-outline'
                          }
                          size={16}
                          color={tokens.accent}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ProDayText variant="section" style={styles.rowTitle}>
                          {s.display_name}
                        </ProDayText>
                        <View style={styles.staffRolePill}>
                          <ProDayText variant="caption" style={styles.staffRolePillText}>
                            {TEAM_STAFF_ROLE_LABELS[s.staff_role]}
                          </ProDayText>
                        </View>
                      </View>
                      {canManageRoster ? (
                        <TouchableOpacity
                          style={styles.staffRemoveBtn}
                          onPress={() => handleRemoveStaff(s)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={proSemantic.danger} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}

                  {staff.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <ProDayText variant="caption" style={styles.emptyText}>
                        Aucun membre de staff technique affecté pour le moment.
                      </ProDayText>
                    </View>
                  ) : null}

                  {canManageRoster ? (
                    <View style={styles.addStaffBox}>
                      <ProDayText variant="section" style={styles.addStaffTitle}>
                        Affecter un nouveau membre
                      </ProDayText>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Nom complet ou prénom..."
                        placeholderTextColor={tokens.muted}
                        value={staffName}
                        onChangeText={setStaffName}
                      />
                      <TextInput
                        style={styles.formInput}
                        placeholder="Identifiant ProDay (UID ou e-mail)..."
                        placeholderTextColor={tokens.muted}
                        value={staffUid}
                        onChangeText={setStaffUid}
                      />
                      <View style={styles.rolePickerRow}>
                        {(['coach', 'assistant', 'physio', 'analyst'] as TeamStaffRole[]).map((r) => (
                          <TouchableOpacity
                            key={r}
                            style={[
                              styles.rolePickerChip,
                              staffRole === r && styles.rolePickerChipActive,
                            ]}
                            onPress={() => setStaffRole(r)}
                          >
                            <ProDayText
                              variant="caption"
                              style={[
                                styles.rolePickerChipText,
                                staffRole === r && styles.rolePickerChipTextActive,
                              ]}
                            >
                              {TEAM_STAFF_ROLE_LABELS[r]}
                            </ProDayText>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <PressableSpring
                        style={[styles.primaryActionBtn, { backgroundColor: tokens.accent }]}
                        onPress={() => void handleAddStaff()}
                        disabled={addingStaff}
                        scaleTo={0.97}
                        haptic
                      >
                        {addingStaff ? (
                          <ActivityIndicator size="small" color={tokens.onAccent} />
                        ) : (
                          <>
                            <Ionicons name="person-add" size={15} color={tokens.onAccent} />
                            <ProDayText variant="section" style={[styles.primaryActionBtnText, { color: tokens.onAccent }]}>
                              Affecter à l'équipe
                            </ProDayText>
                          </>
                        )}
                      </PressableSpring>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* TAB 3: LICENCES & DOSSIERS */}
            {!loading && tab === 'licences' ? (
              <View style={styles.tabSectionWrap}>
                {/* Filter chips */}
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, licenseFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setLicenseFilter('all')}
                  >
                    <ProDayText variant="caption" style={[styles.filterChipText, licenseFilter === 'all' && styles.filterChipTextActive]}>
                      Tous ({members.length})
                    </ProDayText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, licenseFilter === 'attention' && styles.filterChipActive]}
                    onPress={() => setLicenseFilter('attention')}
                  >
                    <ProDayText variant="caption" style={[styles.filterChipText, licenseFilter === 'attention' && styles.filterChipTextActive]}>
                      À régulariser ({vigilance.missingLicenses + vigilance.unassignedJerseys})
                    </ProDayText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, licenseFilter === 'minors' && styles.filterChipActive]}
                    onPress={() => setLicenseFilter('minors')}
                  >
                    <ProDayText variant="caption" style={[styles.filterChipText, licenseFilter === 'minors' && styles.filterChipTextActive]}>
                      Mineurs ({vigilance.minorCount})
                    </ProDayText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, licenseFilter === 'verified' && styles.filterChipActive]}
                    onPress={() => setLicenseFilter('verified')}
                  >
                    <ProDayText variant="caption" style={[styles.filterChipText, licenseFilter === 'verified' && styles.filterChipTextActive]}>
                      Conformes ({members.length - vigilance.missingLicenses})
                    </ProDayText>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="card" size={16} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.cardSectionTitle}>
                      Effectif licencié & Conformité ({filteredMembers.length})
                    </ProDayText>
                  </View>

                  {filteredMembers.map((m) => {
                    const jersey = customJerseys[m.uid] ?? m.profile?.jersey_number;
                    const hasLic = m.verification_status === 'VERIFIED' || Boolean(m.profile?.license_number);
                    const isMinor = m.profile?.gender === 'minor' || (m.profile?.age && m.profile.age < 18);

                    return (
                      <View key={m.uid} style={styles.playerAdminRow}>
                        <TouchableOpacity
                          style={styles.jerseyBadge}
                          onPress={() => {
                            setJerseyModalPlayer(m);
                            setJerseyInputValue(jersey ? String(jersey) : '');
                          }}
                        >
                          <ProDayText variant="section" style={styles.jerseyBadgeText}>
                            {jersey ? `#${jersey}` : '—'}
                          </ProDayText>
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                          <View style={styles.playerNameRow}>
                            <ProDayText variant="section" style={styles.rowTitle}>
                              {m.display_name}
                            </ProDayText>
                            {isMinor ? (
                              <TouchableOpacity
                                style={styles.minorTag}
                                onPress={() => setGuardianModalPlayer(m)}
                              >
                                <ProDayText variant="caption" style={styles.minorTagText}>
                                  Mineur · Parent
                                </ProDayText>
                              </TouchableOpacity>
                            ) : null}
                          </View>

                          <ProDayText variant="caption" style={styles.rowSub}>
                            {[m.profile?.position, m.profile?.category].filter(Boolean).join(' · ') || 'Poste non renseigné'}
                          </ProDayText>

                          <View style={styles.playerMetaRow}>
                            <View style={[styles.statusBadge, hasLic ? styles.statusBadgeOk : styles.statusBadgeWarn]}>
                              <Ionicons
                                name={hasLic ? 'checkmark-circle' : 'alert-circle'}
                                size={11}
                                color={hasLic ? proSemantic.success : proSemantic.warning}
                              />
                              <ProDayText
                                variant="caption"
                                style={[styles.statusBadgeText, { color: hasLic ? proSemantic.success : proSemantic.warning }]}
                              >
                                {m.profile?.license_number ? `Lic. ${m.profile.license_number}` : hasLic ? 'Licence FFF validée' : 'Licence manquante'}
                              </ProDayText>
                            </View>

                            <View style={[styles.statusBadge, styles.statusBadgeOk]}>
                              <Ionicons name="medkit-outline" size={11} color={proSemantic.success} />
                              <ProDayText variant="caption" style={[styles.statusBadgeText, { color: proSemantic.success }]}>
                                Médical OK
                              </ProDayText>
                            </View>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.editJerseyBtn}
                          onPress={() => {
                            setJerseyModalPlayer(m);
                            setJerseyInputValue(jersey ? String(jersey) : '');
                          }}

                          accessibilityRole="button"
                          accessibilityLabel="Modifier">
                          <MaterialCommunityIcons name="pencil-outline" size={16} color={tokens.muted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {filteredMembers.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <ProDayText variant="caption" style={styles.emptyText}>
                        Aucun joueur ne correspond au filtre sélectionné.
                      </ProDayText>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* TAB 4: INVITATIONS & ADHESIONS */}
            {!loading && tab === 'invitations' ? (
              <View style={styles.tabSectionWrap}>
                {/* Pending Requests */}
                {pendingMemberships.length > 0 ? (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Ionicons name="time" size={16} color={proSemantic.warning} />
                      <ProDayText variant="section" style={styles.cardSectionTitle}>
                        Demandes d'adhésion en attente ({pendingMemberships.length})
                      </ProDayText>
                    </View>
                    <ProDayText variant="caption" style={styles.cardBodyText}>
                      Ces joueurs ont sollicité leur affiliation officielle à votre équipe.
                    </ProDayText>

                    {pendingMemberships.map((m) => (
                      <View key={m.id} style={styles.pendingRow}>
                        <View style={{ flex: 1 }}>
                          <ProDayText variant="section" style={styles.rowTitle}>
                            {m.player_name}
                          </ProDayText>
                          <ProDayText variant="caption" style={styles.rowSub}>
                            Demandé le {m.requested_at.toLocaleDateString('fr-FR')}
                          </ProDayText>
                        </View>
                        <View style={styles.pendingActionBtns}>
                          <PressableSpring
                            style={[styles.actionBtnApprove, { backgroundColor: tokens.accent }]}
                            onPress={() => void handleMembershipDecision(m.id, true)}
                            scaleTo={0.95}
                            haptic
                          >
                            <ProDayText variant="caption" style={[styles.actionBtnApproveText, { color: tokens.onAccent }]}>
                              Accepter
                            </ProDayText>
                          </PressableSpring>
                          <PressableSpring
                            style={styles.actionBtnReject}
                            onPress={() => void handleMembershipDecision(m.id, false)}
                            scaleTo={0.95}
                            haptic
                          >
                            <ProDayText variant="caption" style={styles.actionBtnRejectText}>
                              Refuser
                            </ProDayText>
                          </PressableSpring>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Invite existing user */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="search" size={16} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.cardSectionTitle}>
                      Inviter un joueur ProDay
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.cardBodyText}>
                    Recherchez un joueur inscrit sur la plateforme pour lui transmettre une invitation directe.
                  </ProDayText>

                  <View style={styles.searchRow}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Nom, prénom ou poste du joueur..."
                      placeholderTextColor={tokens.muted}
                      value={playerSearch}
                      onChangeText={setPlayerSearch}
                      onSubmitEditing={() => void searchPlayers()}
                      returnKeyType="search"
                    />
                    <PressableSpring
                      style={[styles.searchBtn, { backgroundColor: tokens.accent }]}
                      onPress={() => void searchPlayers()}
                      disabled={searchLoading}
                      scaleTo={0.95}
                      haptic
                    >
                      {searchLoading ? (
                        <ActivityIndicator size="small" color={tokens.onAccent} />
                      ) : (
                        <ProDayText variant="caption" style={[styles.searchBtnText, { color: tokens.onAccent }]}>
                          Chercher
                        </ProDayText>
                      )}
                    </PressableSpring>
                  </View>

                  {searchResults.map((player) => (
                    <View key={player.uid} style={styles.searchResultItem}>
                      <View style={{ flex: 1 }}>
                        <ProDayText variant="section" style={styles.rowTitle}>
                          {player.display_name}
                        </ProDayText>
                        <ProDayText variant="caption" style={styles.rowSub}>
                          {[player.profile?.position, player.city].filter(Boolean).join(' · ')}
                        </ProDayText>
                      </View>
                      <PressableSpring
                        style={[styles.inviteBtn, { backgroundColor: tokens.accent }]}
                        onPress={() => void handleInvitePlayer(player)}
                        disabled={invitingUid === player.uid}
                        scaleTo={0.95}
                        haptic
                      >
                        <ProDayText variant="caption" style={[styles.inviteBtnText, { color: tokens.onAccent }]}>
                          {invitingUid === player.uid ? 'Envoi...' : 'Inviter'}
                        </ProDayText>
                      </PressableSpring>
                    </View>
                  ))}
                </View>

                {/* Shareable Team Link */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="share-social-outline" size={16} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.cardSectionTitle}>
                      Lien d'invitation partageable
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.cardBodyText}>
                    Diffusez le code d'équipe officiel par SMS, WhatsApp ou e-mail pour permettre aux joueurs de rejoindre le groupe.
                  </ProDayText>
                  <View style={styles.codeDisplayBox}>
                    <ProDayText variant="caption" style={styles.codeLabel}>
                      Code d'équipe unique :
                    </ProDayText>
                    <ProDayText variant="section" style={[styles.codeValue, { color: tokens.accent }]}>
                      {clubId || 'PRODAY-CLUB'}
                    </ProDayText>
                  </View>
                  <PressableSpring
                    style={[styles.primaryActionBtn, { backgroundColor: tokens.accent }]}
                    onPress={() => void handleShareInvite()}
                    scaleTo={0.97}
                    haptic
                  >
                    <Ionicons name="share-outline" size={16} color={tokens.onAccent} />
                    <ProDayText variant="section" style={[styles.primaryActionBtnText, { color: tokens.onAccent }]}>
                      Partager le lien de l'équipe
                    </ProDayText>
                  </PressableSpring>
                </View>
              </View>
            ) : null}

            {/* TAB 5: PARAMETRES & REGLES */}
            {!loading && tab === 'parametres' ? (
              <View style={styles.tabSectionWrap}>
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="settings" size={16} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.cardSectionTitle}>
                      Règles de fonctionnement & Permissions
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.cardBodyText}>
                    Définissez la politique sportive de l'équipe concernant les compositions, les convocations et les contacts.
                  </ProDayText>

                  {/* Lineup Visibility */}
                  <View style={styles.settingGroup}>
                    <ProDayText variant="section" style={styles.settingTitle}>
                      Visibilité de la composition de match
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.settingSub}>
                      Moment où les titulaires et remplaçants deviennent visibles des joueurs.
                    </ProDayText>
                    <View style={styles.settingOptionsRow}>
                      {[
                        { id: 'immediate', label: 'Immédiate' },
                        { id: 'h2', label: 'H-2 (Match)' },
                        { id: 'h24', label: 'H-24' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.settingOptionChip,
                            settings.lineupVisibility === opt.id && styles.settingOptionChipActive,
                          ]}
                          onPress={() => setSettings((p) => ({ ...p, lineupVisibility: opt.id as any }))}
                        >
                          <ProDayText
                            variant="caption"
                            style={[
                              styles.settingOptionText,
                              settings.lineupVisibility === opt.id && styles.settingOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </ProDayText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* RSVP Deadline */}
                  <View style={styles.settingGroup}>
                    <ProDayText variant="section" style={styles.settingTitle}>
                      Délai limite de réponse aux convocations
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.settingSub}>
                      Clôture automatique des confirmations de présence des joueurs.
                    </ProDayText>
                    <View style={styles.settingOptionsRow}>
                      {[
                        { val: 48, label: '48 heures avant' },
                        { val: 24, label: '24 heures avant' },
                        { val: 12, label: '12 heures avant' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.val}
                          style={[
                            styles.settingOptionChip,
                            settings.rsvpDeadlineHours === opt.val && styles.settingOptionChipActive,
                          ]}
                          onPress={() => setSettings((p) => ({ ...p, rsvpDeadlineHours: opt.val as any }))}
                        >
                          <ProDayText
                            variant="caption"
                            style={[
                              styles.settingOptionText,
                              settings.rsvpDeadlineHours === opt.val && styles.settingOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </ProDayText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Attendance rule */}
                  <View style={styles.settingGroup}>
                    <ProDayText variant="section" style={styles.settingTitle}>
                      Pointage des présences aux entraînements
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.settingSub}>
                      Contrôle des présences sur le terrain.
                    </ProDayText>
                    <View style={styles.settingOptionsRow}>
                      {[
                        { id: 'strict', label: 'Staff officiel uniquement' },
                        { id: 'open', label: 'Auto-déclaration joueur autorisée' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.settingOptionChip,
                            settings.attendanceRule === opt.id && styles.settingOptionChipActive,
                          ]}
                          onPress={() => setSettings((p) => ({ ...p, attendanceRule: opt.id as any }))}
                        >
                          <ProDayText
                            variant="caption"
                            style={[
                              styles.settingOptionText,
                              settings.attendanceRule === opt.id && styles.settingOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </ProDayText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Guardian & Reminders Toggles */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <ProDayText variant="section" style={styles.settingTitle}>
                        Accompagnement tuteurs légaux (mineurs)
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.settingSub}>
                        Notifier automatiquement les parents par push et notification lors des convocations.
                      </ProDayText>
                    </View>
                    <TouchableOpacity
                      style={[styles.toggleBtn, settings.guardianAlerts && { backgroundColor: tokens.accent }]}
                      onPress={() => setSettings((p) => ({ ...p, guardianAlerts: !p.guardianAlerts }))}
                      accessibilityRole="button"
                      accessibilityLabel="Activer ou désactiver l’alerte tuteur"
                    >
                      <Ionicons
                        name={settings.guardianAlerts ? 'checkmark' : 'close'}
                        size={14}
                        color={settings.guardianAlerts ? tokens.onAccent : tokens.muted}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <ProDayText variant="section" style={styles.settingTitle}>
                        Relance automatique convocations
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.settingSub}>
                        Envoyer un rappel automatique à J-2 et J-1 aux joueurs n'ayant pas encore répondu.
                      </ProDayText>
                    </View>
                    <TouchableOpacity
                      style={[styles.toggleBtn, settings.autoReminders && { backgroundColor: tokens.accent }]}
                      onPress={() => setSettings((p) => ({ ...p, autoReminders: !p.autoReminders }))}
                      accessibilityRole="button"
                      accessibilityLabel="Activer ou désactiver les rappels automatiques"
                    >
                      <Ionicons
                        name={settings.autoReminders ? 'checkmark' : 'close'}
                        size={14}
                        color={settings.autoReminders ? tokens.onAccent : tokens.muted}
                      />
                    </TouchableOpacity>
                  </View>

                  <PressableSpring
                    style={[styles.primaryActionBtn, { backgroundColor: tokens.accent, marginTop: 14 }]}
                    onPress={() => void handleSaveSettings()}
                    scaleTo={0.97}
                    haptic
                  >
                    <Ionicons name="checkmark-sharp" size={16} color={tokens.onAccent} />
                    <ProDayText variant="section" style={[styles.primaryActionBtnText, { color: tokens.onAccent }]}>
                      {settingsSaved ? 'Paramètres sauvegardés !' : 'Enregistrer les règles d\'équipe'}
                    </ProDayText>
                  </PressableSpring>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Jersey Number Assignment Modal */}
          {jerseyModalPlayer ? (
            <Modal
              transparent
              animationType="fade"
              visible={Boolean(jerseyModalPlayer)}
              onRequestClose={() => setJerseyModalPlayer(null)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <MaterialCommunityIcons name="tshirt-crew" size={20} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.modalTitle}>
                      Attribuer un numéro de maillot
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.modalSub}>
                    Joueur : {jerseyModalPlayer.display_name}
                  </ProDayText>
                  <TextInput
                    style={styles.jerseyInput}
                    placeholder="Ex: 10"
                    placeholderTextColor={tokens.muted}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={jerseyInputValue}
                    onChangeText={setJerseyInputValue}
                    autoFocus
                  />
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setJerseyModalPlayer(null)}
                    >
                      <ProDayText variant="caption" style={styles.modalCancelText}>
                        Annuler
                      </ProDayText>
                    </TouchableOpacity>
                    <PressableSpring
                      style={[styles.modalSaveBtn, { backgroundColor: tokens.accent }]}
                      onPress={() => void handleSaveJerseyNumber()}
                      scaleTo={0.96}
                    >
                      <ProDayText variant="caption" style={[styles.modalSaveText, { color: tokens.onAccent }]}>
                        Valider le numéro
                      </ProDayText>
                    </PressableSpring>
                  </View>
                </View>
              </View>
            </Modal>
          ) : null}

          {/* Minor Guardian Contact Modal */}
          {guardianModalPlayer ? (
            <Modal
              transparent
              animationType="fade"
              visible={Boolean(guardianModalPlayer)}
              onRequestClose={() => setGuardianModalPlayer(null)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Ionicons name="shield-checkmark" size={20} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.modalTitle}>
                      Contact tuteur légal (joueur mineur)
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.modalSub}>
                    Fiche joueur : {guardianModalPlayer.display_name}
                  </ProDayText>

                  <View style={styles.guardianInfoBox}>
                    <View style={styles.guardianRow}>
                      <ProDayText variant="caption" style={styles.guardianLabel}>Responsable légal :</ProDayText>
                      <ProDayText variant="caption" style={styles.guardianVal}>
                        {guardianModalPlayer.parental_settings?.guardian_name || guardianModalPlayer.parental_settings?.guardian_email || 'Parent référent ProDay'}
                      </ProDayText>
                    </View>
                    <View style={styles.guardianRow}>
                      <ProDayText variant="caption" style={styles.guardianLabel}>Consentement club :</ProDayText>
                      <ProDayText variant="caption" style={[styles.guardianVal, { color: proSemantic.success }]}>
                        Accord parental validé
                      </ProDayText>
                    </View>
                    <View style={styles.guardianRow}>
                      <ProDayText variant="caption" style={styles.guardianLabel}>Contact urgence :</ProDayText>
                      <ProDayText variant="caption" style={styles.guardianVal}>
                        {guardianModalPlayer.phone || 'Non renseigné'}
                      </ProDayText>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: tokens.surface, borderWidth: 1, borderColor: tokens.border, marginTop: 10 }]}
                    onPress={() => setGuardianModalPlayer(null)}
                  >
                    <ProDayText variant="caption" style={{ color: tokens.foreground, fontWeight: '700' }}>
                      Fermer la fiche tuteur
                    </ProDayText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          ) : null}
        </View>
      )}
    </>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitles: {
      flex: 1,
    },
    headerMainTitle: {
      color: tokens.foreground,
      fontSize: 19,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    headerSub: {
      color: tokens.muted,
      fontSize: 11.5,
      marginTop: 2,
    },
    shareHeaderBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vigilanceBanner: {
      marginHorizontal: 16,
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.warning, 0.35),
      gap: 8,
    },
    vigilanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    vigilanceTitle: {
      color: proSemantic.warning,
      fontSize: 12,
      fontWeight: '800',
    },
    vigilanceChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    vigilanceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: tokens.elevated,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    vigilanceChipText: {
      color: tokens.foreground,
      fontSize: 10.5,
      fontWeight: '600',
    },
    conformityBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginHorizontal: 16,
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: withAlpha(proSemantic.success, 0.12),
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.success, 0.25),
    },
    conformityBannerText: {
      color: proSemantic.success,
      fontSize: 11.5,
      fontWeight: '700',
    },
    tabsContainer: {
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      paddingVertical: 8,
    },
    tabsRow: {
      paddingHorizontal: 16,
      gap: 8,
      flexDirection: 'row',
    },
    tabPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    tabPillActive: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    tabPillText: {
      color: tokens.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    tabPillTextActive: {
      color: tokens.onAccent,
      fontWeight: '800',
    },
    content: {
      padding: 16,
      gap: 14,
    },
    loadingWrap: {
      paddingVertical: 40,
      alignItems: 'center',
      gap: 8,
    },
    loadingText: {
      color: tokens.muted,
      fontSize: 12,
    },
    tabSectionWrap: {
      gap: 14,
    },
    card: {
      backgroundColor: tokens.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 16,
      gap: 10,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardSectionTitle: {
      color: tokens.foreground,
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: -0.2,
    },
    cardBodyText: {
      color: tokens.muted,
      fontSize: 12,
      lineHeight: 16,
    },
    formGroup: {
      gap: 5,
    },
    formLabel: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '700',
    },
    formInput: {
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 10,
      color: tokens.foreground,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 12.5,
    },
    formRow: {
      flexDirection: 'row',
      gap: 10,
    },
    federationBox: {
      backgroundColor: tokens.elevated,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 6,
      marginTop: 4,
    },
    federationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    federationTitle: {
      color: proSemantic.info,
      fontSize: 11.5,
      fontWeight: '800',
    },
    federationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    federationLabel: {
      color: tokens.muted,
      fontSize: 11,
    },
    federationVal: {
      color: tokens.foreground,
      fontSize: 11,
      fontWeight: '700',
    },
    primaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 6,
    },
    primaryActionBtnText: {
      fontSize: 13,
      fontWeight: '800',
    },
    staffMemberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      paddingTop: 10,
    },
    staffAvatar: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    rowTitle: {
      color: tokens.foreground,
      fontSize: 13.5,
      fontWeight: '800',
    },
    rowSub: {
      color: tokens.muted,
      fontSize: 11,
      marginTop: 1,
    },
    staffRolePill: {
      alignSelf: 'flex-start',
      backgroundColor: tokens.elevated,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 5,
      marginTop: 3,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    staffRolePillText: {
      color: tokens.accent,
      fontSize: 10,
      fontWeight: '700',
    },
    staffRemoveBtn: {
      padding: 6,
    },
    emptyWrap: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyText: {
      color: tokens.muted,
      fontSize: 12,
      textAlign: 'center',
    },
    addStaffBox: {
      backgroundColor: tokens.elevated,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 8,
      marginTop: 8,
    },
    addStaffTitle: {
      color: tokens.foreground,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 2,
    },
    rolePickerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    rolePickerChip: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 7,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    rolePickerChipActive: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    rolePickerChipText: {
      color: tokens.muted,
      fontSize: 10.5,
      fontWeight: '600',
    },
    rolePickerChipTextActive: {
      color: tokens.onAccent,
      fontWeight: '800',
    },
    filterChipsRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    filterChipActive: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    filterChipText: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '700',
    },
    filterChipTextActive: {
      color: tokens.onAccent,
      fontWeight: '800',
    },
    playerAdminRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      paddingTop: 10,
    },
    jerseyBadge: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    jerseyBadgeText: {
      color: tokens.accent,
      fontSize: 12.5,
      fontWeight: '900',
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    minorTag: {
      backgroundColor: withAlpha(proSemantic.info, 0.15),
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    minorTagText: {
      color: proSemantic.info,
      fontSize: 9.5,
      fontWeight: '700',
    },
    playerMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusBadgeOk: {
      backgroundColor: withAlpha(proSemantic.success, 0.12),
    },
    statusBadgeWarn: {
      backgroundColor: withAlpha(proSemantic.warning, 0.12),
    },
    statusBadgeText: {
      fontSize: 9.5,
      fontWeight: '700',
    },
    editJerseyBtn: {
      padding: 6,
    },
    pendingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      paddingTop: 10,
      gap: 8,
    },
    pendingActionBtns: {
      flexDirection: 'row',
      gap: 6,
    },
    actionBtnApprove: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 8,
    },
    actionBtnApproveText: {
      fontSize: 11,
      fontWeight: '800',
    },
    actionBtnReject: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    actionBtnRejectText: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '700',
    },
    searchRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    searchInput: {
      flex: 1,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 10,
      color: tokens.foreground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 12,
    },
    searchBtn: {
      paddingHorizontal: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchBtnText: {
      fontSize: 12,
      fontWeight: '800',
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.elevated,
      padding: 10,
      borderRadius: 10,
      marginTop: 4,
      gap: 8,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    inviteBtn: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 8,
    },
    inviteBtnText: {
      fontSize: 11,
      fontWeight: '800',
    },
    codeDisplayBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.elevated,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    codeLabel: {
      color: tokens.muted,
      fontSize: 11.5,
    },
    codeValue: {
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1,
    },
    settingGroup: {
      gap: 4,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      paddingTop: 10,
    },
    settingTitle: {
      color: tokens.foreground,
      fontSize: 13,
      fontWeight: '800',
    },
    settingSub: {
      color: tokens.muted,
      fontSize: 11,
      lineHeight: 15,
      marginBottom: 4,
    },
    settingOptionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    settingOptionChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    settingOptionChipActive: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    settingOptionText: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    settingOptionTextActive: {
      color: tokens.onAccent,
      fontWeight: '800',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      paddingTop: 10,
    },
    toggleBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: tokens.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 20,
      gap: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modalTitle: {
      color: tokens.foreground,
      fontSize: 15,
      fontWeight: '900',
    },
    modalSub: {
      color: tokens.muted,
      fontSize: 12,
    },
    jerseyInput: {
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 12,
      color: tokens.foreground,
      fontSize: 22,
      fontWeight: '900',
      textAlign: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },
    modalActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
    },
    modalCancelText: {
      color: tokens.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    modalSaveBtn: {
      flex: 1.4,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalSaveText: {
      fontSize: 12,
      fontWeight: '800',
    },
    guardianInfoBox: {
      backgroundColor: tokens.elevated,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 6,
      marginTop: 4,
    },
    guardianRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    guardianLabel: {
      color: tokens.muted,
      fontSize: 11,
    },
    guardianVal: {
      color: tokens.foreground,
      fontSize: 11,
      fontWeight: '700',
    },
  });

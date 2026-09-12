/**
 * Pôle Club — Annuaire des Licenciés, Conformité & Solvabilité
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

export type MemberRoleFilter = 'all' | 'players' | 'staff' | 'board' | 'volunteers';

export type ClubMemberItem = {
  uid: string;
  name: string;
  role: 'player' | 'coach' | 'staff' | 'board' | 'volunteer';
  roleLabel: string;
  category: string;
  licenseStatus: 'valid' | 'pending' | 'missing';
  fffNumber: string;
  solvencyStatus: 'paid' | 'installments' | 'unpaid';
  medicalCertExpiry: string;
  avatarUrl?: string;
  matchesPlayed?: number;
  minutesPlayed?: number;
};

export const DEMO_MEMBERS: ClubMemberItem[] = [
  {
    uid: 'm-1',
    name: 'Yanis Benali',
    role: 'player',
    roleLabel: 'Joueur Séniors R1',
    category: 'Seniors',
    licenseStatus: 'valid',
    fffNumber: '2548901234',
    solvencyStatus: 'paid',
    medicalCertExpiry: 'Certificat médical FFF valide',
    matchesPlayed: 5,
    minutesPlayed: 450,
  },
  {
    uid: 'm-2',
    name: 'Lucas Moreau',
    role: 'player',
    roleLabel: 'Joueur U17 R2',
    category: 'U17',
    licenseStatus: 'valid',
    fffNumber: '2548905678',
    solvencyStatus: 'installments',
    medicalCertExpiry: 'Certificat médical FFF valide',
    matchesPlayed: 6,
    minutesPlayed: 520,
  },
  {
    uid: 'm-3',
    name: 'Alexandre Petit',
    role: 'coach',
    roleLabel: 'Éducateur Responsable U15',
    category: 'Staff Technique',
    licenseStatus: 'valid',
    fffNumber: '1102938475',
    solvencyStatus: 'paid',
    medicalCertExpiry: 'Diplôme BMF FFF certifié',
  },
  {
    uid: 'm-4',
    name: 'Karim Ziani',
    role: 'coach',
    roleLabel: 'Entraîneur Principal U17',
    category: 'Staff Technique',
    licenseStatus: 'valid',
    fffNumber: '1109847261',
    solvencyStatus: 'paid',
    medicalCertExpiry: 'Diplôme BEF FFF certifié',
  },
  {
    uid: 'm-5',
    name: 'Noah Vidal',
    role: 'player',
    roleLabel: 'Joueur U17 R2',
    category: 'U17',
    licenseStatus: 'pending',
    fffNumber: '2548991209',
    solvencyStatus: 'unpaid',
    medicalCertExpiry: 'Photo d’identité manquante',
    matchesPlayed: 4,
    minutesPlayed: 310,
  },
  {
    uid: 'm-6',
    name: 'Marc Lefevre',
    role: 'board',
    roleLabel: 'Directeur Technique (RTJ)',
    category: 'Comité Directeur',
    licenseStatus: 'valid',
    fffNumber: '1002938471',
    solvencyStatus: 'paid',
    medicalCertExpiry: 'Attestation dirigeant FFF valide',
  },
  {
    uid: 'm-7',
    name: 'Julien Mercier',
    role: 'volunteer',
    roleLabel: 'Responsable Buvette & Logistique',
    category: 'Bénévolat',
    licenseStatus: 'valid',
    fffNumber: '3302918273',
    solvencyStatus: 'paid',
    medicalCertExpiry: 'Licence volontaire FFF active',
  },
  {
    uid: 'm-8',
    name: 'Adam Touré',
    role: 'player',
    roleLabel: 'Joueur U15 R2',
    category: 'U15',
    licenseStatus: 'missing',
    fffNumber: '2548987654',
    solvencyStatus: 'unpaid',
    medicalCertExpiry: 'Certificat médical expiré depuis le 01/09',
    matchesPlayed: 0,
    minutesPlayed: 0,
  },
];

type Props = {
  members?: ClubMemberItem[];
  onSelectMember?: (uid: string) => void;
  onSendReminder?: (member: ClubMemberItem) => void;
};

export function ClubPlayersDirectory({
  members = DEMO_MEMBERS,
  onSelectMember,
  onSendReminder,
}: Props) {
  const { tokens } = useClubTheme();
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>('all');
  const [search, setSearch] = useState('');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchRole =
        roleFilter === 'all'
          ? true
          : roleFilter === 'players'
          ? m.role === 'player'
          : roleFilter === 'staff'
          ? m.role === 'coach' || m.role === 'staff'
          : roleFilter === 'board'
          ? m.role === 'board'
          : m.role === 'volunteer';

      const matchSearch =
        !search.trim() ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.fffNumber.includes(search) ||
        m.roleLabel.toLowerCase().includes(search.toLowerCase());

      return matchRole && matchSearch;
    });
  }, [members, roleFilter, search]);

  const validCount = useMemo(
    () => members.filter((m) => m.licenseStatus === 'valid').length,
    [members],
  );
  const pendingCount = useMemo(
    () => members.filter((m) => m.licenseStatus === 'pending').length,
    [members],
  );
  const missingCount = useMemo(
    () => members.filter((m) => m.licenseStatus === 'missing').length,
    [members],
  );
  const unpaidCount = useMemo(
    () => members.filter((m) => m.solvencyStatus === 'unpaid').length,
    [members],
  );

  const handleReminder = (member: ClubMemberItem) => {
    if (onSendReminder) {
      onSendReminder(member);
      return;
    }
    Alert.alert(
      'Rappel envoyé',
      `Une relance automatique a été adressée par notification push et email à ${member.name} pour la régularisation de sa licence FFF.`,
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Baromètre Conformité & Solvabilité */}
      <View style={[styles.statsCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={styles.statCol}>
          <ProDayText style={[styles.statNum, { color: '#10B981' }]}>{validCount}</ProDayText>
          <ProDayText style={[styles.statLabel, { color: tokens.muted }]}>Licences validées</ProDayText>
        </View>
        <View style={[styles.statSep, { backgroundColor: tokens.border }]} />
        <View style={styles.statCol}>
          <ProDayText style={[styles.statNum, { color: '#F59E0B' }]}>{pendingCount}</ProDayText>
          <ProDayText style={[styles.statLabel, { color: tokens.muted }]}>En validation</ProDayText>
        </View>
        <View style={[styles.statSep, { backgroundColor: tokens.border }]} />
        <View style={styles.statCol}>
          <ProDayText style={[styles.statNum, { color: '#EF4444' }]}>{missingCount}</ProDayText>
          <ProDayText style={[styles.statLabel, { color: tokens.muted }]}>Non conformes</ProDayText>
        </View>
        <View style={[styles.statSep, { backgroundColor: tokens.border }]} />
        <View style={styles.statCol}>
          <ProDayText style={[styles.statNum, { color: tokens.warning }]}>{unpaidCount}</ProDayText>
          <ProDayText style={[styles.statLabel, { color: tokens.muted }]}>Cotis. en attente</ProDayText>
        </View>
      </View>

      {/* 2. Barre de Recherche */}
      <View style={[styles.searchBar, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Icon name="search" size={18} color={tokens.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un membre, N° licence FFF..."
          placeholderTextColor={tokens.muted}
          style={[styles.searchInput, { color: tokens.foreground }]}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close" size={16} color={tokens.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 3. Filtre par Rôles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roleTabs}
      >
        {(
          [
            { id: 'all', label: 'Tous' },
            { id: 'players', label: 'Joueurs' },
            { id: 'staff', label: 'Staff & Coachs' },
            { id: 'board', label: 'Dirigeants' },
            { id: 'volunteers', label: 'Bénévoles' },
          ] as { id: MemberRoleFilter; label: string }[]
        ).map((tab) => {
          const active = roleFilter === tab.id;
          return (
            <PressableSpring
              key={tab.id}
              onPress={() => setRoleFilter(tab.id)}
              style={[
                styles.rolePill,
                active
                  ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                  : { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
              scaleTo={0.96}
            >
              <ProDayText
                style={[
                  styles.rolePillText,
                  active ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                ]}
              >
                {tab.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      {/* 4. Liste des Membres */}
      <View style={styles.memberList}>
        {filteredMembers.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Icon name="people" size={32} color={tokens.muted} />
            <ProDayText style={[styles.emptyTitle, { color: tokens.foreground }]}>Aucun licencié trouvé</ProDayText>
            <ProDayText style={[styles.emptySubtitle, { color: tokens.muted }]}>
              Modifiez vos critères de recherche ou ajoutez un nouveau membre.
            </ProDayText>
          </View>
        ) : (
          filteredMembers.map((member) => {
            const isPlayer = member.role === 'player';
            const statusColor =
              member.licenseStatus === 'valid'
                ? '#10B981'
                : member.licenseStatus === 'pending'
                ? '#F59E0B'
                : '#EF4444';
            const statusLabel =
              member.licenseStatus === 'valid'
                ? 'Licence validée'
                : member.licenseStatus === 'pending'
                ? 'Pièce en attente'
                : 'Certificat manquant';

            return (
              <PressableSpring
                key={member.uid}
                onPress={() => onSelectMember?.(member.uid)}
                style={[styles.memberCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                scaleTo={0.98}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarRow}>
                    <View style={[styles.avatarBox, { backgroundColor: tokens.accentSoft }]}>
                      <ProDayText style={[styles.avatarLetter, { color: tokens.accent }]}>
                        {member.name.charAt(0)}
                      </ProDayText>
                    </View>
                    <View>
                      <ProDayText style={[styles.memberName, { color: tokens.foreground }]}>
                        {member.name}
                      </ProDayText>
                      <ProDayText style={[styles.memberRole, { color: tokens.muted }]}>
                        {member.roleLabel} · {member.category}
                      </ProDayText>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <ProDayText style={[styles.statusBadgeText, { color: statusColor }]}>
                      {statusLabel}
                    </ProDayText>
                  </View>
                </View>

                {/* Métadonnées Passeport & Solvabilité */}
                <View style={[styles.cardMetaRow, { borderTopColor: tokens.border }]}>
                  <View style={styles.metaItem}>
                    <Icon name="document" size={14} color={tokens.muted} />
                    <ProDayText style={[styles.metaText, { color: tokens.muted }]}>
                      N° {member.fffNumber}
                    </ProDayText>
                  </View>

                  {isPlayer ? (
                    <View style={styles.metaItem}>
                      <Icon name="time" size={14} color={tokens.muted} />
                      <ProDayText style={[styles.metaText, { color: tokens.muted }]}>
                        {member.matchesPlayed} matchs · {member.minutesPlayed} min
                      </ProDayText>
                    </View>
                  ) : null}

                  <View style={styles.metaItem}>
                    <Icon
                      name="bag"
                      size={14}
                      color={member.solvencyStatus === 'paid' ? '#10B981' : '#F59E0B'}
                    />
                    <ProDayText
                      style={[
                        styles.metaText,
                        {
                          color:
                            member.solvencyStatus === 'paid' ? '#10B981' : '#F59E0B',
                        },
                      ]}
                    >
                      {member.solvencyStatus === 'paid'
                        ? 'Cotisation réglée'
                        : member.solvencyStatus === 'installments'
                        ? 'Échéancier en cours'
                        : 'Cotisation impayée'}
                    </ProDayText>
                  </View>
                </View>

                {/* Action d'urgence si licence non conforme */}
                {member.licenseStatus !== 'valid' || member.solvencyStatus === 'unpaid' ? (
                  <View style={[styles.alertActionRow, { borderTopColor: tokens.border }]}>
                    <ProDayText style={[styles.alertActionDesc, { color: '#EF4444' }]}>
                      {member.medicalCertExpiry}
                    </ProDayText>
                    <PressableSpring
                      onPress={() => handleReminder(member)}
                      style={[styles.reminderBtn, { backgroundColor: `${tokens.accent}15` }]}
                      scaleTo={0.96}
                    >
                      <Icon name="notifications" size={14} color={tokens.accent} />
                      <ProDayText style={[styles.reminderBtnText, { color: tokens.accent }]}>
                        Relancer 1-Tap
                      </ProDayText>
                    </PressableSpring>
                  </View>
                ) : null}
              </PressableSpring>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 14,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    ...APPLE_TYPOGRAPHY.title2,
    fontSize: 18,
    lineHeight: 22,
  },
  statLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
    textAlign: 'center',
  },
  statSep: {
    width: 1,
    height: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...APPLE_TYPOGRAPHY.body,
    padding: 0,
  },
  roleTabs: {
    gap: 8,
    paddingBottom: 4,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  rolePillText: {
    ...APPLE_TYPOGRAPHY.footnote,
  },
  memberList: {
    gap: 10,
    paddingBottom: 40,
  },
  memberCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  memberName: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  memberRole: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  alertActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  alertActionDesc: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reminderBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  emptySubtitle: {
    ...APPLE_TYPOGRAPHY.footnote,
    textAlign: 'center',
  },
});

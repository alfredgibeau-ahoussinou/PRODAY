import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { usersService } from '../../services/users.service';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import type { User } from '../../models/User';
import { ADMIN_TOKENS } from '../../features/admin/theme/adminTokens';

export interface StaffPermissions {
  matchSheets: boolean;
  accounting: boolean;
  mercato: boolean;
  announcements: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  category: 'coach' | 'medical' | 'official';
  email: string;
  phone: string;
  assignedTeams: string[];
  permissions: StaffPermissions;
}

/** Rôle du profil réel => catégorie d'annuaire. Rôles inattendus => 'official'. */
function staffCategory(role: string): StaffMember['category'] {
  if (role === 'coach') return 'coach';
  if (role === 'physio') return 'medical';
  return 'official';
}

/** Construit la fiche annuaire depuis le profil réel — champs absents => « — ». */
function toStaffMember(u: User): StaffMember {
  return {
    id: u.uid,
    name: u.display_name,
    role: u.role === 'coach' ? 'Coach' : u.role === 'physio' ? 'Kinésithérapeute' : 'Dirigeant',
    category: staffCategory(u.role),
    email: u.email || '—',
    phone: u.phone || '—',
    assignedTeams: [],
    permissions: {
      matchSheets: false,
      accounting: false,
      mercato: false,
      announcements: false,
    },
  };
}

export const AdminStaffScreen: React.FC = () => {
  const profile = useSessionProfile();
  const [filter, setFilter] = useState<'all' | 'coach' | 'medical' | 'official'>('all');

  /** Annuaire réel : membres actifs du club (rôles coach / kiné / dirigeant).
   * null = chargement, [] = aucun membre, erreur = service injoignable. */
  const [staffList, setStaffList] = useState<StaffMember[] | null>(null);
  const [rosterError, setRosterError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const clubId = profile?.profile.club_id ?? '';
    if (!clubId) {
      setStaffList([]);
      return;
    }
    setStaffList(null);
    setRosterError(false);
    usersService
      .listMembersByClubId(clubId)
      .then((rows) => {
        if (!alive) return;
        setStaffList(rows.map(toStaffMember));
      })
      .catch(() => {
        if (!alive) return;
        setStaffList([]);
        setRosterError(true);
      });
    return () => {
      alive = false;
    };
  }, [profile?.uid]);

  const filteredStaff = (staffList ?? []).filter(
    (m) => filter === 'all' || m.category === filter,
  );

  /** Aucune écriture locale : les délégations réelles passeront par les rôles
   * Firestore ( règles serveur faisant autorité). L'écran l'indique. */
  const togglePermission = () => {
    prodayHaptics.press();
    Alert.alert(
      'Délégation non modifiable',
      'Les droits réels sont gérés par les rôles du club. La modification directe n’est pas encore connectée.',
    );
  };

  const handleAddStaff = () => {
    prodayHaptics.press();
    Alert.alert(
      'Invitation non connectée',
      'Aucun lien d’invitation n’est généré depuis cet écran : l’invitation de staff n’est pas encore branchée sur le service d’invitations.',
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header avec bouton d'ajout */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Annuaire Staff & Équipes</Text>
          <Text style={styles.subtitle}>Affectations, encadrement & délégations d'accès</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddStaff} activeOpacity={0.8}>
          <Ionicons name="person-add" size={16} color="#000" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Filtres de catégories Apple Pill */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'Tous' },
          { id: 'coach', label: 'Coachs & Éducateurs' },
          { id: 'medical', label: 'Pôle Médical' },
          { id: 'official', label: 'Dirigeants' },
        ].map((f) => {
          const active = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => {
                prodayHaptics.selection();
                setFilter(f.id as typeof filter);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Liste du Staff */}
      <View style={styles.list}>
        {staffList === null ? (
          <Text style={styles.honestNote}>Chargement de l’annuaire…</Text>
        ) : rosterError ? (
          <Text style={styles.honestNote}>
            Impossible de charger l’annuaire. Vérifie ta connexion et réessaie.
          </Text>
        ) : filteredStaff.length === 0 ? (
          <Text style={styles.honestNote}>
            Aucun membre du staff dans ce club. Les coachs, kinés et dirigeants rattachés
            au club apparaîtront ici.
          </Text>
        ) : (
        filteredStaff.map((member) => {
          const isExpanded = expandedId === member.id;
          return (
            <View key={member.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => {
                  prodayHaptics.press();
                  setExpandedId(isExpanded ? null : member.id);
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.avatar,
                    member.category === 'coach' && { backgroundColor: 'rgba(10, 132, 255, 0.15)' },
                    member.category === 'medical' && { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
                    member.category === 'official' && { backgroundColor: 'rgba(192, 132, 252, 0.15)' },
                  ]}
                >
                  <Ionicons
                    name={
                      member.category === 'coach'
                        ? 'football'
                        : member.category === 'medical'
                          ? 'fitness'
                          : 'briefcase'
                    }
                    size={20}
                    color={
                      member.category === 'coach'
                        ? '#0A84FF'
                        : member.category === 'medical'
                          ? '#30D158'
                          : '#C084FC'
                    }
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{member.name}</Text>
                  <Text style={styles.role}>{member.role}</Text>
                  <View style={styles.teamsRow}>
                    {member.assignedTeams.map((t, idx) => (
                      <View key={idx} style={styles.teamChip}>
                        <Text style={styles.teamChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {/* Panneau de permissions déployable */}
              {isExpanded && (
                <View style={styles.permissionsPanel}>
                  <Text style={styles.panelTitle}>DÉLÉGATION DES DROITS & DÉROGATIONS</Text>

                  <View style={styles.permissionRow}>
                    <View>
                      <Text style={styles.permLabel}>Feuilles de Match & Convocations</Text>
                      <Text style={styles.permDesc}>Gestion du XI et saisie des scores</Text>
                    </View>
                    <Switch
                      value={member.permissions.matchSheets}
                      onValueChange={() => togglePermission()}
                      trackColor={{ false: '#26262E', true: '#30D158' }}
                      thumbColor="#FFF"
                    />
                  </View>

                  <View style={styles.permissionRow}>
                    <View>
                      <Text style={styles.permLabel}>Comptabilité & Frais Déplacement</Text>
                      <Text style={styles.permDesc}>Accès au module financier</Text>
                    </View>
                    <Switch
                      value={member.permissions.accounting}
                      onValueChange={() => togglePermission()}
                      trackColor={{ false: '#26262E', true: '#30D158' }}
                      thumbColor="#FFF"
                    />
                  </View>

                  <View style={styles.permissionRow}>
                    <View>
                      <Text style={styles.permLabel}>Mercato & Recrutement Externe</Text>
                      <Text style={styles.permDesc}>Consultation et contact des profils scouts</Text>
                    </View>
                    <Switch
                      value={member.permissions.mercato}
                      onValueChange={() => togglePermission()}
                      trackColor={{ false: '#26262E', true: '#30D158' }}
                      thumbColor="#FFF"
                    />
                  </View>

                  <View style={styles.permissionRow}>
                    <View>
                      <Text style={styles.permLabel}>Diffusion des Annonces Officielles</Text>
                      <Text style={styles.permDesc}>Publication de communications club</Text>
                    </View>
                    <Switch
                      value={member.permissions.announcements}
                      onValueChange={() => togglePermission()}
                      trackColor={{ false: '#26262E', true: '#30D158' }}
                      thumbColor="#FFF"
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    backgroundColor: ADMIN_TOKENS.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  honestNote: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: ADMIN_TOKENS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  role: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  teamChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teamChipText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  permissionsPanel: {
    backgroundColor: '#0B0B0E',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  panelTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  permLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  permDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
});

import React, { useState } from 'react';
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

export const AdminStaffScreen: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'coach' | 'medical' | 'official'>('all');

  const [staffList, setStaffList] = useState<StaffMember[]>([
    {
      id: 's1',
      name: 'Laurent Blanc',
      role: 'Entraîneur Principal',
      category: 'coach',
      email: 'l.blanc@proday.fr',
      phone: '+33 6 12 34 56 78',
      assignedTeams: ['Seniors R1', 'U19 Nat'],
      permissions: {
        matchSheets: true,
        accounting: false,
        mercato: true,
        announcements: true,
      },
    },
    {
      id: 's2',
      name: 'Dr. Sophie Bernard',
      role: 'Médecin Référent du Club',
      category: 'medical',
      email: 'dr.bernard@proday.fr',
      phone: '+33 6 98 76 54 32',
      assignedTeams: ['Tous Pôles & Équipes'],
      permissions: {
        matchSheets: false,
        accounting: false,
        mercato: false,
        announcements: false,
      },
    },
    {
      id: 's3',
      name: 'Marc Lefebvre',
      role: 'Kiné du Sport',
      category: 'medical',
      email: 'm.lefebvre@proday.fr',
      phone: '+33 6 45 67 89 01',
      assignedTeams: ['Seniors A & B'],
      permissions: {
        matchSheets: false,
        accounting: false,
        mercato: false,
        announcements: false,
      },
    },
    {
      id: 's4',
      name: 'Antoine Rossi',
      role: 'Responsable École de Foot & Formation',
      category: 'coach',
      email: 'a.rossi@proday.fr',
      phone: '+33 6 23 45 67 89',
      assignedTeams: ['U6 à U13'],
      permissions: {
        matchSheets: true,
        accounting: true,
        mercato: false,
        announcements: true,
      },
    },
    {
      id: 's5',
      name: 'Catherine Morin',
      role: 'Secrétaire Générale',
      category: 'official',
      email: 'c.morin@proday.fr',
      phone: '+33 6 34 56 78 90',
      assignedTeams: ['Direction'],
      permissions: {
        matchSheets: true,
        accounting: true,
        mercato: true,
        announcements: true,
      },
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>('s1');

  const filteredStaff = staffList.filter((m) => filter === 'all' || m.category === filter);

  const togglePermission = (
    memberId: string,
    key: keyof StaffPermissions,
    value: boolean,
  ) => {
    prodayHaptics.selection();
    setStaffList((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          permissions: {
            ...m.permissions,
            [key]: value,
          },
        };
      }),
    );
  };

  const handleAddStaff = () => {
    prodayHaptics.press();
    Alert.alert(
      'Nouveau Collaborateur',
      'Un lien d’invitation sécurisé a été généré pour intégrer un nouveau membre du staff.',
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
        {filteredStaff.map((member) => {
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
                      onValueChange={(val) => togglePermission(member.id, 'matchSheets', val)}
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
                      onValueChange={(val) => togglePermission(member.id, 'accounting', val)}
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
                      onValueChange={(val) => togglePermission(member.id, 'mercato', val)}
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
                      onValueChange={(val) => togglePermission(member.id, 'announcements', val)}
                      trackColor={{ false: '#26262E', true: '#30D158' }}
                      thumbColor="#FFF"
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}
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
    backgroundColor: '#141418',
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
  card: {
    backgroundColor: '#141418',
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

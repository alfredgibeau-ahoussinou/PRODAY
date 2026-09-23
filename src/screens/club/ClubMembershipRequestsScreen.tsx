import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme/designTokens';
import { useAuth } from '../../context/AuthContext';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { membershipsService } from '../../services/memberships.service';
import { teamsService } from '../../services/teams.service';
import type { Membership, MembershipRole } from '../../models/Membership';
import type { Team } from '../../models/Team';

interface ClubMembershipRequestsScreenProps {
  onBack?: () => void;
}

export function ClubMembershipRequestsScreen({ onBack }: ClubMembershipRequestsScreenProps) {
  const { profile } = useAuth();
  const { clubId, club } = useClubWorkspace();

  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'rejected'>('pending');
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Approval Modal
  const [approvingMembership, setApprovingMembership] = useState<Membership | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<MembershipRole>('player');
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection Modal
  const [rejectingMembership, setRejectingMembership] = useState<Membership | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const targetClubId = clubId || profile?.profile?.club_id;

  useEffect(() => {
    if (!targetClubId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch teams
    teamsService
      .listByClubId(targetClubId)
      .then((t: Team[]) => setTeams(t))
      .catch(() => {});

    // Subscribe to club memberships
    const unsubscribe = membershipsService.subscribeByClub(targetClubId, (list) => {
      setMemberships(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetClubId]);

  const filteredMemberships = memberships.filter((m) => {
    if (activeTab === 'pending') return m.status === 'pending';
    if (activeTab === 'active') return m.status === 'active';
    return m.status === 'rejected' || m.status === 'cancelled';
  });

  const handleOpenApproveModal = (m: Membership) => {
    setApprovingMembership(m);
    setSelectedRole(m.requested_role || m.role || 'player');
    setSelectedTeamId(m.team_id || (teams[0]?.id ?? ''));
  };

  const handleConfirmApprove = async () => {
    if (!approvingMembership || !profile?.uid) return;
    setActionLoading(true);
    try {
      await membershipsService.approve(approvingMembership.id, profile.uid, {
        teamId: selectedTeamId || undefined,
        role: selectedRole,
      });
      setApprovingMembership(null);
      Alert.alert('Adhésion validée', `Le membre ${approvingMembership.player_name} a été rattaché avec succès.`);
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de valider l’adhésion.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (m: Membership) => {
    setRejectingMembership(m);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingMembership || !profile?.uid) return;
    setActionLoading(true);
    try {
      await membershipsService.reject(
        rejectingMembership.id,
        profile.uid,
        rejectionReason.trim() || undefined,
      );
      setRejectingMembership(null);
      Alert.alert('Demande refusée', 'Le demandeur a été notifié.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de refuser la demande.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = memberships.filter((m) => m.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Demandes d’adhésion</Text>
          <Text style={styles.subtitle}>{club?.name || 'Gestion des affiliations'}</Text>
        </View>
        {pendingCount > 0 ? (
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{pendingCount}</Text>
          </View>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'pending' && styles.tabButtonTextActive]}>
            En attente ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'active' && styles.tabButtonTextActive]}>
            Validés
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'rejected' && styles.tabButtonActive]}
          onPress={() => setActiveTab('rejected')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'rejected' && styles.tabButtonTextActive]}>
            Refusés / Archivés
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Chargement des demandes...</Text>
        </View>
      ) : filteredMemberships.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name={activeTab === 'pending' ? 'checkmark-done-circle-outline' : 'people-outline'}
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'pending'
              ? 'Aucune demande en attente'
              : activeTab === 'active'
                ? 'Aucun membre validé'
                : 'Aucune archive'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'pending'
              ? 'Toutes les demandes de vos joueurs et éducateurs ont été traitées.'
              : 'Les adhésions apparaîtront ici.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMemberships}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const roleLabel =
              item.requested_role === 'coach' || item.role === 'coach'
                ? 'Éducateur / Coach'
                : item.requested_role === 'parent' || item.role === 'parent'
                  ? 'Parent'
                  : 'Joueur';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarMini}>
                    <Ionicons
                      name={
                        item.role === 'coach' || item.requested_role === 'coach'
                          ? 'clipboard-outline'
                          : 'football-outline'
                      }
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.applicantName}>{item.player_name}</Text>
                    <Text style={styles.applicantRole}>{roleLabel}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'active' && styles.statusPillActive,
                      (item.status === 'rejected' || item.status === 'cancelled') &&
                        styles.statusPillRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        item.status === 'active' && styles.statusPillTextActive,
                        (item.status === 'rejected' || item.status === 'cancelled') &&
                          styles.statusPillTextRejected,
                      ]}
                    >
                      {item.status === 'pending'
                        ? 'En attente'
                        : item.status === 'active'
                          ? 'Validé'
                          : item.status === 'cancelled'
                            ? 'Annulé'
                            : 'Refusé'}
                    </Text>
                  </View>
                </View>

                {item.requested_team_name ? (
                  <View style={styles.cardDetailRow}>
                    <Text style={styles.detailKey}>Équipe demandée :</Text>
                    <Text style={styles.detailVal}>{item.requested_team_name}</Text>
                  </View>
                ) : item.category ? (
                  <View style={styles.cardDetailRow}>
                    <Text style={styles.detailKey}>Catégorie :</Text>
                    <Text style={styles.detailVal}>{item.category}</Text>
                  </View>
                ) : null}

                {item.applicant_message ? (
                  <View style={styles.applicantMessageBox}>
                    <Text style={styles.applicantMessageText}>"{item.applicant_message}"</Text>
                  </View>
                ) : null}

                {item.rejection_reason ? (
                  <View style={styles.rejectionReasonBox}>
                    <Text style={styles.rejectionReasonText}>Motif du refus : {item.rejection_reason}</Text>
                  </View>
                ) : null}

                {/* Actions for pending items */}
                {item.status === 'pending' ? (
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleOpenRejectModal(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={16} color={colors.error} />
                      <Text style={styles.rejectBtnText}>Refuser</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleOpenApproveModal(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={16} color="#000000" />
                      <Text style={styles.approveBtnText}>Valider l’adhésion</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}

      {/* Modal: Validate / Approve Request */}
      <Modal
        visible={Boolean(approvingMembership)}
        transparent
        animationType="slide"
        onRequestClose={() => setApprovingMembership(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Valider l’adhésion</Text>
                <Text style={styles.modalSubtitle}>{approvingMembership?.player_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setApprovingMembership(null)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Rôle attribué</Text>
              <View style={styles.rolePickerRow}>
                <TouchableOpacity
                  style={[styles.roleChoice, selectedRole === 'player' && styles.roleChoiceActive]}
                  onPress={() => setSelectedRole('player')}
                >
                  <Text style={[styles.roleChoiceText, selectedRole === 'player' && styles.roleChoiceTextActive]}>
                    Joueur
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChoice, selectedRole === 'coach' && styles.roleChoiceActive]}
                  onPress={() => setSelectedRole('coach')}
                >
                  <Text style={[styles.roleChoiceText, selectedRole === 'coach' && styles.roleChoiceTextActive]}>
                    Éducateur / Coach
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Affecter à une équipe</Text>
              {teams.length === 0 ? (
                <Text style={styles.helperText}>Équipe principale par défaut du club</Text>
              ) : (
                <View style={styles.teamListWrapper}>
                  {teams.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.teamChoiceItem,
                        selectedTeamId === t.id && styles.teamChoiceItemActive,
                      ]}
                      onPress={() => setSelectedTeamId(t.id)}
                    >
                      <Text
                        style={[
                          styles.teamChoiceItemText,
                          selectedTeamId === t.id && styles.teamChoiceItemTextActive,
                        ]}
                      >
                        {t.name} {t.category ? `(${t.category})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.confirmApproveButton}
                onPress={handleConfirmApprove}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#000000" />
                    <Text style={styles.confirmApproveButtonText}>Confirmer et intégrer au club</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Modal: Reject Request */}
      <Modal
        visible={Boolean(rejectingMembership)}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectingMembership(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Refuser la demande</Text>
                <Text style={styles.modalSubtitle}>{rejectingMembership?.player_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRejectingMembership(null)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Motif du refus (facultatif)</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="Ex: Effectif complet pour cette catégorie, hors secteur..."
                placeholderTextColor={colors.textSecondary}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.confirmRejectButton}
                onPress={handleConfirmReject}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmRejectButtonText}>Confirmer le refus</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeCount: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  tabButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  applicantRole: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
  },
  statusPillActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  statusPillRejected: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD60A',
  },
  statusPillTextActive: {
    color: '#34C759',
  },
  statusPillTextRejected: {
    color: '#FF453A',
  },
  cardDetailRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  detailKey: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  applicantMessageBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  applicantMessageText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  rejectionReasonBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderRadius: radius.md,
  },
  rejectionReasonText: {
    fontSize: 12,
    color: '#FF453A',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    gap: 4,
  },
  rejectBtnText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    gap: 4,
  },
  approveBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161922',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roleChoice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleChoiceActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  roleChoiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleChoiceTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  teamListWrapper: {
    gap: 6,
    marginBottom: spacing.lg,
  },
  teamChoiceItem: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  teamChoiceItemActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  teamChoiceItemText: {
    fontSize: 13,
    color: colors.text,
  },
  teamChoiceItemTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  modalTextArea: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  confirmApproveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  confirmApproveButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmRejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: radius.lg,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  confirmRejectButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

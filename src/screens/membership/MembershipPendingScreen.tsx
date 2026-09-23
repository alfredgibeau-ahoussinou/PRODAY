import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { prodayAlert } from '../../utils/prodayAlert';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme/designTokens';
import type { Membership } from '../../models/Membership';
import { membershipsService } from '../../services/memberships.service';
import { useAuth } from '../../context/AuthContext';

interface MembershipPendingScreenProps {
  membership: Membership;
  onRefresh?: () => Promise<void> | void;
}

export function MembershipPendingScreen({
  membership,
  onRefresh,
}: MembershipPendingScreenProps) {
  const { profile, signOut } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancel = () => {
    prodayAlert.alert(
      'Annuler la demande',
      'Êtes-vous sûr de vouloir annuler votre demande d’adhésion à ce club ?',
      [
        { text: 'Non, conserver', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            if (!profile?.uid) return;
            setCancelling(true);
            try {
              await membershipsService.cancelRequest(membership.id, profile.uid);
              if (onRefresh) await onRefresh();
            } catch (err: any) {
              prodayAlert.alert('Erreur', err?.message || 'Impossible d’annuler la demande.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  const formattedDate = membership.requested_at
    ? new Date(membership.requested_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const roleLabel =
    membership.requested_role === 'coach' || membership.role === 'coach'
      ? 'Éducateur / Coach'
      : membership.requested_role === 'parent' || membership.role === 'parent'
        ? 'Parent référent'
        : 'Joueur';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={40} color="#FFD60A" />
          </View>
          <Text style={styles.title}>Demande en attente</Text>
          <Text style={styles.subtitle}>
            Votre demande d’adhésion a été transmise aux responsables du club.
          </Text>
        </View>

        {/* Status Pill */}
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>En attente d’approbation par le staff</Text>
        </View>

        {/* Membership Details Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.clubIcon}>
              <Ionicons name="shield" size={24} color={colors.accent} />
            </View>
            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>{membership.club_name || 'Club de football'}</Text>
              <Text style={styles.clubId}>Réf. #{membership.club_id.slice(0, 8)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rôle demandé</Text>
            <Text style={styles.detailValue}>{roleLabel}</Text>
          </View>

          {membership.requested_team_name ? (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Équipe / Catégorie souhaitée</Text>
              <Text style={styles.detailValue}>{membership.requested_team_name}</Text>
            </View>
          ) : membership.category ? (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Catégorie</Text>
              <Text style={styles.detailValue}>{membership.category}</Text>
            </View>
          ) : null}

          {formattedDate ? (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date de la demande</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
          ) : null}

          {membership.applicant_message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>Votre message :</Text>
              <Text style={styles.messageText}>"{membership.applicant_message}"</Text>
            </View>
          ) : null}
        </View>

        {/* Explanatory Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={22} color={colors.accent} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Dès qu'un administrateur ou entraîneur valide votre adhésion, vous aurez accès immédiatement au vestiaire, aux convocations, aux statistiques et aux vidéos de votre équipe.
          </Text>
        </View>

        {/* Primary Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
            activeOpacity={0.8}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#000000" />
                <Text style={styles.refreshButtonText}>Actualiser le statut</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                <Text style={styles.cancelButtonText}>Annuler ma demande d'adhésion</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => void signOut()}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.signOutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 214, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.4)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: spacing.lg,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD60A',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD60A',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  clubIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  clubId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  messageBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  messageLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  infoCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  },
  refreshButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  refreshButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: radius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    gap: spacing.sm,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  signOutButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

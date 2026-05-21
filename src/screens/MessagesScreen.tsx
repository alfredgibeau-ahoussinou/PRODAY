import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useMessagesData } from '../hooks/useAppData';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile.service';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { colors, spacing, radius } from '../theme/designTokens';

export const MessagesScreen: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const { threads, loading } = useMessagesData();

  const mustVerify =
    profile &&
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
    !profileService.canPerformSensitiveAction(profile);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Messages"
        subtitle="Profils vérifiés (coach, agent)"
      />
      <Text style={styles.notice}>
        Les conversations avec les mineurs nécessitent un badge vert. Messagerie
        bloquée tant que la vérification est en attente.
      </Text>

      {!authLoading && !profile && (
        <Text style={styles.empty}>
          Connectez-vous (onglet Profil) pour voir vos conversations.
        </Text>
      )}

      {mustVerify && (
        <Text style={styles.blocked}>
          Messagerie bloquée — validez votre diplôme ou licence depuis l&apos;onglet
          Profil.
        </Text>
      )}

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : !profile ? null : threads.length === 0 ? (
        <Text style={styles.empty}>
          Aucune conversation — connectez-vous et lancez le seed pour des exemples.
        </Text>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.thread}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.participant_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.threadBody}>
                <View style={styles.threadTop}>
                  <Text style={styles.threadName}>{item.participant_name}</Text>
                  <Text style={styles.threadTime}>
                    {item.updated_at.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <Text style={styles.threadPreview} numberOfLines={1}>
                  {item.last_message}
                </Text>
              </View>
              {item.unread ? <View style={styles.unreadDot} /> : null}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notice: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  loader: { marginTop: spacing.xl },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.xl,
    fontSize: 14,
  },
  blocked: {
    color: colors.warning,
    backgroundColor: colors.warningBg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: 13,
    lineHeight: 20,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  thread: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: colors.brand },
  threadBody: { flex: 1 },
  threadTop: { flexDirection: 'row', justifyContent: 'space-between' },
  threadName: { fontSize: 15, fontWeight: '700', color: colors.text },
  threadTime: { fontSize: 11, color: colors.textMuted },
  threadPreview: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
    marginLeft: spacing.sm,
  },
});

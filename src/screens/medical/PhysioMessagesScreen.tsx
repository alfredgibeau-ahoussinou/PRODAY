import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PressableSpring, SkeletonList, StaggerReveal } from '../../components/motion';
import { useAuth } from '../../context/AuthContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useMessagesData } from '../../hooks/useAppData';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { profileService } from '../../services/profile.service';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import { physioCareThreadLabel } from '../../utils/physioMessaging';
import { ChatScreen } from '../ChatScreen';
import { PhysioScreenHeader } from '../../components/medical/PhysioScreenHeader';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { spacing, radius } from '../../theme/designTokens';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

export const PhysioMessagesScreen: React.FC = () => {
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const { loading: authLoading } = useAuth();
  const profile = useSessionProfile();
  const { pendingChatThreadId, clearPendingChat } = useTabNavigation();
  const { threads, loading, refresh } = useMessagesData(profile?.uid);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      const aCare = a.thread_kind === 'physio_care' ? 0 : 1;
      const bCare = b.thread_kind === 'physio_care' ? 0 : 1;
      if (aCare !== bCare) return aCare - bCare;
      return b.updated_at.getTime() - a.updated_at.getTime();
    });
  }, [threads]);

  const mustVerify =
    profile &&
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
    !profileService.canPerformSensitiveAction(profile);

  useEffect(() => {
    if (pendingChatThreadId) {
      if (mustVerify) {
        clearPendingChat();
        Alert.alert(
          'Messagerie bloquée',
          'Validez votre diplôme ou licence depuis l’onglet Profil.',
        );
        return;
      }
      setActiveThreadId(pendingChatThreadId);
      clearPendingChat();
    }
  }, [pendingChatThreadId, clearPendingChat, mustVerify]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  if (activeThreadId && profile && !mustVerify && activeThread) {
    return (
      <ChatScreen
        threadId={activeThreadId}
        otherName={activeThread.participant_name}
        currentUid={profile.uid}
        currentUser={profile}
        onBack={() => {
          setActiveThreadId(null);
          refresh();
        }}
      />
    );
  }

  if (activeThreadId && profile && !mustVerify) {
    return (
      <ChatScreen
        threadId={activeThreadId}
        otherName="Patient"
        currentUid={profile.uid}
        currentUser={profile}
        onBack={() => {
          setActiveThreadId(null);
          refresh();
        }}
      />
    );
  }

  return (
    <View style={[styles.container, rootStyle]}>
      <View style={styles.headerWrap}>
        <PhysioScreenHeader
          title="Messages patients"
          subtitle="Suivi blessure, préparation au retour et échanges confidentiels avec vos sportifs."
        />
      </View>

      {!authLoading && !profile && (
        <Text style={styles.empty}>Connectez-vous pour accéder à la messagerie cabinet.</Text>
      )}

      {mustVerify && (
        <Text style={styles.blocked}>
          Messagerie bloquée. Validez votre diplôme depuis l'onglet Cabinet.
        </Text>
      )}

      {loading ? (
        <SkeletonList count={5} variant="row" />
      ) : !profile ? null : sortedThreads.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucun message</Text>
          <Text style={styles.empty}>
            Les joueurs vous contactent depuis la fiche santé ou après un rendez-vous confirmé.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedThreads}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <StaggerReveal index={index}>
              <PressableSpring
                style={[
                  styles.thread,
                  item.thread_kind === 'physio_care' && styles.threadCare,
                ]}
                onPress={() => !mustVerify && setActiveThreadId(item.id)}
                disabled={!!mustVerify}
                scaleTo={0.99}
                haptic={!mustVerify}
              >
                <View style={[styles.avatar, item.thread_kind === 'physio_care' && styles.avatarCare]}>
                  <Text style={styles.avatarText}>
                    {item.participant_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.threadBody}>
                  <View style={styles.threadTop}>
                    <View style={styles.threadNameRow}>
                      <Text style={styles.threadName}>{item.participant_name}</Text>
                      {physioCareThreadLabel(item.thread_kind) ? (
                        <Text style={styles.careBadge}>
                          {physioCareThreadLabel(item.thread_kind)}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.threadTime}>
                      {item.updated_at.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.threadPreview} numberOfLines={1}>
                    {item.last_message || 'Nouvelle conversation'}
                  </Text>
                </View>
                {item.unread ? <View style={styles.unreadDot} /> : null}
              </PressableSpring>
            </StaggerReveal>
          )}
        />
      )}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    loader: { marginTop: spacing.xl },
    emptyCard: {
      marginHorizontal: spacing.lg,
      padding: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: c.text, marginBottom: spacing.sm },
    empty: {
      color: c.textMuted,
      textAlign: 'center',
      padding: spacing.xl,
      fontSize: 14,
      lineHeight: 22,
    },
    blocked: {
      color: MEDICAL_THEME.warning,
      backgroundColor: MEDICAL_THEME.warningBg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      fontSize: 13,
      lineHeight: 20,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
    },
    thread: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    threadCare: {
      borderColor: c.borderMedium,
      backgroundColor: c.brandSoft,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceInverse,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    avatarCare: { backgroundColor: c.accent },
    avatarText: { fontSize: 18, fontWeight: '900', color: c.brandInverse },
    threadBody: { flex: 1 },
    threadTop: { flexDirection: 'row', justifyContent: 'space-between' },
    threadNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    threadName: { fontSize: 15, fontWeight: '700', color: c.text },
    careBadge: {
      fontSize: 9,
      fontWeight: '900',
      color: c.accent,
      backgroundColor: c.brandSoft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    threadTime: { fontSize: 11, color: c.textMuted },
    threadPreview: { fontSize: 13, color: c.textSecondary, marginTop: 4 },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: MEDICAL_THEME.primary,
      marginLeft: spacing.sm,
    },
  });
}

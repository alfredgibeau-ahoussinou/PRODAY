import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useMessagesData } from '../hooks/useAppData';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { profileService } from '../services/profile.service';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { physioCareThreadLabel } from '../utils/physioMessaging';
import { ChatScreen } from './ChatScreen';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

export const MessagesScreen: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const { pendingChatThreadId, clearPendingChat } = useTabNavigation();
  const { threads, loading, refresh } = useMessagesData(profile?.uid);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';

  const mustVerify =
    profile &&
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
    !profileService.canPerformSensitiveAction(profile);

  useEffect(() => {
    if (pendingChatThreadId) {
      setActiveThreadId(pendingChatThreadId);
      clearPendingChat();
    }
  }, [pendingChatThreadId, clearPendingChat]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  if (activeThreadId && profile && activeThread) {
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

  if (activeThreadId && profile) {
    return (
      <ChatScreen
        threadId={activeThreadId}
        otherName="Conversation"
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
      <ScreenHeader
        label="Messagerie"
        title="Messages"
        subtitle={
          isWoman
            ? 'Coach, agent, kiné joueuse'
            : 'Coach, agent, kiné joueur'
        }
        showBrandLogo
      />
      <Text style={styles.notice}>
        Comptes mineurs : contacts approuvés uniquement. Coachs et agents doivent être
        vérifiés (badge vert) pour contacter un mineur.
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
        <ActivityIndicator color={c.brand} style={styles.loader} />
      ) : !profile ? null : threads.length === 0 ? (
        <Text style={styles.empty}>
          {isWoman
            ? 'Aucune conversation. Contactez une joueuse ou un coach depuis Recrutement.'
            : 'Aucune conversation. Contactez un joueur ou un coach depuis Recrutement.'}
        </Text>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.thread}
              onPress={() => !mustVerify && setActiveThreadId(item.id)}
              disabled={!!mustVerify}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.participant_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.threadBody}>
                <View style={styles.threadTop}>
                  <View style={styles.threadNameRow}>
                    <Text style={styles.threadName}>{item.participant_name}</Text>
                    {physioCareThreadLabel(item.thread_kind) ? (
                      <Text style={styles.kineBadge}>
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
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    notice: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    loader: { marginTop: spacing.xl },
    empty: {
      color: c.textMuted,
      textAlign: 'center',
      padding: spacing.xl,
      fontSize: 14,
      lineHeight: 22,
    },
    blocked: {
      color: c.warning,
      backgroundColor: c.warningBg,
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
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceInverse,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    avatarText: { fontSize: 18, fontWeight: '900', color: c.brandInverse },
    threadBody: { flex: 1 },
    threadTop: { flexDirection: 'row', justifyContent: 'space-between' },
    threadNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    threadName: { fontSize: 15, fontWeight: '700', color: c.text },
    kineBadge: {
      fontSize: 9,
      fontWeight: '900',
      color: c.accent,
      backgroundColor: c.accentSoft,
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
      backgroundColor: c.brand,
      marginLeft: spacing.sm,
    },
  });
}

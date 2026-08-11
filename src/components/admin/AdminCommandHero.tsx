import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useAdminData } from '../../context/AdminDataContext';
import { adminChrome } from './adminStyles';
import { spacing } from '../../theme/designTokens';

export const ADMIN_SITE_URL = 'https://proday75.fr';

interface AdminCommandHeroProps {
  onOpenInbox: () => void;
}

export const AdminCommandHero: React.FC<AdminCommandHeroProps> = ({ onOpenInbox }) => {
  const { profile } = useAuth();
  const { workQueue, stats, lastRefreshedAt } = useAdminData();
  const styles = useMemo(() => createStyles(), []);

  const name = profile?.display_name?.split(' ')[0] || 'Admin';
  const pending = workQueue.length;
  const syncLabel = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={styles.hero}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>ProDay</Text>
        <View style={styles.adminPill}>
          <Text style={styles.adminPillText}>Admin HQ</Text>
        </View>
      </View>
      <Text style={styles.greeting}>Bonjour {name}</Text>
      <Text style={styles.headline}>
        {pending > 0
          ? `${pending} priorité${pending > 1 ? 's' : ''} à traiter`
          : 'Rien en attente'}
      </Text>
      <Text style={styles.sub}>
        {stats
          ? `${stats.users} comptes · ${stats.clubs} clubs · ${syncLabel}`
          : `Espace admin · ${syncLabel}`}
      </Text>

      <View style={styles.actions}>
        <PressableSpring onPress={onOpenInbox} style={styles.primaryBtn} scaleTo={0.97} haptic>
          <Text style={styles.primaryBtnText}>
            {pending > 0 ? `Ouvrir la file (${pending})` : 'Ouvrir la file'}
          </Text>
        </PressableSpring>
        <PressableSpring
          onPress={() => void Linking.openURL(ADMIN_SITE_URL)}
          style={styles.ghostBtn}
          scaleTo={0.97}
          haptic
        >
          <Icon name="globe" size={16} color={adminChrome.accent} />
        </PressableSpring>
      </View>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    hero: {
      backgroundColor: adminChrome.band,
      borderRadius: 2,
      padding: spacing.lg,
      gap: 4,
      marginBottom: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    brand: {
      color: adminChrome.accent,
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 1.4,
    },
    adminPill: {
      backgroundColor: adminChrome.soft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.accentMuted,
    },
    adminPillText: {
      color: adminChrome.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    greeting: {
      color: adminChrome.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    headline: {
      color: adminChrome.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      lineHeight: 30,
      marginTop: 2,
    },
    sub: {
      color: adminChrome.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    primaryBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: adminChrome.accent,
      paddingVertical: 13,
      paddingHorizontal: spacing.md,
      borderRadius: 2,
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    ghostBtn: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
  });
}

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CAROUSEL_POLE_ORDER } from '../../models/CarouselPole';
import { getCarouselPoleIdentity } from '../../content/carouselPoleExperience';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export const ADMIN_SITE_URL = 'https://proday75.fr';

export const ADMIN_PLATFORM_STATUS = {
  siteLabel: 'proday75.fr',
  siteHint: 'Site vitrine · Netlify · domaine canonique',
  tlsHint: 'Certificat Let’s Encrypt en finalisation (DNS aligné)',
  appHint: 'App mobile · Firebase · règles admin via claim',
} as const;

interface AdminPlatformBriefProps {
  compact?: boolean;
}

export const AdminPlatformBrief: React.FC<AdminPlatformBriefProps> = ({ compact = false }) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  const poles = CAROUSEL_POLE_ORDER.map((pole) => {
    const identity = getCarouselPoleIdentity(pole);
    return { pole, label: identity.accentLabel, tagline: identity.tagline };
  });

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Icon name="globe" size={18} color={c.brand} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>ProDay · plateforme</Text>
          <Text style={styles.title}>6 pôles · production</Text>
        </View>
      </View>

      <PressableSpring
        onPress={() => void Linking.openURL(ADMIN_SITE_URL)}
        scaleTo={0.98}
        haptic
      >
        <View style={styles.siteRow}>
          <Icon name="globe" size={16} color={c.brand} />
          <View style={styles.siteBody}>
            <Text style={styles.siteUrl}>{ADMIN_PLATFORM_STATUS.siteLabel}</Text>
            <Text style={styles.siteHint}>{ADMIN_PLATFORM_STATUS.siteHint}</Text>
          </View>
          <Icon name="chevron-forward" size={16} color={c.textMuted} />
        </View>
      </PressableSpring>

      {!compact ? (
        <>
          <Text style={styles.sectionLabel}>Pôles carousel</Text>
          <View style={styles.poleGrid}>
            {poles.map((item) => (
              <View key={item.pole} style={styles.poleChip}>
                <Text style={styles.poleLabel}>{item.label}</Text>
                <Text style={styles.poleHint} numberOfLines={2}>
                  {item.tagline}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.poleInline}>
          {poles.map((p) => p.label).join(' · ')}
        </Text>
      )}

      <View style={styles.statusRow}>
        <StatusDot label="DNS public" level="ok" styles={styles} colors={c} />
        <StatusDot label="TLS proday75.fr" level="mid" styles={styles} colors={c} />
        <StatusDot label="Console admin" level="ok" styles={styles} colors={c} />
      </View>
      <Text style={styles.footerNote}>
        {ADMIN_PLATFORM_STATUS.tlsHint}. {ADMIN_PLATFORM_STATUS.appHint}.
      </Text>
    </View>
  );
};

const StatusDot: React.FC<{
  label: string;
  level: 'ok' | 'mid';
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
}> = ({ label, level, styles, colors: c }) => {
  const dotColor = level === 'ok' ? c.success : c.warning;
  return (
    <View style={styles.statusChip}>
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: adminChrome.shellBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.accentMuted,
    },
    headText: { flex: 1 },
    eyebrow: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.brand,
    },
    title: { fontSize: 16, fontWeight: '800', color: c.text, marginTop: 2 },
    siteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
    },
    siteBody: { flex: 1 },
    siteUrl: { fontSize: 14, fontWeight: '800', color: c.text },
    siteHint: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginTop: spacing.xs,
    },
    poleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    poleChip: {
      width: '47%',
      minWidth: 130,
      flexGrow: 1,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      gap: 2,
    },
    poleLabel: { fontSize: 12, fontWeight: '800', color: c.text },
    poleHint: { fontSize: 10, color: c.textMuted, lineHeight: 14 },
    poleInline: { fontSize: 11, color: c.textSecondary, lineHeight: 16 },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusLabel: { fontSize: 10, fontWeight: '700', color: c.textMuted },
    footerNote: { fontSize: 11, color: c.textMuted, lineHeight: 16 },
  });
}

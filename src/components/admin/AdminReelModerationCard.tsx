import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { CommunityReel } from '../../models/CommunityReel';
import { Icon } from '../ui/Icon';
import { AdminReelVideoPreview } from './AdminReelVideoPreview';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminReelModerationCardProps {
  reel: CommunityReel;
  statusLabel: string;
  meta: string;
  playing: boolean;
  onTogglePlay: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete: () => void;
}

export const AdminReelModerationCard: React.FC<AdminReelModerationCardProps> = ({
  reel,
  statusLabel,
  meta,
  playing,
  onTogglePlay,
  onApprove,
  onReject,
  onDelete,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.card}>
      <AdminReelVideoPreview videoUrl={reel.video_url} active={playing} colors={c} />
      <TouchableOpacity style={styles.playBtn} onPress={onTogglePlay} activeOpacity={0.85}>
        <Icon name={playing ? 'close' : 'eye'} size={14} color={c.brandInverse} />
        <Text style={styles.playBtnText}>{playing ? 'Pause' : 'Lire la vidéo'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{reel.author_name}</Text>
      <Text style={styles.subtitle} numberOfLines={3}>
        {reel.caption || 'Sans légende'}
      </Text>
      <Text style={styles.meta}>
        {statusLabel} · {meta}
      </Text>

      <View style={styles.actions}>
        {onApprove ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={onApprove}>
            <Text style={styles.primaryText}>Approuver</Text>
          </TouchableOpacity>
        ) : null}
        {onReject ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onReject}>
            <Text style={styles.secondaryText}>Refuser</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Icon name="close" size={18} color={c.brandInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    playBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.ink,
      borderRadius: radius.pill,
      paddingVertical: 8,
      marginBottom: spacing.sm,
    },
    playBtnText: { color: c.brandInverse, fontSize: 12, fontWeight: '800' },
    title: { fontSize: 15, fontWeight: '900', color: c.text },
    subtitle: { fontSize: 12, color: c.textSecondary, marginTop: 4, lineHeight: 18 },
    meta: { fontSize: 11, color: c.textMuted, marginTop: 4, fontWeight: '600' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
    primaryBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: c.brand,
    },
    primaryText: { fontSize: 11, fontWeight: '900', color: c.brandInverse },
    secondaryBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    secondaryText: { fontSize: 11, fontWeight: '800', color: c.text },
    deleteBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 'auto',
    },
  });
}

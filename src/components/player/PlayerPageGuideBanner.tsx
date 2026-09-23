import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { APPLE_FONT_STACK } from '../../theme/appleTypography';

interface PlayerPageGuideBannerProps {
  pageKey: string;
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  onOpenGuide: () => void;
}

const STORAGE_PREFIX = 'proday_guide_dismissed_';

export const PlayerPageGuideBanner: React.FC<PlayerPageGuideBannerProps> = ({
  pageKey,
  title,
  subtitle,
  badgeLabel = 'GUIDE INTERACTIF',
  onOpenGuide,
}) => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(`${STORAGE_PREFIX}${pageKey}`).then((val) => {
      if (isMounted && val !== 'true') {
        setVisible(true);
      }
    }).catch(() => {
      if (isMounted) setVisible(true);
    });
    return () => {
      isMounted = false;
    };
  }, [pageKey]);

  if (!visible) return null;

  const handleDismiss = () => {
    prodayHaptics.selection();
    setVisible(false);
    AsyncStorage.setItem(`${STORAGE_PREFIX}${pageKey}`, 'true').catch(() => {});
  };

  const handleOpen = () => {
    prodayHaptics.selection();
    onOpenGuide();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.contentRow}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <Ionicons name="help-circle" size={18} color={PLAYER_DARK.accent} />
        </View>

        <View style={styles.textCol}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle ? <Text style={styles.subText}>{subtitle}</Text> : null}
        </View>

        <View style={styles.actionRow}>
          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Voir</Text>
            <Ionicons name="chevron-forward" size={12} color={PLAYER_DARK.accent} />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={handleDismiss}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}

        accessibilityRole="button"
        accessibilityLabel="Fermer">
        <Ionicons name="close" size={15} color={PLAYER_DARK.textDim} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.accentSoft,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PLAYER_DARK.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  badgeRow: {
    marginBottom: 1,
  },
  badgeText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    fontWeight: '800',
    color: PLAYER_DARK.accent,
    letterSpacing: 0.5,
  },
  titleText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  subText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10.5,
    color: PLAYER_DARK.textMuted,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: PLAYER_DARK.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionBtnText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '700',
    color: PLAYER_DARK.accent,
  },
  closeBtn: {
    padding: 4,
  },
});

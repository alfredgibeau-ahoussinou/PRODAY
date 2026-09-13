import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';

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
          <Ionicons name="help-circle" size={18} color="#30D158" />
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
            <Ionicons name="chevron-forward" size={12} color="#30D158" />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={handleDismiss}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={15} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
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
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
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
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.5,
  },
  titleText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    color: '#94A3B8',
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
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    color: '#30D158',
  },
  closeBtn: {
    padding: 4,
  },
});

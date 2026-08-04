import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { Icon } from '../../components/ui/Icon';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell, type ParentTabId } from '../../navigation/parentShellContext';
import { parentalGuardianService } from '../../services/parentalGuardian.service';
import { useAuth } from '../../context/AuthContext';
import { normalizeGuardianEmail } from '../../utils/guardianEmail';

interface Props {
  onOpenTab: (tab: ParentTabId) => void;
}

export const ParentHomeScreen: React.FC<Props> = ({ onOpenTab }) => {
  const { colors: c } = useThemedScreen();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { children, selected, setSelectedUid, loading, reload } = useParentShell();
  const email = normalizeGuardianEmail(profile?.email);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!email) return;
    return parentalGuardianService.subscribeGuardianNotifications(email, (items) => {
      setNotifCount(items.filter((n) => !n.read_at).length);
    });
  }, [email]);

  const markNotifs = useCallback(async () => {
    if (!email) return;
    try {
      await parentalGuardianService.markGuardianNotificationsRead(email);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('physio.dashboard.errorFallback'));
    }
  }, [email, t]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProDaySurface variant="module" style={styles.hero}>
        <Icon name="shield" size={28} color={c.brand} />
        <ProDayText variant="section">{t('parent.home.title')}</ProDayText>
        <ProDayText variant="body" muted style={styles.heroBody}>
          {t('parent.home.heroBody')}
        </ProDayText>
        {notifCount > 0 ? (
          <Pressable onPress={() => void markNotifs()} style={[styles.pill, { backgroundColor: c.accentSoft }]}>
            <ProDayText variant="caption" accent>
              {t('parent.home.notifCta', { n: notifCount })}
            </ProDayText>
          </Pressable>
        ) : null}
      </ProDaySurface>

      {children.length === 0 ? (
        <ProDaySurface variant="module" style={styles.card}>
          <ProDayText variant="section">{t('parent.home.noChildren.title')}</ProDayText>
          <ProDayText variant="body" muted>
            {t('parent.home.noChildren.body')}
          </ProDayText>
          <Pressable onPress={() => void reload()}>
            <ProDayText variant="caption" accent style={styles.link}>
              {t('parent.home.refresh')}
            </ProDayText>
          </Pressable>
        </ProDaySurface>
      ) : (
        children.map((child) => (
          <ProDaySurface key={child.uid} variant="module" style={styles.card}>
            <Pressable
              onPress={() => {
                setSelectedUid(child.uid);
                onOpenTab('profil');
              }}
            >
              <ProDayText variant="section">{child.display_name}</ProDayText>
              <ProDayText variant="caption" muted>
                {t('parent.home.todayUsage', { n: child.minutesUsedToday })} ·{' '}
                {child.alerts.length > 0
                  ? t('parent.home.alerts', { n: child.alerts.length })
                  : t('parent.home.allOk')}
              </ProDayText>
            </Pressable>
            {child.alerts.map((a) => (
              <ProDayText key={a} variant="caption" accent>
                · {a}
              </ProDayText>
            ))}
            <View style={styles.row}>
              <Pressable onPress={() => { setSelectedUid(child.uid); onOpenTab('messages'); }}>
                <ProDayText variant="caption" accent style={styles.link}>
                  {t('parent.home.tab.messages')}
                </ProDayText>
              </Pressable>
              <Pressable onPress={() => { setSelectedUid(child.uid); onOpenTab('agenda'); }}>
                <ProDayText variant="caption" accent style={styles.link}>
                  {t('parent.home.tab.agenda')}
                </ProDayText>
              </Pressable>
              <Pressable onPress={() => { setSelectedUid(child.uid); onOpenTab('trajet'); }}>
                <ProDayText variant="caption" accent style={styles.link}>
                  {t('parent.home.tab.trajet')}
                </ProDayText>
              </Pressable>
              <Pressable onPress={() => { setSelectedUid(child.uid); onOpenTab('reglages'); }}>
                <ProDayText variant="caption" accent style={styles.link}>
                  {t('parent.home.tab.reglages')}
                </ProDayText>
              </Pressable>
            </View>
            {selected?.uid === child.uid ? (
              <ProDayText variant="caption" muted>
                {t('parent.home.selectedChild')}
              </ProDayText>
            ) : null}
          </ProDaySurface>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  heroBody: { textAlign: 'center', lineHeight: 22 },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  link: { fontWeight: '700' },
});

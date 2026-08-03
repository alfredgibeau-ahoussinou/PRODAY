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
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
    }
  }, [email]);

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
        <ProDayText variant="section">Espace Parent</ProDayText>
        <ProDayText variant="body" muted style={styles.heroBody}>
          Compte indépendant lié à votre enfant. Vous supervisez profil, messages, agenda et
          trajets — sans modifier ses statistiques sportives.
        </ProDayText>
        {notifCount > 0 ? (
          <Pressable onPress={() => void markNotifs()} style={[styles.pill, { backgroundColor: c.accentSoft }]}>
            <ProDayText variant="caption" accent>
              {notifCount} notification(s) — marquer comme lu
            </ProDayText>
          </Pressable>
        ) : null}
      </ProDaySurface>

      {children.length === 0 ? (
        <ProDaySurface variant="module" style={styles.card}>
          <ProDayText variant="section">Aucun enfant lié</ProDayText>
          <ProDayText variant="body" muted>
            Lors de l’inscription mineur, votre e-mail parent crée automatiquement ce compte.
            Vous pouvez aussi lier un enfant via le code famille dans Réglages.
          </ProDayText>
          <Pressable onPress={() => void reload()}>
            <ProDayText variant="caption" accent style={styles.link}>
              Actualiser
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
                {child.minutesUsedToday} min aujourd’hui ·{' '}
                {child.alerts.length > 0 ? `${child.alerts.length} alerte(s)` : 'OK'}
              </ProDayText>
            </Pressable>
            {child.alerts.map((a) => (
              <ProDayText key={a} variant="caption" accent>
                · {a}
              </ProDayText>
            ))}
            <View style={styles.row}>
              <Pressable onPress={() => { setSelectedUid(child.uid); onOpenTab('messages'); }}>
                <ProDayText variant="caption" accent style={styles.link}>Messages</ProDayText>
              </Pressable>
              <Pressable onPress={() => { setSelectedUid(child.uid); onOpenTab('agenda'); }}>
                <ProDayText variant="caption" accent style={styles.link}>Agenda</ProDayText>
              </Pressable>
              <Pressable onPress={() => { setSelectedUid(child.uid); onOpenTab('trajet'); }}>
                <ProDayText variant="caption" accent style={styles.link}>Trajet</ProDayText>
              </Pressable>
              <Pressable onPress={() => { setSelectedUid(child.uid); onOpenTab('reglages'); }}>
                <ProDayText variant="caption" accent style={styles.link}>Réglages</ProDayText>
              </Pressable>
            </View>
            {selected?.uid === child.uid ? (
              <ProDayText variant="caption" muted>
                Enfant sélectionné
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

import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import { parentalGuardianService } from '../../services/parentalGuardian.service';
import { ParentalTimeLimitScreen } from '../ParentalTimeLimitScreen';
import { ParentalActivityReportScreen } from '../ParentalActivityReportScreen';
import { useAuth } from '../../context/AuthContext';
import { normalizeGuardianEmail } from '../../utils/guardianEmail';
import type { ParentalEmergencyContact } from '../../models/ParentalSettings';
import { PushScreenTransition } from '../../components/motion';

interface Props {
  onSignOut: () => Promise<void> | void;
}

type SubMode = 'list' | 'time' | 'report';

export const ParentSettingsScreen: React.FC<Props> = ({ onSignOut }) => {
  const { colors: c } = useThemedScreen();
  const { profile } = useAuth();
  const { selected, reload } = useParentShell();
  const email = normalizeGuardianEmail(profile?.email);
  const [mode, setMode] = useState<SubMode>('list');
  const [saving, setSaving] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [emName, setEmName] = useState('');
  const [emPhone, setEmPhone] = useState('');
  const [emRelation, setEmRelation] = useState('');

  const emergency = useMemo(
    () => selected?.settings.emergency_contacts ?? [],
    [selected],
  );

  const patch = async (
    next: Parameters<typeof parentalGuardianService.updateChildScreenTime>[2],
  ) => {
    if (!selected || !email) return;
    setSaving(true);
    try {
      await parentalGuardianService.updateChildScreenTime(selected.uid, email, next);
      await reload();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Modification impossible');
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'time' && selected) {
    return (
      <PushScreenTransition active>
        <ParentalTimeLimitScreen
          minutes={selected.settings.daily_limit_minutes}
          activeDays={selected.settings.active_days}
          onBack={() => setMode('list')}
          onSave={(daily_limit_minutes, active_days) => {
            void patch({
              daily_limit_minutes,
              active_days,
              screen_time_enabled: true,
            }).then(() => setMode('list'));
          }}
        />
      </PushScreenTransition>
    );
  }

  if (mode === 'report' && selected) {
    return (
      <PushScreenTransition active>
        <ParentalActivityReportScreen
          childUid={selected.uid}
          childName={selected.display_name}
          onBack={() => setMode('list')}
        />
      </PushScreenTransition>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProDayText variant="section">Permissions & confidentialité</ProDayText>

      {!selected ? (
        <ProDayText variant="body" muted>
          Sélectionnez un enfant pour gérer les réglages.
        </ProDayText>
      ) : (
        <>
          <ProDaySurface variant="module" style={styles.card}>
            <Row
              label="Temps d’écran"
              value={!!selected.settings.screen_time_enabled}
              disabled={saving}
              onChange={(screen_time_enabled) => void patch({ screen_time_enabled })}
              colors={c}
            />
            <Row
              label="Restriction messagerie"
              value={selected.settings.messaging_restricted !== false}
              disabled={saving}
              onChange={(messaging_restricted) =>
                void parentPortalService
                  .updateMessagingRestriction(selected.uid, email!, messaging_restricted)
                  .then(reload)
              }
              colors={c}
            />
            <Row
              label="Partage trajet live"
              value={selected.settings.privacy?.share_live_carpool !== false}
              disabled={saving}
              onChange={(share_live_carpool) =>
                void parentPortalService
                  .updatePrivacy(selected.uid, email!, {
                    ...selected.settings.privacy,
                    share_live_carpool,
                  })
                  .then(reload)
              }
              colors={c}
            />
            <Row
              label="Lecture des messages"
              value={selected.settings.privacy?.parent_can_read_messages !== false}
              disabled={saving}
              onChange={(parent_can_read_messages) =>
                void parentPortalService
                  .updatePrivacy(selected.uid, email!, {
                    ...selected.settings.privacy,
                    parent_can_read_messages,
                  })
                  .then(reload)
              }
              colors={c}
            />
            <Pressable onPress={() => setMode('time')}>
              <ProDayText variant="caption" accent style={styles.link}>
                Configurer les limites de temps
              </ProDayText>
            </Pressable>
            <Pressable onPress={() => setMode('report')}>
              <ProDayText variant="caption" accent style={styles.link}>
                Historique d’activité
              </ProDayText>
            </Pressable>
          </ProDaySurface>

          <ProDaySurface variant="module" style={styles.card}>
            <ProDayText variant="section">Contacts d’urgence</ProDayText>
            {emergency.map((contact) => (
              <View key={contact.id} style={styles.emRow}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="body">{contact.name}</ProDayText>
                  <ProDayText variant="caption" muted>
                    {contact.phone}
                    {contact.relation ? ` · ${contact.relation}` : ''}
                  </ProDayText>
                </View>
                <Pressable
                  onPress={() =>
                    void parentPortalService
                      .updateEmergencyContacts(
                        selected.uid,
                        email!,
                        emergency.filter((e) => e.id !== contact.id),
                      )
                      .then(reload)
                  }
                >
                  <ProDayText variant="caption" muted>
                    Retirer
                  </ProDayText>
                </Pressable>
              </View>
            ))}
            <TextInput
              value={emName}
              onChangeText={setEmName}
              placeholder="Nom"
              placeholderTextColor={c.textMuted}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            <TextInput
              value={emPhone}
              onChangeText={setEmPhone}
              placeholder="Téléphone"
              keyboardType="phone-pad"
              placeholderTextColor={c.textMuted}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            <TextInput
              value={emRelation}
              onChangeText={setEmRelation}
              placeholder="Lien (ex. grand-mère)"
              placeholderTextColor={c.textMuted}
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            <Pressable
              onPress={() => {
                if (!emName.trim() || !emPhone.trim()) {
                  Alert.alert('Champs requis', 'Indiquez un nom et un téléphone.');
                  return;
                }
                const next: ParentalEmergencyContact[] = [
                  ...emergency,
                  {
                    id: `em_${Date.now()}`,
                    name: emName.trim(),
                    phone: emPhone.trim(),
                    relation: emRelation.trim() || undefined,
                  },
                ];
                void parentPortalService
                  .updateEmergencyContacts(selected.uid, email!, next)
                  .then(() => {
                    setEmName('');
                    setEmPhone('');
                    setEmRelation('');
                    return reload();
                  });
              }}
            >
              <ProDayText variant="caption" accent style={styles.link}>
                Ajouter le contact
              </ProDayText>
            </Pressable>
          </ProDaySurface>
        </>
      )}

      <ProDaySurface variant="module" style={styles.card}>
        <ProDayText variant="section">Lier un autre enfant</ProDayText>
        <ProDayText variant="caption" muted>
          Code à 6 chiffres affiché sur le téléphone de l’enfant.
        </ProDayText>
        <TextInput
          value={inviteCode}
          onChangeText={setInviteCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          placeholderTextColor={c.textMuted}
          style={[styles.input, { borderColor: c.border, color: c.text }]}
        />
        <Pressable
          onPress={() => {
            if (!email) return;
            void parentalGuardianService
              .linkWithInviteCode(email, inviteCode)
              .then((name) => {
                setInviteCode('');
                Alert.alert('Lié', `${name} est maintenant lié à votre compte.`);
                return reload();
              })
              .catch((e) =>
                Alert.alert('Liaison impossible', e instanceof Error ? e.message : 'Code invalide'),
              );
          }}
        >
          <ProDayText variant="caption" accent style={styles.link}>
            Valider le code
          </ProDayText>
        </Pressable>
      </ProDaySurface>

      <Pressable
        onPress={() =>
          Alert.alert('Déconnexion', 'Quitter le portail parent ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', style: 'destructive', onPress: () => void onSignOut() },
          ])
        }
      >
        <ProDayText variant="caption" muted style={styles.link}>
          Se déconnecter
        </ProDayText>
      </Pressable>
    </ScrollView>
  );
};

function Row({
  label,
  value,
  onChange,
  disabled,
  colors: c,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  colors: { border: string; brandSoft: string; brand: string; surface: string };
}) {
  return (
    <View style={styles.row}>
      <ProDayText variant="body" style={{ flex: 1 }}>
        {label}
      </ProDayText>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: c.border, true: c.brandSoft }}
        thumbColor={value ? c.brand : c.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  link: { fontWeight: '700' },
});

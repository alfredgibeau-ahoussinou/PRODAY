import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import { parentalGuardianService } from '../../services/parentalGuardian.service';
import { authService } from '../../services/auth.service';
import { ParentalTimeLimitScreen } from '../ParentalTimeLimitScreen';
import { ParentalActivityReportScreen } from '../ParentalActivityReportScreen';
import { LanguageSettingControl } from '../../components/settings/LanguageSettingControl';
import { UnifiedSettingsModal } from '../../components/settings/UnifiedSettingsModal';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { useAuth } from '../../context/AuthContext';
import { normalizeGuardianEmail } from '../../utils/guardianEmail';
import type { ParentalEmergencyContact } from '../../models/ParentalSettings';
import { PushScreenTransition, PressableSpring } from '../../components/motion';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import {
  ParentActionButton,
  ParentSectionCard,
} from '../../components/parent/parentPortalUi';
import { ParentUnlockCard } from '../../components/parent/ParentUnlockCard';
import { PARENT_PAGES } from '../../content/parentPageIdentity';
import { useProductLine } from '../../context/ProductLineContext';
import { usePlatformFeatureFlags } from '../../hooks/usePlatformFeatureFlags';

interface Props {
  onSignOut: () => Promise<void> | void;
}

type SubMode = 'list' | 'time' | 'report';

export const ParentSettingsScreen: React.FC<Props> = ({ onSignOut }) => {
  const { colors: c } = useThemedScreen();
  const { profile } = useAuth();
  const { selected, reload } = useParentShell();
  const { openParentSupporterGuest } = useProductLine();
  const { isEnabled } = usePlatformFeatureFlags();
  const email = normalizeGuardianEmail(profile?.email);
  const [mode, setMode] = useState<SubMode>('list');
  const [saving, setSaving] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [emName, setEmName] = useState('');
  const [emPhone, setEmPhone] = useState('');
  const [emRelation, setEmRelation] = useState('');
  const [bonusBusy, setBonusBusy] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [unifiedSettingsOpen, setUnifiedSettingsOpen] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Information', 'Aucune adresse e-mail associée à ce compte.');
      return;
    }
    Alert.alert(
      'Réinitialisation du mot de passe',
      `Envoyer un e-mail de réinitialisation à ${email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            setResetSending(true);
            try {
              await authService.sendPasswordReset(email);
              Alert.alert('Succès', `Un e-mail de réinitialisation a été envoyé à ${email}.`);
            } catch (err) {
              Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec de l’envoi');
            } finally {
              setResetSending(false);
            }
          },
        },
      ],
    );
  };

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
    <ParentPageFrame identity={PARENT_PAGES.reglages}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. PROFIL PARENT & COMPTE */}
        <ParentSectionCard
          title="Profil Parent & Compte"
          subtitle="Identité et rôle légal ProDay"
        >
          <View style={styles.profileRow}>
            <View style={[styles.avatarBox, { backgroundColor: c.brandSoft }]}>
              <ProDayText variant="title" style={{ color: c.brand, fontWeight: '800' }}>
                {(profile?.display_name || email || 'P').charAt(0).toUpperCase()}
              </ProDayText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ProDayText variant="body" style={{ fontWeight: '700' }}>
                {profile?.display_name || 'Parent ProDay'}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {email || 'E-mail non renseigné'}
              </ProDayText>
              <View style={[styles.roleBadge, { backgroundColor: `${c.brand}20` }]}>
                <ProDayText variant="caption" style={{ color: c.brand, fontWeight: '700', fontSize: 11 }}>
                  Espace Suivi Parent · Responsable légal
                </ProDayText>
              </View>
            </View>
          </View>
        </ParentSectionCard>

        {/* 2. LANGUE DE L'APPLICATION */}
        <ParentSectionCard
          title="Langue & Région"
          subtitle="Personnalisez la langue d’affichage de l’espace"
        >
          <LanguageSettingControl variant="card" />
        </ParentSectionCard>

        {/* 3. SÉCURITÉ DU COMPTE & CONDITIONS */}
        <ParentSectionCard
          title="Sécurité & Accès"
          subtitle="Identifiants et protection des données"
        >
          <ParentActionButton
            label={resetSending ? 'Envoi en cours…' : 'Réinitialiser mon mot de passe'}
            icon="lock"
            tone="ghost"
            loading={resetSending}
            onPress={handlePasswordReset}
          />
          <View style={styles.rowActions}>
            <ParentActionButton
              label="Conditions Générales (CGU)"
              icon="document"
              tone="ghost"
              onPress={() => {
                void Linking.openURL('https://proday.app/terms').catch(() => {
                  Alert.alert('CGU ProDay', 'Consultez les conditions d’utilisation sur proday.app/terms');
                });
              }}
            />
            <ParentActionButton
              label="Politique de Confidentialité"
              icon="shield"
              tone="ghost"
              onPress={() => {
                void Linking.openURL('https://proday.app/privacy').catch(() => {
                  Alert.alert('Confidentialité', 'Politique de confidentialité disponible sur proday.app/privacy');
                });
              }}
            />
          </View>
        </ParentSectionCard>

        {!selected ? (
          <ParentSectionCard title="Aucun enfant sélectionné">
            <ProDayText variant="body" muted>
              Sélectionnez un enfant depuis l’accueil pour gérer les réglages de temps d'écran et de messagerie.
            </ProDayText>
          </ParentSectionCard>
        ) : (
          <>
            {email ? (
              <ParentUnlockCard child={selected} guardianEmail={email} onDone={reload} />
            ) : null}

            <ParentSectionCard
              title="Temps d’écran"
              subtitle={`${selected.display_name} · ${selected.minutesUsedToday} / ${selected.settings.daily_limit_minutes ?? 90} min`}
            >
              <Row
                label="Activer la limite"
                value={!!selected.settings.screen_time_enabled}
                disabled={saving}
                onChange={(screen_time_enabled) => void patch({ screen_time_enabled })}
                colors={c}
              />
              <View style={styles.rowActions}>
                <ParentActionButton
                  label="Configurer les jours"
                  tone="ghost"
                  icon="time"
                  onPress={() => setMode('time')}
                />
                <ParentActionButton
                  label="+15 min aujourd’hui"
                  icon="add"
                  loading={bonusBusy}
                  onPress={() => {
                    if (!email) return;
                    setBonusBusy(true);
                    void parentPortalService
                      .grantScreenTimeBonus(selected.uid, email, 15)
                      .then(() => {
                        Alert.alert('Bonus', '+15 min accordées.');
                        return reload();
                      })
                      .catch((e) =>
                        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec'),
                      )
                      .finally(() => setBonusBusy(false));
                  }}
                />
                <ParentActionButton
                  label="Historique"
                  tone="ghost"
                  icon="document"
                  onPress={() => setMode('report')}
                />
              </View>
            </ParentSectionCard>

            <ParentSectionCard
              title="Confidentialité & messagerie"
              subtitle="Chaque interrupteur s’applique immédiatement"
            >
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
                label="Filtre contacts"
                value={selected.settings.contacts_filter_enabled !== false}
                disabled={saving}
                onChange={(contacts_filter_enabled) =>
                  void parentPortalService
                    .updateContactsFilter(selected.uid, email!, contacts_filter_enabled)
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
              <Row
                label="Accès dossier médical"
                value={selected.settings.privacy?.parent_can_access_medical === true}
                disabled={saving}
                onChange={(parent_can_access_medical) =>
                  void parentPortalService
                    .updatePrivacy(selected.uid, email!, {
                      ...selected.settings.privacy,
                      parent_can_access_medical,
                    })
                    .then(reload)
                }
                colors={c}
              />
            </ParentSectionCard>

            <ParentSectionCard title="Contacts d’urgence">
              {emergency.map((contact) => (
                <View key={contact.id} style={styles.emRow}>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="body">{contact.name}</ProDayText>
                    <ProDayText variant="caption" muted>
                      {contact.phone}
                      {contact.relation ? ` · ${contact.relation}` : ''}
                    </ProDayText>
                  </View>
                  <PressableSpring
                    onPress={() =>
                      void parentPortalService
                        .updateEmergencyContacts(
                          selected.uid,
                          email!,
                          emergency.filter((e) => e.id !== contact.id),
                        )
                        .then(reload)
                    }
                    haptic
                  >
                    <ProDayText variant="caption" muted>
                      Retirer
                    </ProDayText>
                  </PressableSpring>
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
              <ParentActionButton
                label="Ajouter le contact"
                icon="add"
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
              />
            </ParentSectionCard>
          </>
        )}

        <ParentSectionCard
          title="Pôle Supporter"
          subtitle="Matchs et clubs suivis — vous pourrez revenir ici depuis Profil Supporter"
        >
          <ParentActionButton
            label="Ouvrir le pôle Supporter"
            icon="swap-horizontal"
            onPress={() => {
              if (!isEnabled('supporter')) {
                Alert.alert(
                  'Pôle temporairement fermé',
                  'Le pôle Supporter est désactivé pour le moment.',
                );
                return;
              }
              void openParentSupporterGuest().catch((e) =>
                Alert.alert(
                  'Bascule impossible',
                  e instanceof Error ? e.message : 'Réessayez plus tard.',
                ),
              );
            }}
          />
        </ParentSectionCard>

        <ParentSectionCard
          title="Lier un autre enfant"
          subtitle="Code à 6 chiffres affiché sur le téléphone de l’enfant"
        >
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            placeholderTextColor={c.textMuted}
            style={[styles.input, { borderColor: c.border, color: c.text }]}
          />
          <ParentActionButton
            label="Valider le code"
            icon="checkmark-circle"
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
                  Alert.alert(
                    'Liaison impossible',
                    e instanceof Error ? e.message : 'Code invalide',
                  ),
                );
            }}
          />
        </ParentSectionCard>

        <ParentSectionCard
          title="Réglages Généraux & Liquid Glass"
          subtitle="Personnalisation de l’affichage, alertes directes et préférences"
        >
          <ParentActionButton
            label="Ouvrir les réglages complets"
            icon="settings"
            onPress={() => setUnifiedSettingsOpen(true)}
          />
        </ParentSectionCard>

        <ParentActionButton
          label="Se déconnecter"
          tone="danger"
          icon="log-out"
          onPress={() =>
            Alert.alert('Déconnexion', 'Quitter le portail parent ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Déconnexion', style: 'destructive', onPress: () => void onSignOut() },
            ])
          }
        />
      </ScrollView>

      <UnifiedSettingsModal
        visible={unifiedSettingsOpen}
        onClose={() => setUnifiedSettingsOpen(false)}
        userRole="parent"
        user={profile}
        onSignOut={onSignOut}
      />
    </ParentPageFrame>
  );
};

function Row({
  label,
  value,
  onChange,
  disabled,
  colors: theme,
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
        trackColor={{ false: theme.border, true: theme.brandSoft }}
        thumbColor={value ? theme.brand : theme.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginTop: 2,
  },
});

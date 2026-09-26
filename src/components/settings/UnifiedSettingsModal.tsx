import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { LanguageSettingControl } from './LanguageSettingControl';
import { useAppearance } from '../../context/AppearanceContext';
import { useAuth } from '../../context/AuthContext';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';
import { authService } from '../../services/auth.service';
import { spacing, radius } from '../../theme/designTokens';
import type { UserRole, User } from '../../models/User';
import { prodayAlert } from '../../utils/prodayAlert';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { LiquidGlassMode, LiquidGlassIntensity } from '../../services/appearanceSettings.service';

import { isPlatformAdminEmail } from '../../config/admin';
import { ReportProblemModal } from '../feedback/ReportProblemModal';

export interface UnifiedSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userRole?: UserRole;
  user?: User | null;
  onSignOut?: () => Promise<void> | void;
}

interface PersonalNotificationSettings {
  pushEnabled: boolean;
  matchAlerts: boolean;
  chatMessages: boolean;
  reminders24h: boolean;
}

interface PlayerSpecificSettings {
  position: string;
  strongFoot: 'Droit' | 'Gauche' | 'Ambidextre';
  jerseyNumber: string;
  category: string;
  mercatoVisible: boolean;
}

interface CoachSpecificSettings {
  formation: string;
  autoRsvpReminder: boolean;
  debriefPublicToPlayers: boolean;
}

interface ClubSpecificSettings {
  clubName: string;
  primaryColor: string;
  secondaryColor: string;
  autoScreening: boolean;
  fffSyncActive: boolean;
}

interface ParentSpecificSettings {
  screenTimeLimitHours: number;
  coachDirectAlerts: boolean;
  weeklyReport: boolean;
}

interface AdminSpecificSettings {
  maintenanceMode: boolean;
  verboseLogging: boolean;
}

const SETTINGS_STORAGE_KEY_PREFIX = '@proday:unified_settings:';

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
  visible,
  onClose,
  userRole: propRole,
  user: propUser,
  onSignOut,
}) => {
  const { profile: authProfile } = useAuth();
  const effectiveUser = propUser ?? authProfile;
  const role: UserRole = propRole ?? effectiveUser?.role ?? 'player';
  const isAdmin = !!(effectiveUser?.is_admin || isPlatformAdminEmail(effectiveUser?.email));
  const { confirmDeleteAccount, deleting } = useAccountDeletion();

  // Liquid Glass & Unified Appearance Context
  const {
    themeMode,
    glassMode,
    intensity,
    reduceMotion,
    isEffectiveGlass,
    isEffectiveLight,
    isEffectiveReducedMotion,
    isReducedTransparency,
    isReducedMotion,
    setThemeMode,
    setGlassMode,
    setIntensity,
    setMotionMode,
    resetAppearance,
    tokens: glassTokens,
  } = useAppearance();

  // Active section tab: 'personal' | 'appearance' | 'role' | 'security'
  const [activeTab, setActiveTab] = useState<'personal' | 'appearance' | 'role' | 'security'>('personal');

  // State: Personal Notifications
  const [notifications, setNotifications] = useState<PersonalNotificationSettings>({
    pushEnabled: true,
    matchAlerts: true,
    chatMessages: true,
    reminders24h: true,
  });

  // State: Role Specifics
  const [playerSettings, setPlayerSettings] = useState<PlayerSpecificSettings>({
    position: (effectiveUser?.profile?.position as string) || 'Milieu',
    strongFoot: 'Droit',
    jerseyNumber: effectiveUser?.profile?.jersey_number ? String(effectiveUser.profile.jersey_number) : '10',
    category: (effectiveUser?.profile?.category as string) || 'Seniors',
    mercatoVisible: true,
  });

  const [coachSettings, setCoachSettings] = useState<CoachSpecificSettings>({
    formation: '4-3-3',
    autoRsvpReminder: true,
    debriefPublicToPlayers: true,
  });

  const [clubSettings, setClubSettings] = useState<ClubSpecificSettings>({
    clubName: (effectiveUser?.profile?.job_title as string) || 'Mon Club Sportif',
    primaryColor: '#0EA5E9',
    secondaryColor: '#10B981',
    autoScreening: false,
    fffSyncActive: true,
  });

  const [parentSettings, setParentSettings] = useState<ParentSpecificSettings>({
    screenTimeLimitHours: 2,
    coachDirectAlerts: true,
    weeklyReport: true,
  });

  const [adminSettings, setAdminSettings] = useState<AdminSpecificSettings>({
    maintenanceMode: false,
    verboseLogging: false,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [resetEmailSending, setResetEmailSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Load preferences from storage on mount
  useEffect(() => {
    if (!visible) return;
    const uid = effectiveUser?.uid || 'guest';
    const storageKey = `${SETTINGS_STORAGE_KEY_PREFIX}${uid}`;

    AsyncStorage.getItem(storageKey).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.notifications) setNotifications(parsed.notifications);
          if (parsed.player) setPlayerSettings(parsed.player);
          if (parsed.coach) setCoachSettings(parsed.coach);
          if (parsed.club) setClubSettings(parsed.club);
          if (parsed.parent) setParentSettings(parsed.parent);
          if (parsed.admin) setAdminSettings(parsed.admin);
        } catch {
          // ignore corrupted data
        }
      }
    });
  }, [visible, effectiveUser?.uid]);

  // Save changes handler
  const handleSave = useCallback(async () => {
    prodayHaptics.confirm();
    setSaving(true);
    const uid = effectiveUser?.uid || 'guest';
    const storageKey = `${SETTINGS_STORAGE_KEY_PREFIX}${uid}`;

    const payload = {
      updatedAt: new Date().toISOString(),
      notifications,
      player: playerSettings,
      coach: coachSettings,
      club: clubSettings,
      parent: parentSettings,
      admin: adminSettings,
    };

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
      setSaveSuccessMessage('Réglages enregistrés');
      setTimeout(() => setSaveSuccessMessage(null), 2500);
    } catch (e) {
      prodayAlert.alert('Erreur', 'Impossible de sauvegarder les réglages');
    } finally {
      setSaving(false);
    }
  }, [effectiveUser?.uid, notifications, playerSettings, coachSettings, clubSettings, parentSettings, adminSettings]);

  // Password reset email trigger
  const handlePasswordReset = async () => {
    const email = effectiveUser?.email;
    if (!email) {
      prodayAlert.alert('Information', 'Aucune adresse e-mail trouvée sur ce compte.');
      return;
    }
    Alert.alert(
      'Réinitialisation du mot de passe',
      `Envoyer un e-mail de réinitialisation sécurisé à ${email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            setResetEmailSending(true);
            try {
              await authService.sendPasswordReset(email);
              prodayAlert.alert('E-mail envoyé', `Un lien de réinitialisation a été envoyé à ${email}.`);
            } catch (err) {
              prodayAlert.alert('Erreur', err instanceof Error ? err.message : 'Échec de l’envoi');
            } finally {
              setResetEmailSending(false);
            }
          },
        },
      ],
    );
  };

  const roleLabel = useMemo(() => {
    if (isAdmin) return 'Plateforme Admin';
    switch (role) {
      case 'player': return 'Joueur';
      case 'coach': return 'Coach';
      case 'club': return 'Club';
      case 'parent': return 'Parent';
      default: return 'Membre';
    }
  }, [role, isAdmin]);

  return (
    <AnimatedModalShell
      visible={visible}
      onClose={onClose}
      variant="tall"
      closeLabel="Fermer"
      sheetBackgroundColor="#000000"
    >
      <View style={styles.container}>
        {/* Apple Style Modal Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ProDayText variant="title" style={styles.title}>
              Réglages
            </ProDayText>
            <View style={styles.roleBadge}>
              <View style={[styles.roleDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
          <PressableSpring onPress={onClose} scaleTo={0.92} haptic style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Fermer</Text>
          </PressableSpring>
        </View>

        {/* Tab Navigation Segmented Bar */}
        <View style={styles.tabBar}>
          {(
            [
              { id: 'personal', label: 'Général', icon: 'person' },
              { id: 'appearance', label: 'Liquid Glass', icon: 'shirt' },
              { id: 'role', label: roleLabel, icon: 'football' },
              { id: 'security', label: 'Sécurité', icon: 'shield' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <PressableSpring
                key={tab.id}
                onPress={() => {
                  prodayHaptics.selection();
                  setActiveTab(tab.id);
                }}
                scaleTo={0.96}
                style={[styles.tabItem, active && styles.tabItemActive]}
              >
                <View style={{ marginRight: 5 }}>
                  <Icon
                    name={tab.icon}
                    size={14}
                    color={active ? '#FFFFFF' : '#8E8E93'}
                  />
                </View>
                <Text style={[styles.tabItemText, active && styles.tabItemTextActive]}>
                  {tab.label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>

        {/* Main Content Area */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: PERSONAL & NOTIFICATIONS & LANGUAGE */}
          {activeTab === 'personal' && (
            <View style={styles.sectionGroup}>
              {/* Profile Card */}
              <View style={styles.appleCard}>
                <View style={styles.userRow}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarInitial}>
                      {effectiveUser?.display_name?.charAt(0).toUpperCase() || 'P'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{effectiveUser?.display_name || 'Utilisateur ProDay'}</Text>
                    <Text style={styles.userEmail}>{effectiveUser?.email || 'Non renseigné'}</Text>
                  </View>
                </View>
              </View>

              {/* Language Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>LANGUE & RÉGION</Text>
              </View>
              <View style={styles.appleCard}>
                <LanguageSettingControl />
              </View>

              {/* Notifications Card */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>NOTIFICATIONS</Text>
              </View>
              <View style={styles.appleCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLabelCol}>
                    <Text style={styles.settingTitle}>Notifications Push</Text>
                    <Text style={styles.settingHint}>Recevoir les alertes sur votre appareil</Text>
                  </View>
                  <Switch
                    value={notifications.pushEnabled}
                    onValueChange={(val) => setNotifications((p) => ({ ...p, pushEnabled: val }))}
                    trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                  />
                </View>

                <View style={styles.separator} />

                <View style={styles.settingRow}>
                  <View style={styles.settingLabelCol}>
                    <Text style={styles.settingTitle}>Alertes Jours de Match</Text>
                    <Text style={styles.settingHint}>Rappels des convocations et changements d'heure</Text>
                  </View>
                  <Switch
                    value={notifications.matchAlerts}
                    onValueChange={(val) => setNotifications((p) => ({ ...p, matchAlerts: val }))}
                    trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                  />
                </View>

                <View style={styles.separator} />

                <View style={styles.settingRow}>
                  <View style={styles.settingLabelCol}>
                    <Text style={styles.settingTitle}>Messages du Staff & Chat</Text>
                    <Text style={styles.settingHint}>Directs, groupes d'équipe et conversations</Text>
                  </View>
                  <Switch
                    value={notifications.chatMessages}
                    onValueChange={(val) => setNotifications((p) => ({ ...p, chatMessages: val }))}
                    trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                  />
                </View>

                <View style={styles.separator} />

                <View style={styles.settingRow}>
                  <View style={styles.settingLabelCol}>
                    <Text style={styles.settingTitle}>Relances RSVP automatiques</Text>
                    <Text style={styles.settingHint}>Notification 24h avant clôture de présence</Text>
                  </View>
                  <Switch
                    value={notifications.reminders24h}
                    onValueChange={(val) => setNotifications((p) => ({ ...p, reminders24h: val }))}
                    trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: APPEARANCE & LIQUID GLASS */}
          {activeTab === 'appearance' && (
            <View style={styles.sectionGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>EXPÉRIENCE VISUELLE LIQUID GLASS</Text>
              </View>

              {/* Theme Mode Selection */}
              <View style={styles.appleCard}>
                <Text style={styles.cardSectionTitle}>Thème d'affichage</Text>
                <View style={styles.pillSelectorRow}>
                  {(
                    [
                      { id: 'system', label: 'Système' },
                      { id: 'dark', label: 'Sombre' },
                      { id: 'light', label: 'Clair' },
                    ] as const
                  ).map((t) => {
                    const active = themeMode === t.id;
                    return (
                      <PressableSpring
                        key={t.id}
                        onPress={async () => {
                          prodayHaptics.selection();
                          await setThemeMode(t.id);
                        }}
                        scaleTo={0.96}
                        style={[styles.pillOption, active && styles.pillOptionActive]}
                      >
                        <Text style={[styles.pillOptionText, active && styles.pillOptionTextActive]}>
                          {t.label}
                        </Text>
                      </PressableSpring>
                    );
                  })}
                </View>

                <View style={styles.separator} />

                {/* Glass Mode Selection */}
                <Text style={styles.cardSectionTitle}>Rendu Liquid Glass</Text>
                <View style={styles.pillSelectorRow}>
                  {(
                    [
                      { id: 'system', label: 'Automatique' },
                      { id: 'glass', label: 'Verre Dépoli' },
                      { id: 'opaque', label: 'Opaque' },
                    ] as const
                  ).map((m) => {
                    const active = glassMode === m.id;
                    return (
                      <PressableSpring
                        key={m.id}
                        onPress={async () => {
                          prodayHaptics.selection();
                          await setGlassMode(m.id as LiquidGlassMode);
                        }}
                        scaleTo={0.96}
                        style={[styles.pillOption, active && styles.pillOptionActive]}
                      >
                        <Text style={[styles.pillOptionText, active && styles.pillOptionTextActive]}>
                          {m.label}
                        </Text>
                      </PressableSpring>
                    );
                  })}
                </View>

                <View style={styles.separator} />

                {/* Intensity Selection */}
                <Text style={styles.cardSectionTitle}>Intensité de la translucidité</Text>
                <View style={styles.pillSelectorRow}>
                  {(
                    [
                      { id: 'subtle', label: 'Discret' },
                      { id: 'regular', label: 'Standard' },
                      { id: 'intense', label: 'Intense' },
                    ] as const
                  ).map((it) => {
                    const active = intensity === it.id;
                    return (
                      <PressableSpring
                        key={it.id}
                        onPress={async () => {
                          prodayHaptics.selection();
                          await setIntensity(it.id as LiquidGlassIntensity);
                        }}
                        scaleTo={0.96}
                        style={[styles.pillOption, active && styles.pillOptionActive]}
                      >
                        <Text style={[styles.pillOptionText, active && styles.pillOptionTextActive]}>
                          {it.label}
                        </Text>
                      </PressableSpring>
                    );
                  })}
                </View>

                <View style={styles.separator} />

                {/* Motion Mode Selection */}
                <Text style={styles.cardSectionTitle}>Animations & Effets de mouvement</Text>
                <View style={styles.pillSelectorRow}>
                  {(
                    [
                      { id: 'auto', label: 'Standard' },
                      { id: 'reduce', label: 'Réduit' },
                    ] as const
                  ).map((mot) => {
                    const active = reduceMotion === mot.id;
                    return (
                      <PressableSpring
                        key={mot.id}
                        onPress={async () => {
                          prodayHaptics.selection();
                          await setMotionMode(mot.id);
                        }}
                        scaleTo={0.96}
                        style={[styles.pillOption, active && styles.pillOptionActive]}
                      >
                        <Text style={[styles.pillOptionText, active && styles.pillOptionTextActive]}>
                          {mot.label}
                        </Text>
                      </PressableSpring>
                    );
                  })}
                </View>
              </View>

              {/* Accessibility Notice if OS overrides */}
              {(isReducedTransparency || isReducedMotion) && (
                <View style={[styles.appleCard, { borderColor: '#F59E0B', borderWidth: 1, backgroundColor: 'rgba(245, 158, 11, 0.08)', marginTop: 10 }]}>
                  <Text style={[styles.cardSectionTitle, { color: '#F59E0B', marginBottom: 4 }]}>
                    Priorité Accessibilité Matérielle / OS
                  </Text>
                  {isReducedTransparency && (
                    <Text style={[styles.settingHint, { color: '#D97706', marginBottom: 4 }]}>
                      • Réduction de transparence système active : mode opaque automatique pour un contraste optimal.
                    </Text>
                  )}
                  {isReducedMotion && (
                    <Text style={[styles.settingHint, { color: '#D97706' }]}>
                      • Mouvement réduit système actif : les animations sont simplifiées sans effet de parallaxe.
                    </Text>
                  )}
                </View>
              )}

              {/* Live Preview Card */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>APERÇU DIRECT DU RENDU</Text>
              </View>
              <View style={[styles.appleCard, styles.previewContainer]}>
                <View
                  style={[
                    styles.previewGlassCard,
                    {
                      backgroundColor: glassTokens.bgElevated,
                      borderColor: glassTokens.border,
                    },
                  ]}
                >
                  <View style={styles.previewHeaderRow}>
                    <View style={styles.previewDotWrap}>
                      <View style={[styles.previewDot, { backgroundColor: isEffectiveGlass ? '#00F0A8' : '#3B82F6' }]} />
                      <Text style={[styles.previewBadgeText, { color: glassTokens.text }]}>
                        {isEffectiveGlass ? 'Liquid Glass Actif' : 'Mode Opaque de Sécurité'}
                      </Text>
                    </View>
                    <Text style={[styles.previewModeText, { color: glassTokens.textMuted }]}>
                      {isEffectiveLight ? 'Clair' : 'Sombre'} · {intensity}
                    </Text>
                  </View>
                  <Text style={[styles.previewCardTitle, { color: glassTokens.text }]}>
                    Surface Liquid Glass Apple
                  </Text>
                  <Text style={[styles.previewCardSubtitle, { color: glassTokens.textMuted }]}>
                    Flou optique natif, gestion dynamique du contraste et bordures translucides.
                  </Text>
                </View>
              </View>

              {/* Reset to Default */}
              <PressableSpring
                onPress={async () => {
                  prodayHaptics.confirm();
                  await resetAppearance();
                  prodayAlert.alert('Réinitialisé', 'L’apparence a été réinitialisée par défaut.');
                }}
                scaleTo={0.97}
                style={styles.resetButton}
              >
                <View style={{ marginRight: 6 }}>
                  <Icon name="refresh" size={16} color="#8E8E93" />
                </View>
                <Text style={styles.resetButtonText}>Rétablir les réglages visuels par défaut</Text>
              </PressableSpring>
            </View>
          )}

          {/* TAB 3: ROLE-SPECIFIC SETTINGS */}
          {activeTab === 'role' && (
            <View style={styles.sectionGroup}>
              {/* Player Role Settings */}
              {role === 'player' && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>PROFIL SPORTIF JOUEUR</Text>
                  </View>
                  <View style={styles.appleCard}>
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Poste préférentiel</Text>
                      <TextInput
                        value={playerSettings.position}
                        onChangeText={(txt) => setPlayerSettings((p) => ({ ...p, position: txt }))}
                        style={styles.formInput}
                        placeholder="Ex: Milieu relayeur, Ailier"
                        placeholderTextColor="#636366"
                      />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Pied fort</Text>
                      <View style={styles.miniPills}>
                        {(['Droit', 'Gauche', 'Ambidextre'] as const).map((foot) => {
                          const active = playerSettings.strongFoot === foot;
                          return (
                            <PressableSpring
                              key={foot}
                              onPress={() => setPlayerSettings((p) => ({ ...p, strongFoot: foot }))}
                              style={[styles.miniPill, active && styles.miniPillActive]}
                            >
                              <Text style={[styles.miniPillText, active && styles.miniPillTextActive]}>
                                {foot}
                              </Text>
                            </PressableSpring>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Numéro de maillot officiel</Text>
                      <TextInput
                        value={playerSettings.jerseyNumber}
                        onChangeText={(txt) => setPlayerSettings((p) => ({ ...p, jerseyNumber: txt }))}
                        style={[styles.formInput, { width: 70, textAlign: 'center' }]}
                        keyboardType="number-pad"
                        placeholder="8"
                        placeholderTextColor="#636366"
                      />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelCol}>
                        <Text style={styles.settingTitle}>Visibilité Mercato</Text>
                        <Text style={styles.settingHint}>Permet aux recruteurs certifiés de voir votre CV</Text>
                      </View>
                      <Switch
                        value={playerSettings.mercatoVisible}
                        onValueChange={(val) => setPlayerSettings((p) => ({ ...p, mercatoVisible: val }))}
                        trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Coach Role Settings */}
              {role === 'coach' && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>TACTIQUE & ÉQUIPE COACH</Text>
                  </View>
                  <View style={styles.appleCard}>
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Schéma tactique par défaut</Text>
                      <View style={styles.miniPills}>
                        {(['4-3-3', '4-2-3-1', '3-5-2', '4-4-2'] as const).map((tac) => {
                          const active = coachSettings.formation === tac;
                          return (
                            <PressableSpring
                              key={tac}
                              onPress={() => setCoachSettings((p) => ({ ...p, formation: tac }))}
                              style={[styles.miniPill, active && styles.miniPillActive]}
                            >
                              <Text style={[styles.miniPillText, active && styles.miniPillTextActive]}>
                                {tac}
                              </Text>
                            </PressableSpring>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelCol}>
                        <Text style={styles.settingTitle}>Rappels automatiques de présence</Text>
                        <Text style={styles.settingHint}>Relance auto 24h avant la séance ou le match</Text>
                      </View>
                      <Switch
                        value={coachSettings.autoRsvpReminder}
                        onValueChange={(val) => setCoachSettings((p) => ({ ...p, autoRsvpReminder: val }))}
                        trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                      />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelCol}>
                        <Text style={styles.settingTitle}>Partage débriefs aux joueurs</Text>
                        <Text style={styles.settingHint}>Les joueurs accèdent aux points clés du match</Text>
                      </View>
                      <Switch
                        value={coachSettings.debriefPublicToPlayers}
                        onValueChange={(val) => setCoachSettings((p) => ({ ...p, debriefPublicToPlayers: val }))}
                        trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Club Role Settings */}
              {role === 'club' && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>CONFIGURATION DU CLUB</Text>
                  </View>
                  <View style={styles.appleCard}>
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Dénomination officielle</Text>
                      <TextInput
                        value={clubSettings.clubName}
                        onChangeText={(txt) => setClubSettings((p) => ({ ...p, clubName: txt }))}
                        style={styles.formInput}
                        placeholder="Ex: FC Étoile"
                        placeholderTextColor="#636366"
                      />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelCol}>
                        <Text style={styles.settingTitle}>Filtrage automatique des demandes</Text>
                        <Text style={styles.settingHint}>Exige validation manuelle de chaque joueur</Text>
                      </View>
                      <Switch
                        value={!clubSettings.autoScreening}
                        onValueChange={(val) => setClubSettings((p) => ({ ...p, autoScreening: !val }))}
                        trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                      />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelCol}>
                        <Text style={styles.settingTitle}>Synchronisation FFF / Scores</Text>
                        <Text style={styles.settingHint}>Mise à jour automatique des classements toutes les 3h</Text>
                      </View>
                      <Switch
                        value={clubSettings.fffSyncActive}
                        onValueChange={(val) => setClubSettings((p) => ({ ...p, fffSyncActive: val }))}
                        trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Parent Role Settings */}
              {role === 'parent' && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>SUPERVISION PARENTALE</Text>
                  </View>
                  <View style={styles.appleCard}>
                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelCol}>
                        <Text style={styles.settingTitle}>Alertes directes de l'éducateur</Text>
                        <Text style={styles.settingHint}>Retards, blessures ou convocations urgentes</Text>
                      </View>
                      <Switch
                        value={parentSettings.coachDirectAlerts}
                        onValueChange={(val) => setParentSettings((p) => ({ ...p, coachDirectAlerts: val }))}
                        trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                      />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelCol}>
                        <Text style={styles.settingTitle}>Rapport d'activité hebdomadaire</Text>
                        <Text style={styles.settingHint}>Synthèse des entraînements et temps passé</Text>
                      </View>
                      <Switch
                        value={parentSettings.weeklyReport}
                        onValueChange={(val) => setParentSettings((p) => ({ ...p, weeklyReport: val }))}
                        trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Platform Admin Role Settings */}
              {isAdmin && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>MAINTENANCE ET PLATEFORME ADMIN</Text>
                  </View>
                  <View style={styles.appleCard}>
                    <View style={styles.settingRow}>
                      <View style={styles.settingLabelCol}>
                        <Text style={styles.settingTitle}>Mode maintenance global</Text>
                        <Text style={styles.settingHint}>Affiche un écran de service aux utilisateurs non-admin</Text>
                      </View>
                      <Switch
                        value={adminSettings.maintenanceMode}
                        onValueChange={(val) => setAdminSettings((p) => ({ ...p, maintenanceMode: val }))}
                        trackColor={{ false: '#3A3A3C', true: '#EF4444' }}
                      />
                    </View>

                    <View style={styles.separator} />

                    <PressableSpring
                      onPress={async () => {
                        prodayHaptics.confirm();
                        await AsyncStorage.clear();
                        prodayAlert.alert('Succès', 'Cache local ProDay vidé avec succès.');
                      }}
                      scaleTo={0.97}
                      style={styles.actionRow}
                    >
                      <View style={{ marginRight: 10 }}>
                        <Icon name="refresh" size={18} color="#0EA5E9" />
                      </View>
                      <Text style={[styles.actionRowText, { color: '#0EA5E9' }]}>Purger le cache applicatif local</Text>
                    </PressableSpring>
                  </View>
                </>
              )}
            </View>
          )}

          {/* TAB 4: SECURITY & ACCOUNT ACTIONS */}
          {activeTab === 'security' && (
            <View style={styles.sectionGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>MOT DE PASSE & ACCÈS</Text>
              </View>
              <View style={styles.appleCard}>
                <PressableSpring
                  onPress={handlePasswordReset}
                  disabled={resetEmailSending}
                  scaleTo={0.98}
                  style={styles.actionRow}
                >
                  <View style={{ marginRight: 10 }}>
                    <Icon name="lock" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionRowText}>
                      {resetEmailSending ? 'Envoi en cours…' : 'Changer mon mot de passe'}
                    </Text>
                    <Text style={styles.actionRowHint}>
                      Envoie un lien sécurisé à {effectiveUser?.email}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={16} color="#636366" />
                </PressableSpring>
              </View>

              {/* Assistance & Retour d'Essai Club */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>ASSISTANCE & RETOUR D'ESSAI</Text>
              </View>
              <View style={styles.appleCard}>
                <PressableSpring
                  onPress={() => {
                    prodayHaptics.selection();
                    setShowReportModal(true);
                  }}
                  scaleTo={0.98}
                  style={styles.actionRow}
                >
                  <View style={{ marginRight: 10 }}>
                    <Icon name="alert-circle" size={18} color="#FF9F43" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionRowText}>Signaler un problème technique</Text>
                    <Text style={styles.actionRowHint}>
                      Transmettre une anomalie constatée lors de l'essai club
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={16} color="#636366" />
                </PressableSpring>
              </View>

              {/* Session Management */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>GESTION DE SESSION</Text>
              </View>
              <View style={styles.appleCard}>
                {onSignOut && (
                  <PressableSpring
                    onPress={async () => {
                      prodayHaptics.warning();
                      onClose();
                      await onSignOut();
                    }}
                    scaleTo={0.98}
                    style={styles.actionRow}
                  >
                    <View style={{ marginRight: 10 }}>
                      <Icon name="log-out" size={18} color="#FF453A" />
                    </View>
                    <Text style={[styles.actionRowText, { color: '#FF453A' }]}>Se déconnecter</Text>
                  </PressableSpring>
                )}
              </View>

              {/* Danger Zone */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeaderTitle, { color: '#FF453A' }]}>ZONE DE DANGER</Text>
              </View>
              <View style={[styles.appleCard, styles.dangerCard]}>
                <Text style={styles.dangerWarningText}>
                  La suppression de votre compte efface définitivement toutes vos données, statistiques et affiliations.
                </Text>
                <PressableSpring
                  onPress={confirmDeleteAccount}
                  disabled={deleting}
                  scaleTo={0.98}
                  style={styles.deleteButton}
                >
                  <View style={{ marginRight: 8 }}>
                    <Icon name="trash" size={16} color="#FF453A" />
                  </View>
                  <Text style={styles.deleteButtonText}>
                    {deleting ? 'Suppression en cours…' : 'Supprimer définitivement mon compte'}
                  </Text>
                </PressableSpring>
              </View>
            </View>
          )}

          {/* Bottom Save Action Button */}
          <View style={styles.saveSection}>
            {saveSuccessMessage && (
              <View style={styles.saveSuccessBanner}>
                <View style={{ marginRight: 6 }}>
                  <Icon name="checkmark-circle" size={16} color="#30D158" />
                </View>
                <Text style={styles.saveSuccessText}>{saveSuccessMessage}</Text>
              </View>
            )}
            <PressableSpring
              onPress={handleSave}
              disabled={saving}
              scaleTo={0.98}
              haptic
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </Text>
            </PressableSpring>
          </View>
        </ScrollView>
      </View>

      <ReportProblemModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        userRole={role}
        currentRoute="Paramètres"
      />
    </AnimatedModalShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E5EA',
  },
  doneButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A84FF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabItemTextActive: {
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  sectionGroup: {
    gap: 12,
  },
  sectionHeaderRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8E8E93',
  },
  appleCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 13,
    color: '#8E8E93',
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E5EA',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabelCol: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingHint: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  pillSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  pillOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillOptionActive: {
    backgroundColor: '#0A84FF',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AEAEB2',
  },
  pillOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewContainer: {
    backgroundColor: '#121214',
    padding: 12,
  },
  previewGlassCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#30D158',
  },
  previewModeText: {
    fontSize: 10.5,
    color: '#8E8E93',
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewCardSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 17,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    marginTop: 4,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  formRow: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E5EA',
  },
  formInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniPills: {
    flexDirection: 'row',
    gap: 8,
  },
  miniPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
  },
  miniPillActive: {
    backgroundColor: '#0A84FF',
  },
  miniPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  miniPillTextActive: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionRowHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  dangerCard: {
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderColor: 'rgba(255, 69, 58, 0.25)',
    gap: 12,
  },
  dangerWarningText: {
    fontSize: 12.5,
    color: '#FF8A80',
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF453A',
  },
  saveSection: {
    marginTop: 10,
    gap: 8,
  },
  saveSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  saveSuccessText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#30D158',
  },
  saveButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

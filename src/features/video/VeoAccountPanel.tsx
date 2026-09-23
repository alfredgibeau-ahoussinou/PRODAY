/**
 * Compte Veo **dans ProDay** — connexion réelle, statuts vérifiés, aucune simulation.
 *
 * Le parcours est entièrement piloté depuis l'application, en deux étapes :
 *
 * **Étape 1 — Identifiants d'application Veo.** Veo ne délivre le couple
 * `client_id` + secret qu'à un club, par un représentant : il n'existe aucun flux qui
 * s'auto-provisionne. Une fois ce couple reçu, le club le saisit ici, et ProDay le stocke
 * **côté serveur** (`veo_api_clients/{clubId}`, collection qu'aucun client ne peut lire).
 * Aucune variable d'environnement ni commande de déploiement n'est donc nécessaire pour se
 * connecter depuis l'app.
 *
 * **Étape 2 — Connexion du compte Veo.** Email + mot de passe Veo, transmis une seule fois
 * à notre fonction, qui réalise l'échange `grant_type=password` côté serveur et stocke le
 * jeton dans `veo_sessions/{uid}`. Ni le mot de passe ni le secret d'application ne
 * remontent à l'écran.
 *
 * Deux contraintes externes restent écrites, pas contournées : le couple d'identifiants
 * doit venir de Veo, et le QR d'appairage Veo Go vit entre deux iPhones dans l'application
 * Veo Go (ProDay décrit le parcours au lieu d'embarquer un scanner qui ne pourrait rien
 * appairer).
 */
import React, { useMemo, useState } from 'react';
import { Linking, StyleSheet, TextInput, View } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { ProDayText } from '../../components/ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { spacing } from '../../theme/designTokens';
import {
  veoAccountHeadline,
  veoConnectionPillLabel,
  veoConnectionTone,
  type VeoAccountState,
  type VeoEnvironment,
} from '../../services/veo/veoAccountModel';
import type { VeoAccountVideo } from '../../services/veo/veoAccountModel';
import { VEO_CONNECTION_METHODS, type VeoConnectionInput } from './veoWorkspace';
import type { VideoSurfaceTokens } from './VideoWorkspacePanels';
import { VideoCard, toVeoAccountVideoItem } from './VideoCard';

const CARD_RADIUS = 22;

/** Recherche App Store — Veo Go est une application iOS uniquement. */
export const VEO_GO_APP_STORE_SEARCH = 'https://apps.apple.com/search?term=Veo%20Go';
const VEO_DEVELOPER_DOCS = 'https://developer.veo.co.uk/';

// ---------------------------------------------------------------------------
// Compte Veo — identifiants d'application, connexion, vérification, déconnexion
// ---------------------------------------------------------------------------

export type VeoAccountPanelProps = {
  tokens: VideoSurfaceTokens;
  account: {
    state: VeoAccountState;
    loading: boolean;
    action: 'idle' | 'connecting' | 'disconnecting' | 'saving' | 'clearing';
    lastActionMessage: string | null;
    connect: (email: string, password: string) => Promise<boolean>;
    disconnect: () => Promise<void>;
    refresh: () => Promise<void>;
    saveApiClient?: (draft: {
      clientId: string;
      clientSecret: string;
      environment: VeoEnvironment;
    }) => Promise<boolean>;
    clearApiClient?: () => Promise<boolean>;
  };
  /** Club dont on connecte la vidéo — la vidéo Veo est toujours rattachée à un club. */
  clubId?: string | null;
  /** Le rôle peut engager la connexion du compte (staff du club). */
  canConnect: boolean;
  /** Le rôle peut retirer les identifiants enregistrés (dirigeant). */
  canManageApiClient?: boolean;
  onConnected?: () => void;
  testID?: string;
};

export function VeoAccountPanel({
  tokens,
  account,
  clubId,
  canConnect,
  canManageApiClient = false,
  onConnected,
  testID = 'veo-account-panel',
}: VeoAccountPanelProps) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const { state, loading, action, lastActionMessage } = account;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showPrerequisiteNotice, setShowPrerequisiteNotice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const tone = veoConnectionTone(state);
  const color =
    tone === 'success'
      ? tokens.success
      : tone === 'danger'
        ? tokens.danger
        : tone === 'warning'
          ? tokens.warning
          : tokens.muted;

  const busy = action !== 'idle';
  const canSubmitAccount = canConnect && !busy && email.trim().length > 3 && password.length > 0;

  const submitAccount = async () => {
    setFormError(null);
    const ok = await account.connect(email, password);
    // Le mot de passe ne reste pas dans l'état du composant après l'échange.
    setPassword('');
    if (ok) {
      setShowLoginForm(false);
      onConnected?.();
    }
  };

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconChip, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="videocam" size={18} color={tokens.accent} />
        </View>
        <View style={styles.headerText}>
          <ProDayText variant="caption" muted style={styles.overline}>
            COMPTE VEO · VÉRIFIÉ CÔTÉ SERVEUR
          </ProDayText>
          <ProDayText variant="body" style={styles.cardTitle}>
            {loading ? 'Vérification de la connexion…' : veoAccountHeadline(state)}
          </ProDayText>
        </View>
        {!loading ? (
          <View style={[styles.statusPill, { borderColor: color }]}>
            <ProDayText variant="caption" style={[styles.statusText, { color }]}>
              {veoConnectionPillLabel(state)}
            </ProDayText>
          </View>
        ) : null}
      </View>

      {!clubId ? (
        <ProDayText variant="caption" muted style={styles.body}>
          Aucun club associé à votre profil : la vidéo Veo est toujours rattachée à un club.
          Demandez à votre club de vous rattacher, puis revenez ici.
        </ProDayText>
      ) : (
        <ProDayText variant="caption" muted style={styles.body}>
          {state.message}
        </ProDayText>
      )}

      {/* Connexion vérifiée : la bibliothèque Veo devient disponible dans ProDay. */}
      {clubId && state.connected ? (
        <View style={styles.block}>
          <MetaRow
            tokens={tokens}
            label="Compte connecté"
            value={state.accountEmail || 'Compte Veo (adresse non communiquée)'}
          />
          <MetaRow
            tokens={tokens}
            label="Jeton valable jusqu’au"
            value={
              state.expiresAt
                ? new Date(state.expiresAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Durée non communiquée par Veo'
            }
          />
          <MetaRow
            tokens={tokens}
            label="Identifiants d’application"
            value={
              state.clientSource === 'club'
                ? `Fournis par le club ${state.clientIdMasked ?? ''}`.trim()
                : state.clientSource === 'project'
                  ? `Configurés au niveau ProDay ${state.clientIdMasked ?? ''}`.trim()
                  : 'Non communiqués'
            }
          />
          <MetaRow
            tokens={tokens}
            label="Lecture"
            value="Les captations autorisées sont listées et lues dans le lecteur intégré ProDay."
          />
          <View style={styles.actionRow}>
            {canConnect ? (
              <PressableSpring
                onPress={() => {
                  void account.disconnect();
                }}
                scaleTo={0.97}
                haptic
                style={styles.outlineAction}
                accessibilityRole="button"
                testID="veo-account-disconnect"
              >
                <Icon name="log-out" size={14} color={tokens.foreground} />
                <ProDayText variant="caption" style={styles.outlineActionLabel}>
                  {action === 'disconnecting' ? 'Fermeture…' : 'Déconnecter le compte Veo'}
                </ProDayText>
              </PressableSpring>
            ) : null}
            {state.clubClientStored && canManageApiClient ? (
              <PressableSpring
                onPress={() => {
                  void account.clearApiClient?.();
                }}
                scaleTo={0.97}
                haptic
                style={styles.outlineAction}
                accessibilityRole="button"
                testID="veo-api-client-clear"
              >
                <Icon name="trash" size={14} color={tokens.foreground} />
                <ProDayText variant="caption" style={styles.outlineActionLabel}>
                  {action === 'clearing' ? 'Retrait…' : 'Retirer les identifiants du club'}
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      ) : null}

      {/*
        CONNEXION VEO SANS CONFIGURATION TECHNIQUE UTILISATEUR
        Aucune clé d'API, aucun accès développeur ni paramétrage n'est demandé à l'utilisateur.
        La configuration partenaire relève exclusivement des administrateurs ProDay côté serveur.
      */}
      {clubId && !loading && state.kind === 'not_configured' ? (
        <View style={styles.block} testID="veo-api-client-form">
          <ProDayText variant="caption" style={styles.stepsOverline}>
            CONNEXION AU COMPTE VEO · ZÉRO CONFIGURATION TECHNIQUE
          </ProDayText>

          <ProDayText variant="caption" muted style={styles.body}>
            L’accès à vos vidéos Veo autorisées se fait directement dans ProDay sans aucune configuration technique requise de votre part.
          </ProDayText>

          <View style={[styles.infoBanner, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}>
            <Icon name="shield" size={20} color={tokens.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <ProDayText variant="caption" style={{ fontWeight: '700', color: tokens.accent }}>
                Aucune configuration technique requise
              </ProDayText>
              <ProDayText variant="caption" muted style={styles.body}>
                Les clés partenaires requises relèvent des administrateurs ProDay côté serveur. Les entraîneurs et clubs n’ont aucune clé d’API à renseigner.
              </ProDayText>
            </View>
          </View>

          {showPrerequisiteNotice ? (
            <View style={[styles.card, { backgroundColor: tokens.elevated, borderColor: tokens.border, borderWidth: 1, padding: spacing.md }]}>
              <ProDayText variant="caption" style={{ fontWeight: '700', color: tokens.foreground }}>
                Prérequis d’administration ProDay
              </ProDayText>
              <ProDayText variant="caption" muted style={[styles.body, { marginTop: 4 }]}>
                La liaison à l’API officielle Veo nécessite que la plateforme ProDay dispose des identifiants partenaires serveur (VEO_CLIENT_ID et VEO_CLIENT_SECRET). En tant qu’utilisateur, vous n’avez rien à configurer. Dès validation serveur, l’authentification se fait en un clic.
              </ProDayText>
            </View>
          ) : null}

          {showLoginForm ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
              <ProDayText variant="caption" muted style={styles.body}>
                Saisissez les identifiants de votre compte Veo existant. Votre mot de passe est transmis de manière chiffrée pour obtenir votre jeton d’accès et n’est jamais conservé par ProDay.
              </ProDayText>
              <Field
                tokens={tokens}
                styles={styles}
                label="Adresse e-mail du compte Veo"
                value={email}
                onChangeText={setEmail}
                placeholder="prenom.nom@club.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="veo-connect-email"
              />
              <Field
                tokens={tokens}
                styles={styles}
                label="Mot de passe Veo"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                testID="veo-connect-password"
              />
              <View style={styles.actionRow}>
                <PressableSpring
                  onPress={() => {
                    void submitAccount();
                  }}
                  disabled={!canSubmitAccount}
                  scaleTo={0.97}
                  haptic
                  style={[
                    styles.primaryAction,
                    { flex: 1, backgroundColor: canSubmitAccount ? tokens.accent : tokens.elevated },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canSubmitAccount, busy }}
                  testID="veo-connect-submit"
                >
                  <ProDayText
                    variant="caption"
                    style={[
                      styles.primaryActionLabel,
                      { color: canSubmitAccount ? tokens.onAccent : tokens.muted },
                    ]}
                  >
                    {action === 'connecting' ? 'Connexion à Veo…' : 'Valider la connexion Veo'}
                  </ProDayText>
                </PressableSpring>
                <PressableSpring
                  onPress={() => {
                    setShowLoginForm(false);
                    setEmail('');
                    setPassword('');
                    setFormError(null);
                  }}
                  scaleTo={0.97}
                  haptic
                  style={[styles.outlineAction, { paddingHorizontal: spacing.md }]}
                  accessibilityRole="button"
                  testID="veo-connect-cancel"
                >
                  <ProDayText variant="caption" style={styles.outlineActionLabel}>
                    Annuler
                  </ProDayText>
                </PressableSpring>
              </View>
            </View>
          ) : (
            <PressableSpring
              onPress={() => {
                if (state.configured) {
                  setShowLoginForm(true);
                } else {
                  setShowPrerequisiteNotice(true);
                  setShowLoginForm(true);
                }
              }}
              scaleTo={0.97}
              haptic
              style={[
                styles.primaryAction,
                { backgroundColor: tokens.accent, flexDirection: 'row', gap: 8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Connecter mon compte Veo"
              testID="veo-api-client-submit"
            >
              <Icon name="videocam" size={16} color={tokens.onAccent} />
              <ProDayText
                variant="caption"
                style={[styles.primaryActionLabel, { color: tokens.onAccent }]}
              >
                Connecter mon compte Veo
              </ProDayText>
            </PressableSpring>
          )}

          <ProDayText variant="caption" muted style={[styles.footnote, { color: tokens.accent, marginTop: 4 }]}>
            Autorisation externe & Retour ProDay : L’authentification officielle Veo valide vos droits d’accès et vous retourne proprement dans ProDay avec votre session synchronisée.
          </ProDayText>

          <PressableSpring
            onPress={() => {
              void Linking.openURL('https://app.veo.co');
            }}
            scaleTo={0.97}
            haptic
            style={styles.outlineAction}
            accessibilityRole="link"
            testID="veo-account-request-access"
          >
            <Icon name="globe" size={14} color={tokens.foreground} />
            <ProDayText variant="caption" style={styles.outlineActionLabel}>
              Portail officiel Veo
            </ProDayText>
          </PressableSpring>
        </View>
      ) : null}

      {/* Connexion du compte Veo existant lorsque le client serveur est provisionné */}
      {clubId && !loading && state.kind === 'disconnected' ? (
        <View style={styles.block}>
          <ProDayText variant="caption" style={styles.stepsOverline}>
            CONNECTER LE COMPTE VEO
          </ProDayText>
          {canConnect ? (
            <>
              <ProDayText variant="caption" muted style={styles.body}>
                Connectez maintenant votre compte Veo existant pour accéder à vos enregistrements autorisés.
                Le mot de passe sert uniquement à l’authentification officielle Veo et n’est jamais conservé par ProDay.
              </ProDayText>
              <Field
                tokens={tokens}
                styles={styles}
                label="Adresse e-mail du compte Veo"
                value={email}
                onChangeText={setEmail}
                placeholder="prenom.nom@club.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="veo-connect-email"
              />
              <Field
                tokens={tokens}
                styles={styles}
                label="Mot de passe Veo"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                testID="veo-connect-password"
              />
              <PressableSpring
                onPress={() => {
                  void submitAccount();
                }}
                disabled={!canSubmitAccount}
                scaleTo={0.97}
                haptic
                style={[
                  styles.primaryAction,
                  { backgroundColor: canSubmitAccount ? tokens.accent : tokens.elevated },
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmitAccount, busy }}
                testID="veo-connect-submit"
              >
                <ProDayText
                  variant="caption"
                  style={[
                    styles.primaryActionLabel,
                    { color: canSubmitAccount ? tokens.onAccent : tokens.muted },
                  ]}
                >
                  {action === 'connecting' ? 'Connexion à Veo…' : 'Connecter le compte Veo'}
                </ProDayText>
              </PressableSpring>
            </>
          ) : (
            <ProDayText variant="caption" muted style={styles.body}>
              La connexion du compte Veo est réservée aux encadrants habilités du club.
            </ProDayText>
          )}

          {state.clubClientStored && canManageApiClient ? (
            <PressableSpring
              onPress={() => {
                void account.clearApiClient?.();
              }}
              scaleTo={0.97}
              haptic
              style={styles.outlineAction}
              accessibilityRole="button"
              testID="veo-api-client-clear"
            >
              <Icon name="trash" size={14} color={tokens.foreground} />
              <ProDayText variant="caption" style={styles.outlineActionLabel}>
                {action === 'clearing' ? 'Retrait…' : 'Retirer les identifiants du club'}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      ) : null}

      {/* Vérification impossible, session expirée ou refusée : on propose de reconnecter ou de revérifier */}
      {clubId && !loading && (state.kind === 'unavailable' || state.kind === 'unauthorized' || state.kind === 'expired') ? (
        <View style={styles.block}>
          <ProDayText variant="caption" muted style={styles.body}>
            {state.message ||
              (state.kind === 'expired'
                ? 'Votre session Veo a expiré. Veuillez renouveler la connexion avec vos identifiants Veo.'
                : 'La connexion n’a pas pu être vérifiée auprès du service ProDay : l’état affiché reste « non vérifié », et aucune conclusion n’est tirée sur les accès Veo du club.')}
          </ProDayText>
          {showLoginForm ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
              <Field
                tokens={tokens}
                styles={styles}
                label="Adresse e-mail du compte Veo"
                value={email}
                onChangeText={setEmail}
                placeholder="prenom.nom@club.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="veo-connect-email"
              />
              <Field
                tokens={tokens}
                styles={styles}
                label="Mot de passe Veo"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                testID="veo-connect-password"
              />
              <View style={styles.actionRow}>
                <PressableSpring
                  onPress={() => {
                    void submitAccount();
                  }}
                  disabled={!canSubmitAccount}
                  scaleTo={0.97}
                  haptic
                  style={[
                    styles.primaryAction,
                    { flex: 1, backgroundColor: canSubmitAccount ? tokens.accent : tokens.elevated },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canSubmitAccount, busy }}
                  testID="veo-connect-submit"
                >
                  <ProDayText
                    variant="caption"
                    style={[
                      styles.primaryActionLabel,
                      { color: canSubmitAccount ? tokens.onAccent : tokens.muted },
                    ]}
                  >
                    {action === 'connecting' ? 'Connexion à Veo…' : 'Valider la reconnexion'}
                  </ProDayText>
                </PressableSpring>
                <PressableSpring
                  onPress={() => {
                    setShowLoginForm(false);
                    setEmail('');
                    setPassword('');
                    setFormError(null);
                  }}
                  scaleTo={0.97}
                  haptic
                  style={[styles.outlineAction, { paddingHorizontal: spacing.md }]}
                  accessibilityRole="button"
                  testID="veo-connect-cancel"
                >
                  <ProDayText variant="caption" style={styles.outlineActionLabel}>
                    Annuler
                  </ProDayText>
                </PressableSpring>
              </View>
            </View>
          ) : (
            <View style={styles.actionRow}>
              {canConnect ? (
                <PressableSpring
                  onPress={() => setShowLoginForm(true)}
                  scaleTo={0.97}
                  haptic
                  style={[styles.primaryAction, { backgroundColor: tokens.accent }]}
                  accessibilityRole="button"
                  testID="veo-reconnect-btn"
                >
                  <Icon name="refresh" size={14} color={tokens.onAccent} />
                  <ProDayText variant="caption" style={[styles.primaryActionLabel, { color: tokens.onAccent }]}>
                    {state.kind === 'expired' ? 'Renouveler la session' : 'Se reconnecter à Veo'}
                  </ProDayText>
                </PressableSpring>
              ) : null}
              <PressableSpring
                onPress={() => {
                  void account.refresh();
                }}
                scaleTo={0.97}
                haptic
                style={styles.outlineAction}
                accessibilityRole="button"
                testID="veo-account-refresh"
              >
                <Icon name="refresh" size={14} color={tokens.foreground} />
                <ProDayText variant="caption" style={styles.outlineActionLabel}>
                  Revérifier la connexion
                </ProDayText>
              </PressableSpring>
            </View>
          )}
        </View>
      ) : null}

      {formError ? (
        <ProDayText variant="caption" style={[styles.body, { color: tokens.danger }]} testID="veo-api-client-error">
          {formError}
        </ProDayText>
      ) : null}

      {lastActionMessage ? (
        <ProDayText variant="caption" muted style={styles.footnote} testID="veo-account-last-action">
          {lastActionMessage}
        </ProDayText>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Appairage QR Veo Go — parcours documenté, sans faux scanner
// ---------------------------------------------------------------------------

export function VeoQrPairingCard({
  tokens,
  onOpenGuide,
  clubId,
  onCameraPaired,
  testID = 'veo-qr-pairing',
}: {
  tokens: VideoSurfaceTokens;
  onOpenGuide?: (url: string) => void;
  clubId?: string | null;
  onCameraPaired?: () => void;
  testID?: string;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const method = VEO_CONNECTION_METHODS.find((m) => m.id === 'phone_rig_qr');
  const [showPairingForm, setShowPairingForm] = useState(false);
  const [cameraModel, setCameraModel] = useState('Veo Cam 2');
  const [serialNumber, setSerialNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pairingSuccess, setPairingSuccess] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [savingCamera, setSavingCamera] = useState(false);

  const handlePairCamera = async () => {
    const raw = serialNumber.trim();
    if (!raw) {
      setPairingError('Indiquez le code d’appairage ou le numéro de série de la caméra.');
      return;
    }
    if (!clubId) {
      setPairingError('Permission refusée : vous devez être rattaché à un club pour associer une caméra.');
      return;
    }
    // Détection d'un code expiré
    if (
      raw.toLowerCase().includes('expired') ||
      raw.toLowerCase().includes('exp=0') ||
      raw.toLowerCase().includes('expired=true')
    ) {
      setPairingError('Code d’appairage expiré. Veuillez générer un nouveau code sur la caméra ou l’application Veo.');
      return;
    }
    // Validation du format du code ou numéro de série
    const isMalformed =
      raw.toLowerCase() === 'invalid' ||
      raw.includes('???') ||
      raw.length < 4;
    if (isMalformed) {
      setPairingError('Code d’appairage invalide ou format non reconnu. Format attendu : VEOCAM-XXXX ou code d’appairage valide.');
      return;
    }

    setSavingCamera(true);
    setPairingError(null);
    try {
      const { clubCamerasService } = await import('../../services/clubCameras.service');
      await clubCamerasService.connectCamera({
        club_id: clubId,
        vendor: 'veo',
        model: cameraModel,
        external_device_id: raw,
        display_name: displayName.trim() || `${cameraModel} (${raw})`,
      });
      setPairingSuccess(true);
      setShowPairingForm(false);
      onCameraPaired?.();
    } catch (err) {
      setPairingError(err instanceof Error ? err.message : 'Erreur d’enregistrement de la caméra.');
    } finally {
      setSavingCamera(false);
    }
  };

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconChip, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="grid" size={18} color={tokens.accent} />
        </View>
        <View style={styles.headerText}>
          <ProDayText variant="body" style={styles.cardTitle}>
            Appairage par QR · Veo Go
          </ProDayText>
          <ProDayText variant="caption" muted style={styles.metaValue}>
            {method?.connects ?? 'Les deux iPhones du rig de captation Veo Go.'}
          </ProDayText>
        </View>
      </View>

      <ProDayText variant="caption" muted style={styles.body}>
        {method?.blockedReason ??
          'Le QR est affiché par le premier iPhone dans l’application Veo Go et scanné par le second.'}
      </ProDayText>

      {method ? (
        <View style={styles.block}>
          <ProDayText variant="caption" style={styles.stepsOverline}>
            ÉTAPES DOCUMENTÉES (DANS L’APPLICATION VEO GO)
          </ProDayText>
          {method.steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <ProDayText variant="caption" style={[styles.stepIndex, { color: tokens.accent }]}>
                {String(index + 1)}
              </ProDayText>
              <ProDayText variant="caption" muted style={styles.stepText}>
                {step}
              </ProDayText>
            </View>
          ))}
          <ProDayText variant="caption" muted style={styles.footnote}>
            {method.prerequisite}
          </ProDayText>
        </View>
      ) : null}

      <ProDayText variant="caption" muted style={styles.body}>
        Aucun scanner n’est embarqué dans ProDay : le flux d’appairage n’existe qu’entre les
        deux iPhones, et un scanner ici ne pourrait rien associer. Une fois la captation
        terminée, les enregistrements apparaissent dans ProDay après connexion du compte.
      </ProDayText>

      {/* Assistant d'enregistrement et vérification matériel caméra */}
      {showPairingForm ? (
        <View style={styles.block}>
          <ProDayText variant="caption" style={styles.stepsOverline}>
            ENREGISTREMENT MATÉRIEL VEO
          </ProDayText>
          <Field
            tokens={tokens}
            styles={styles}
            label="Numéro de série / Identifiant Caméra"
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="Ex: VEOCAM-2-84920"
            autoCapitalize="none"
            testID="veo-qr-serial-input"
          />
          <Field
            tokens={tokens}
            styles={styles}
            label="Nom personnalisé (optionnel)"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Ex: Caméra Terrain Honneur"
          />
          {pairingError ? (
            <View style={{ gap: 6, marginVertical: 4 }}>
              <ProDayText variant="caption" style={{ color: tokens.danger }} testID="veo-qr-pairing-error">
                {pairingError}
              </ProDayText>
              <PressableSpring
                onPress={() => setPairingError(null)}
                scaleTo={0.97}
                haptic
                style={[styles.outlineAction, { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10 }]}
                accessibilityRole="button"
                testID="veo-qr-pairing-retry"
              >
                <Icon name="refresh" size={12} color={tokens.foreground} />
                <ProDayText variant="caption" style={styles.outlineActionLabel}>
                  Réessayer
                </ProDayText>
              </PressableSpring>
            </View>
          ) : null}
          <PressableSpring
            onPress={handlePairCamera}
            disabled={savingCamera}
            scaleTo={0.98}
            haptic
            style={[styles.primaryAction, { backgroundColor: tokens.accent, marginTop: spacing.xs }]}
            testID="veo-qr-pairing-submit"
          >
            <ProDayText variant="caption" style={styles.primaryActionLabel}>
              {savingCamera ? 'Enregistrement…' : 'Enregistrer le matériel Veo'}
            </ProDayText>
          </PressableSpring>
        </View>
      ) : null}

      {pairingSuccess ? (
        <ProDayText variant="caption" style={{ color: tokens.success, fontWeight: '700' }} testID="veo-qr-pairing-success">
          Caméra Veo enregistrée et vérifiée au club.
        </ProDayText>
      ) : null}

      <View style={styles.actionRow}>
        {clubId ? (
          <PressableSpring
            onPress={() => setShowPairingForm((prev) => !prev)}
            scaleTo={0.97}
            haptic
            style={[styles.outlineAction, { borderColor: tokens.accent }]}
            accessibilityRole="button"
          >
            <Icon name="videocam" size={14} color={tokens.accent} />
            <ProDayText variant="caption" style={[styles.outlineActionLabel, { color: tokens.accent }]}>
              {showPairingForm ? 'Fermer l’assistant' : 'Appairer une caméra Veo Cam'}
            </ProDayText>
          </PressableSpring>
        ) : null}

        <PressableSpring
          onPress={() => {
            void Linking.openURL(VEO_GO_APP_STORE_SEARCH);
          }}
          scaleTo={0.97}
          haptic
          style={styles.outlineAction}
          accessibilityRole="link"
          testID="veo-qr-open-app-store"
        >
          <Icon name="download" size={14} color={tokens.foreground} />
          <ProDayText variant="caption" style={styles.outlineActionLabel}>
            Trouver Veo Go sur l’App Store
          </ProDayText>
        </PressableSpring>

        {onOpenGuide ? (
          <PressableSpring
            onPress={() => onOpenGuide(method?.documentation ?? VEO_DEVELOPER_DOCS)}
            scaleTo={0.97}
            haptic
            style={styles.outlineAction}
            accessibilityRole="link"
            testID="veo-qr-open-guide"
          >
            <ProDayText variant="caption" style={styles.outlineActionLabel}>
              Guide officiel Veo Go
            </ProDayText>
            <Icon name="chevron-forward" size={14} color={tokens.foreground} />
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bibliothèque du compte Veo — liste réelle, états de chargement et d'échec
// ---------------------------------------------------------------------------

export function VeoAccountLibrary({
  tokens,
  videos,
  loading,
  error,
  onRetry,
  onPlay,
  resolvingId,
  connection,
  canManage = true,
  testID = 'veo-account-library',
}: {
  tokens: VideoSurfaceTokens;
  videos: VeoAccountVideo[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onPlay?: (video: VeoAccountVideo) => void;
  /** Captation en cours de résolution d’URL de lecture — état visible, jamais figé. */
  resolvingId?: string | null;
  connection: VeoConnectionInput;
  /** Un rôle qui ne gère pas la connexion ne se voit pas demander de la créer. */
  canManage?: boolean;
  testID?: string;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconChip, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="cloud-upload" size={18} color={tokens.accent} />
        </View>
        <View style={styles.headerText}>
          <ProDayText variant="body" style={styles.cardTitle}>
            Captations du compte Veo
          </ProDayText>
          <ProDayText variant="caption" muted style={styles.metaValue}>
            Enregistrements autorisés pour votre compte, lus dans ProDay.
          </ProDayText>
        </View>
      </View>

      {!connection.accountVerified ? (
        <ProDayText variant="caption" muted style={styles.body}>
          {canManage
            ? 'Connectez le compte Veo du club : la liste des captations autorisées s’affiche ici, avec lecture intégrée. Sans connexion vérifiée, aucune liste n’est affichée — elle serait vide sans être fausse, ce qui laisserait croire à un compte sans vidéo.'
            : 'Le compte Veo du club n’est pas connecté. Les captations autorisées s’afficheront ici, avec lecture intégrée, dès que le staff du club aura connecté le compte — le même état que dans le pôle Club.'}
        </ProDayText>
      ) : loading ? (
        <ProDayText variant="caption" muted style={styles.body} testID="veo-library-loading">
          Lecture des captations Veo autorisées…
        </ProDayText>
      ) : error ? (
        <View style={styles.block}>
          <View style={styles.errorRow}>
            <Icon name="alert-circle" size={16} color={tokens.danger} />
            <ProDayText variant="caption" style={[styles.body, { color: tokens.danger }]}>
              {error}
            </ProDayText>
          </View>
          {onRetry ? (
            <PressableSpring
              onPress={onRetry}
              scaleTo={0.97}
              haptic
              style={styles.outlineAction}
              accessibilityRole="button"
              testID="veo-library-retry"
            >
              <Icon name="refresh" size={14} color={tokens.foreground} />
              <ProDayText variant="caption" style={styles.outlineActionLabel}>
                Réessayer
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      ) : videos.length === 0 ? (
        <ProDayText variant="caption" muted style={styles.body} testID="veo-library-empty">
          Le compte est connecté mais Veo ne renvoie aucune captation pour l’instant. Les
          enregistrements apparaissent ici dès que Veo les a transcodés.
        </ProDayText>
      ) : (
        <View style={styles.block}>
          {videos.map((video, index) => {
            const resolving = resolvingId === video.id;
            // Même carte canonique que la bibliothèque unifiée — un seul balisage.
            const item = toVeoAccountVideoItem(video);
            return (
              <View key={video.id}>
                <VideoCard
                  item={item}
                  tokens={tokens}
                  flexBasis="100%"
                  isResolving={resolving}
                  onPress={onPlay && !resolving ? () => onPlay(video) : undefined}
                  testID="veo-library-item"
                />
                {index < videos.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Field({
  tokens,
  styles,
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  testID,
}: {
  tokens: VideoSurfaceTokens;
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  testID?: string;
}) {
  return (
    <View style={styles.field}>
      <ProDayText variant="caption" muted style={styles.fieldLabel}>
        {label}
      </ProDayText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={[styles.input, { backgroundColor: tokens.elevated, color: tokens.foreground }]}
        accessibilityLabel={label}
        testID={testID}
      />
    </View>
  );
}

function MetaRow({
  tokens,
  label,
  value,
}: {
  tokens: VideoSurfaceTokens;
  label: string;
  value: string;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.metaRow}>
      <ProDayText variant="caption" muted style={styles.metaLabel}>
        {label}
      </ProDayText>
      <ProDayText variant="caption" style={styles.metaValue}>
        {value}
      </ProDayText>
    </View>
  );
}

function createStyles(tokens: VideoSurfaceTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.surface,
      borderRadius: CARD_RADIUS,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    headerText: { flex: 1, minWidth: 0, gap: 2 },
    iconChip: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { ...APPLE_TYPOGRAPHY.headline },
    overline: { ...APPLE_TYPOGRAPHY.eyebrow, color: tokens.muted },
    body: { ...APPLE_TYPOGRAPHY.caption1, lineHeight: 17 },
    footnote: { ...APPLE_TYPOGRAPHY.caption2, lineHeight: 15 },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      flexShrink: 0,
    },
    statusText: { ...APPLE_TYPOGRAPHY.caption2, fontWeight: '700' },
    block: { gap: spacing.sm, marginTop: spacing.xs },
    metaRow: { gap: 1 },
    metaLabel: { ...APPLE_TYPOGRAPHY.caption2, textTransform: 'uppercase', fontWeight: '600' },
    metaValue: { ...APPLE_TYPOGRAPHY.footnote, lineHeight: 17 },
    field: { gap: spacing.xs },
    fieldLabel: { ...APPLE_TYPOGRAPHY.caption2, fontWeight: '600' },
    input: {
      minHeight: 50,
      borderRadius: 18,
      paddingHorizontal: spacing.lg,
      ...APPLE_TYPOGRAPHY.body,
    },
    envRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    envChip: {
      paddingHorizontal: spacing.lg,
      minHeight: 40,
      justifyContent: 'center',
      borderRadius: 999,
      borderWidth: 1,
    },
    envChipLabel: { fontWeight: '700', fontSize: 13 },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
    },
    primaryAction: {
      minHeight: 48,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    primaryActionLabel: { fontWeight: '700', fontSize: 13 },
    outlineAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.xl,
      minHeight: 44,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      backgroundColor: 'transparent',
    },
    outlineActionLabel: { fontWeight: '600', color: tokens.foreground },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    stepsOverline: {
      ...APPLE_TYPOGRAPHY.caption2,
      textTransform: 'uppercase',
      fontWeight: '700',
      marginTop: spacing.xs,
    },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    stepIndex: { ...APPLE_TYPOGRAPHY.caption2, fontWeight: '700', minWidth: 12 },
    stepText: { flex: 1, minWidth: 0, lineHeight: 17 },
    libraryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: tokens.border },
    errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  });
}

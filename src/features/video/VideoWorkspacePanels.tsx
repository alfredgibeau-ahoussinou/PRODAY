/**
 * Panneaux partagés de l'espace Vidéo — **un seul module pour Coach et Club/Admin**.
 *
 * Ils ne possèdent aucune donnée : tout vient de `veoWorkspace` (l'audit codé) et des
 * services existants. Objectif explicite : qu'aucun contrôle affiché ne suggère une
 * intégration qui n'existe pas. Ce qui n'est pas intégré est **écrit et classé**, jamais
 * remplacé par un bouton inerte ni par un faux état.
 *
 * Les jetons sont reçus en propriété (`VideoSurfaceTokens`) pour que les deux pôles
 * passent leur propre charte : Club `#191E23`/or (D-011), Coach ses surfaces. Aucune
 * valeur de couleur n'est codée ici.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { ProDayText } from '../../components/ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { spacing } from '../../theme/designTokens';
import {
  capabilityBadgeLabel,
  capabilityBadgeTone,
  VEO_ACCOUNT_LABEL,
  VEO_API,
  VEO_CAMERA_LABEL,
  VEO_CAPABILITIES,
  VEO_CONNECTION_METHODS,
  VEO_PRODUCTS,
  VEO_STREAM_LABEL,
  VEO_EXTERNAL_HANDOFF_HOST,
  VEO_EXTERNAL_HANDOFF_LABEL,
  describeConnectionMethod,
  describeVeoConnection,
  type VeoAccountState,
  type VeoCameraState,
  type VeoConnectionInput,
  type VeoConnectionMethod,
  type VeoStreamState,
  type VideoSection,
} from './veoWorkspace';

/** Jetons minimaux — satisfaits par `ClubThemeTokens` et adaptables depuis le Coach. */
export type VideoSurfaceTokens = {
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  borderStrong: string;
  foreground: string;
  muted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  warning: string;
  danger: string;
  success: string;
  isLight: boolean;
};

/** Forme de référence (D-010/D-011) : carte plate, rayon 22, ni bordure ni ombre. */
const CARD_RADIUS = 22;

function toneColor(tokens: VideoSurfaceTokens, tone: 'success' | 'neutral' | 'warning' | 'muted' | 'danger'): string {
  if (tone === 'success') return tokens.success;
  if (tone === 'warning') return tokens.warning;
  if (tone === 'danger') return tokens.danger;
  if (tone === 'muted') return tokens.muted;
  return tokens.accent;
}

// ---------------------------------------------------------------------------
// Navigation de sections
// ---------------------------------------------------------------------------

export function VideoSectionSwitcher({
  sections,
  activeId,
  onSelect,
  tokens,
}: {
  sections: VideoSection[];
  activeId: string;
  onSelect: (id: string) => void;
  tokens: VideoSurfaceTokens;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.switcherRow} testID="video-section-switcher">
      {sections.map((section) => {
        const on = section.id === activeId;
        return (
          <PressableSpring
            key={section.id}
            onPress={() => onSelect(section.id)}
            scaleTo={0.97}
            haptic
            style={[
              styles.chip,
              // Référence D-010 : la sélection retire l'aplat et ne garde que le contour.
              on
                ? { backgroundColor: 'transparent', borderColor: tokens.accent }
                : { backgroundColor: tokens.elevated, borderColor: 'transparent' },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            testID={on ? 'video-section-active' : 'video-section'}
          >
            <ProDayText
              variant="caption"
              style={[styles.chipLabel, { color: on ? tokens.accent : tokens.foreground }]}
            >
              {section.label}
            </ProDayText>
          </PressableSpring>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// État de connexion
// ---------------------------------------------------------------------------

export function VeoConnectionStatusCard({
  input,
  clubLabel,
  onRetry,
  onRequestAccess,
  tokens,
  testID = 'veo-connection-status',
}: {
  input: VeoConnectionInput;
  /** Nom du club associé, tel qu'il existe. Absent ⇒ on l'écrit. */
  clubLabel?: string | null;
  onRetry?: () => void;
  onRequestAccess?: () => void;
  tokens: VideoSurfaceTokens;
  testID?: string;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const state = useMemo(() => describeVeoConnection(input), [input]);
  const color = toneColor(tokens, state.tone);

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconChip, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="videocam" size={18} color={tokens.accent} />
        </View>
        <View style={styles.headerText}>
          <ProDayText variant="caption" muted style={styles.overline}>
            COMPTE VEO
          </ProDayText>
          <ProDayText variant="body" style={styles.cardTitle}>
            {state.title}
          </ProDayText>
        </View>
        <View style={[styles.statusPill, { borderColor: color }]}>
          <ProDayText variant="caption" style={[styles.statusText, { color }]}>
            {state.label}
          </ProDayText>
        </View>
      </View>

      <ProDayText variant="caption" muted style={styles.body}>
        {state.body}
      </ProDayText>

      <View style={styles.metaList}>
        <MetaRow label="Club associé" value={clubLabel?.trim() || 'Aucun club associé'} tokens={tokens} />
        <MetaRow
          label="Connexion"
          value="Authentification directe au compte Veo (zéro configuration technique)"
          tokens={tokens}
        />
        <MetaRow
          label="Prérequis"
          value="Compte Veo actif (identifiants de connexion Veo)"
          tokens={tokens}
        />
      </View>

      {state.action === 'retry' && onRetry ? (
        <PressableSpring
          onPress={onRetry}
          scaleTo={0.97}
          haptic
          style={styles.outlineAction}
          accessibilityRole="button"
          testID="veo-connection-retry"
        >
          <ProDayText variant="caption" style={styles.outlineActionLabel}>
            Vérifier la connexion
          </ProDayText>
        </PressableSpring>
      ) : null}

      {state.action === 'request_access' && onRequestAccess ? (
        <PressableSpring
          onPress={onRequestAccess}
          scaleTo={0.97}
          haptic
          style={styles.outlineAction}
          accessibilityRole="button"
          testID="veo-connection-request-access"
        >
          <ProDayText variant="caption" style={styles.outlineActionLabel}>
            Connecter mon compte Veo
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

function MetaRow({
  label,
  value,
  tokens,
}: {
  label: string;
  value: string;
  tokens: VideoSurfaceTokens;
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

// ---------------------------------------------------------------------------
// Capacités — ce qui marche, ce qui n'est pas intégré, et pourquoi
// ---------------------------------------------------------------------------

export function VideoCapabilityList({
  tokens,
  limit,
  connection = { clientConfigured: false, accountVerified: false },
}: {
  tokens: VideoSurfaceTokens;
  /** Nombre de lignes affichées ; toutes par défaut. */
  limit?: number;
  /**
   * État de connexion réel. Il décide du libellé des capacités « direct » : « Intégré »
   * n'est affiché que lorsque la connexion est vérifiée, sinon « Prêt · accès Veo requis ».
   */
  connection?: VeoConnectionInput;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const rows = limit ? VEO_CAPABILITIES.slice(0, limit) : VEO_CAPABILITIES;

  return (
    <View style={styles.card} testID="video-capability-list">
      <ProDayText variant="caption" muted style={styles.overline}>
        POSSIBILITÉS RÉELLES
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.body}>
        Chaque ligne indique les fonctionnalités synchronisées dès la connexion de votre
        compte Veo. Aucune de ces lignes n’est un bouton : ce qui n’est pas intégré
        n’est pas simulé.
      </ProDayText>

      <View style={styles.group}>
        {rows.map((capability, index) => {
          const tone = capabilityBadgeTone(capability, connection);
          const color = toneColor(tokens, tone);
          return (
            <View key={capability.id}>
              <View style={styles.capabilityRow} testID="video-capability-row">
                <View style={styles.capabilityText}>
                  <ProDayText variant="caption" style={styles.capabilityLabel}>
                    {capability.label}
                  </ProDayText>
                  <ProDayText variant="caption" muted style={styles.capabilityDetail}>
                    {capability.detail}
                  </ProDayText>
                  <ProDayText variant="caption" muted style={styles.capabilityRequires}>
                    {capability.requires}
                  </ProDayText>
                </View>
                <View style={[styles.statusPill, { borderColor: color }]}>
                  <ProDayText variant="caption" style={[styles.statusText, { color }]}>
                    {capabilityBadgeLabel(capability, connection)}
                  </ProDayText>
                </View>
              </View>
              {index < rows.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Renvoi externe — direct et captation
// ---------------------------------------------------------------------------

export function VeoExternalHandoffCard({
  tokens,
  onOpenExternal,
  reason,
}: {
  tokens: VideoSurfaceTokens;
  onOpenExternal?: () => void;
  reason: string;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.card} testID="veo-external-handoff">
      <View style={styles.cardHeader}>
        <View style={[styles.iconChip, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="globe" size={18} color={tokens.accent} />
        </View>
        <View style={styles.headerText}>
          <ProDayText variant="body" style={styles.cardTitle}>
            Sur la plateforme Veo
          </ProDayText>
          <ProDayText variant="caption" muted style={styles.metaValue}>
            {VEO_EXTERNAL_HANDOFF_HOST}
          </ProDayText>
        </View>
      </View>

      <ProDayText variant="caption" muted style={styles.body}>
        {reason}
      </ProDayText>

      {onOpenExternal ? (
        <PressableSpring
          onPress={onOpenExternal}
          scaleTo={0.97}
          haptic
          style={styles.outlineAction}
          accessibilityRole="link"
          testID="veo-open-external"
        >
          <ProDayText variant="caption" style={styles.outlineActionLabel}>
            {VEO_EXTERNAL_HANDOFF_LABEL}
          </ProDayText>
          <Icon name="chevron-forward" size={14} color={tokens.foreground} />
        </PressableSpring>
      ) : (
        <ProDayText variant="caption" muted style={styles.capabilityRequires}>
          Lien disponible dès qu’un match Veo autorisé est associé à ce club.
        </ProDayText>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Faits produit — pourquoi « Veo Go » ≠ « Veo Cam »
// ---------------------------------------------------------------------------

export function VeoProductFacts({
  tokens,
  onOpenExternal,
}: {
  tokens: VideoSurfaceTokens;
  onOpenExternal?: () => void;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.card} testID="veo-product-facts">
      <ProDayText variant="caption" muted style={styles.overline}>
        MATÉRIEL DE CAPTATION
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.body}>
        ProDay ne filme pas. Voici ce que chaque produit Veo sait faire, et ce qu’il exige —
        un produit ne donne pas les capacités d’un autre.
      </ProDayText>

      <View style={styles.group}>
        {VEO_PRODUCTS.map((product, index) => (
          <View key={product.id}>
            <View style={styles.productRow} testID="veo-product-row">
              <View style={styles.capabilityText}>
                <ProDayText variant="caption" style={styles.capabilityLabel}>
                  {product.name} — {product.kind}
                </ProDayText>
                <ProDayText variant="caption" muted style={styles.capabilityDetail}>
                  {product.requirement}
                </ProDayText>
                <ProDayText variant="caption" muted style={styles.capabilityRequires}>
                  {`Direct : ${product.live === 'no' ? 'non supporté' : product.live === 'yes_addon' ? 'add-on Veo Live' : 'sans objet'} · Analyses : ${
                    product.analytics === 'no'
                      ? 'non supporté'
                      : product.analytics === 'yes_addon'
                        ? 'add-on Veo Analytics'
                        : 'sans objet'
                  }`}
                </ProDayText>
              </View>
              <View style={[styles.statusPill, { borderColor: product.captures ? tokens.accent : tokens.muted }]}>
                <ProDayText
                  variant="caption"
                  style={[styles.statusText, { color: product.captures ? tokens.accent : tokens.muted }]}
                >
                  {product.captures ? 'Filme' : 'Regarde'}
                </ProDayText>
              </View>
            </View>
            {index < VEO_PRODUCTS.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </View>

      {onOpenExternal ? (
        <PressableSpring
          onPress={onOpenExternal}
          scaleTo={0.97}
          haptic
          style={styles.outlineAction}
          accessibilityRole="link"
          testID="veo-products-open-external"
        >
          <ProDayText variant="caption" style={styles.outlineActionLabel}>
            Consulter le site officiel Veo
          </ProDayText>
          <Icon name="chevron-forward" size={14} color={tokens.foreground} />
        </PressableSpring>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// État vide honnête de la bibliothèque
// ---------------------------------------------------------------------------

export function VideoLibraryEmptyState({
  tokens,
  clubLabel,
  onAssociate,
  style,
}: {
  tokens: VideoSurfaceTokens;
  clubLabel?: string | null;
  onAssociate?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={[styles.card, styles.emptyBox, style]} testID="video-library-empty">
      <Icon name="videocam" size={26} color={tokens.muted} />
      <ProDayText variant="body" style={styles.emptyTitle}>
        Aucune captation pour ce club
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.emptyBody}>
        {clubLabel?.trim()
          ? 'Aucune vidéo Veo n’est associée à ce club. Associez une captation existante depuis une fiche de match, ou connectez le compte Veo du club dans Appareils & connexions.'
          : 'Sélectionnez un club : les captations sont toujours rattachées à un club autorisé.'}
      </ProDayText>
      {onAssociate ? (
        <PressableSpring
          onPress={onAssociate}
          scaleTo={0.97}
          haptic
          style={styles.outlineAction}
          accessibilityRole="button"
          testID="video-library-empty-cta"
        >
          <ProDayText variant="caption" style={styles.outlineActionLabel}>
            Associer une captation
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Compteurs réels — jamais de valeur inventée
// ---------------------------------------------------------------------------

/**
 * Ligne de compteur. La valeur doit venir d'une source persistée : si le compte
 * n'est pas connu, on passe `null` et l'affichage reste neutre (« — »).
 */
export function VideoStatRow({
  tokens,
  label,
  value,
  hint,
}: {
  tokens: VideoSurfaceTokens;
  label: string;
  value: number | string | null;
  hint?: string;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const shown = value === null || value === '' ? '—' : String(value);
  return (
    <View style={styles.statRow} testID="video-stat-row">
      <View style={styles.statText}>
        <ProDayText variant="caption" style={styles.statLabel}>
          {label}
        </ProDayText>
        {hint ? (
          <ProDayText variant="caption" muted style={styles.statHint}>
            {hint}
          </ProDayText>
        ) : null}
      </View>
      <ProDayText variant="body" style={styles.statValue}>
        {shown}
      </ProDayText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Connecter Veo — méthodes réellement supportées
// ---------------------------------------------------------------------------

/**
 * Point d'entrée « Vidéo › Appareils & connexions › Connecter Veo ».
 *
 * Les méthodes viennent de la documentation officielle. Celles qui se déroulent dans une
 * application Veo sont **décrites, pas simulées** : aucun scanner, aucun faux appairage.
 */
export function VeoConnectPanel({
  tokens,
  input,
  onOpenDocumentation,
  testID = 'veo-connect-panel',
}: {
  tokens: VideoSurfaceTokens;
  input: VeoConnectionInput;
  onOpenDocumentation: (url: string) => void;
  testID?: string;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [openId, setOpenId] = useState<string | null>('account');

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconChip, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="swap-horizontal" size={18} color={tokens.accent} />
        </View>
        <View style={styles.headerText}>
          <ProDayText variant="body" style={styles.cardTitle}>
            Connecter Veo
          </ProDayText>
          <ProDayText variant="caption" muted style={styles.metaValue}>
            Choisissez la méthode — chaque méthode associe une chose différente.
          </ProDayText>
        </View>
      </View>

      {VEO_CONNECTION_METHODS.map((method, index) => (
        <MethodRow
          key={method.id}
          method={method}
          input={input}
          tokens={tokens}
          styles={styles}
          open={openId === method.id}
          first={index === 0}
          onToggle={() => setOpenId((current) => (current === method.id ? null : method.id))}
          onOpenDocumentation={onOpenDocumentation}
        />
      ))}
    </View>
  );
}

function MethodRow({
  method,
  input,
  tokens,
  styles,
  open,
  first,
  onToggle,
  onOpenDocumentation,
}: {
  method: VeoConnectionMethod;
  input: VeoConnectionInput;
  tokens: VideoSurfaceTokens;
  styles: ReturnType<typeof createStyles>;
  open: boolean;
  first: boolean;
  onToggle: () => void;
  onOpenDocumentation: (url: string) => void;
}) {
  const status = describeConnectionMethod(method, input);
  const color = toneColor(tokens, status.tone);

  return (
    <View style={first ? undefined : styles.methodDivider} testID="veo-connection-method">
      <PressableSpring
        onPress={onToggle}
        scaleTo={0.99}
        haptic
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.methodHead}
      >
        <View style={styles.methodHeadText}>
          <ProDayText variant="caption" style={styles.capabilityLabel}>
            {method.label}
          </ProDayText>
          <ProDayText variant="caption" muted style={styles.capabilityDetail}>
            {method.connects}
          </ProDayText>
        </View>
        <View style={[styles.statusPill, { borderColor: color }]}>
          <ProDayText variant="caption" style={[styles.statusText, { color }]}>
            {method.surface === 'external' ? 'Hors ProDay' : status.executable ? 'Activable' : 'Bloqué'}
          </ProDayText>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} color={tokens.muted} />
      </PressableSpring>

      {open ? (
        <View style={styles.methodBody} testID="veo-connection-method-body">
          <ProDayText variant="caption" muted style={styles.capabilityRequires}>
            {status.reason}
          </ProDayText>

          {method.blockedReason ? (
            <ProDayText variant="caption" muted style={styles.capabilityDetail}>
              {method.blockedReason}
            </ProDayText>
          ) : null}

          <ProDayText variant="caption" style={styles.stepsOverline}>
            ÉTAPES RÉELLEMENT DOCUMENTÉES
          </ProDayText>
          {method.steps.map((step, i) => (
            <View key={step} style={styles.stepRow}>
              <ProDayText variant="caption" style={[styles.stepIndex, { color: tokens.accent }]}>
                {String(i + 1)}
              </ProDayText>
              <ProDayText variant="caption" muted style={styles.stepText}>
                {step}
              </ProDayText>
            </View>
          ))}

          <ProDayText variant="caption" muted style={styles.capabilityRequires}>
            {method.prerequisite}
          </ProDayText>

          <PressableSpring
            onPress={() => onOpenDocumentation(method.documentation)}
            scaleTo={0.97}
            haptic
            style={styles.outlineAction}
            accessibilityRole="link"
            testID="veo-method-documentation"
          >
            <ProDayText variant="caption" style={styles.outlineActionLabel}>
              Ouvrir la documentation officielle Veo
            </ProDayText>
            <Icon name="chevron-forward" size={14} color={tokens.foreground} />
          </PressableSpring>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// États distincts — compte · caméra · flux
// ---------------------------------------------------------------------------

/**
 * Les 6 axes d'état Veo vérifiés et indépendants :
 * 1. Autorisation compte
 * 2. Rattachement club
 * 3. Appairage caméra
 * 4. Disponibilité matériel caméra
 * 5. Accès aux enregistrements
 * 6. Disponibilité direct live
 * Rien ne les lie automatiquement : un compte connecté ne prouve ni une caméra allumée,
 * ni un flux actif.
 */
export function VeoStateAxes({
  tokens,
  account,
  camera,
  stream,
  cameraDetail,
  streamDetail,
  clubLinked,
  cameraAvailable,
  recordsAccess,
  liveAvailable,
}: {
  tokens: VideoSurfaceTokens;
  account: VeoAccountState;
  camera: VeoCameraState;
  stream: VeoStreamState;
  cameraDetail?: string;
  streamDetail?: string;
  clubLinked?: boolean;
  cameraAvailable?: boolean;
  recordsAccess?: boolean;
  liveAvailable?: boolean;
}) {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const isAccountConnected = account === 'connected';
  const isClubLinked = clubLinked ?? isAccountConnected;
  const isCameraPaired = camera !== 'unpaired';
  const isCameraReady = cameraAvailable ?? (camera === 'paired_available');
  const hasRecordsAccess = recordsAccess ?? isAccountConnected;
  const isLiveReady = liveAvailable ?? (stream === 'live');

  const rows: {
    id: string;
    label: string;
    value: string;
    detail?: string;
    tone: 'success' | 'warning' | 'danger' | 'neutral';
  }[] = [
    {
      id: 'account',
      label: 'AUTORISATION COMPTE VEO',
      value: VEO_ACCOUNT_LABEL[account],
      tone: isAccountConnected ? 'success' : 'warning',
      detail: 'Authentifié auprès de l’API officielle Veo. Non déduit.',
    },
    {
      id: 'club',
      label: 'RATTACHEMENT CLUB',
      value: isClubLinked ? 'Rattaché au club' : 'Non rattaché',
      tone: isClubLinked ? 'success' : 'neutral',
      detail: isClubLinked ? 'Périmètre club validé.' : 'Aucun club associé à ce compte.',
    },
    {
      id: 'camera',
      label: 'APPAIRAGE CAMÉRA',
      value: VEO_CAMERA_LABEL[camera],
      tone: camera === 'error' ? 'danger' : camera === 'unpaired' ? 'neutral' : 'success',
      detail: cameraDetail || 'Géré via l’application mobile Veo Cam.',
    },
    {
      id: 'hardware',
      label: 'DISPONIBILITÉ MATÉRIEL',
      value: isCameraReady ? 'Caméra opérationnelle' : 'En attente / hors tension',
      tone: isCameraReady ? 'success' : 'neutral',
      detail: isCameraReady ? 'Prête pour la captation terrain.' : 'Allumez la caméra sur le terrain.',
    },
    {
      id: 'records',
      label: 'ACCÈS AUX ENREGISTREMENTS',
      value: hasRecordsAccess ? 'Accès bibliothèque autorisé' : 'Accès restreint',
      tone: hasRecordsAccess ? 'success' : 'warning',
      detail: hasRecordsAccess ? 'Lecture et import ProDay disponibles.' : 'Connexion au compte requise.',
    },
    {
      id: 'stream',
      label: 'DISPONIBILITÉ DIRECT LIVE',
      value: VEO_STREAM_LABEL[stream],
      tone: stream === 'interrupted' ? 'danger' : stream === 'unavailable' ? 'neutral' : isLiveReady ? 'success' : 'warning',
      detail: streamDetail,
    },
  ];

  return (
    <View style={styles.card} testID="veo-state-axes">
      <ProDayText variant="caption" muted style={styles.overline}>
        ÉTATS DISTINCTS
      </ProDayText>
      <View style={styles.group}>
        {rows.map((row, index) => (
          <View key={row.id}>
            <View style={styles.axisRow} testID="veo-state-row">
              <View style={styles.capabilityText}>
                <ProDayText variant="caption" muted style={styles.metaLabel}>
                  {row.label}
                </ProDayText>
                <ProDayText variant="caption" style={styles.capabilityLabel}>
                  {row.value}
                </ProDayText>
                {row.detail ? (
                  <ProDayText variant="caption" muted style={styles.capabilityDetail}>
                    {row.detail}
                  </ProDayText>
                ) : null}
              </View>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: toneColor(tokens, row.tone) },
                ]}
              />
            </View>
            {index < rows.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Icône d'une section, pour les en-têtes. */
export const VIDEO_SECTION_ICON: Record<string, IconName> = {
  overview: 'eye',
  library: 'videocam',
  clips: 'flash',
  live: 'globe',
  connections: 'settings',
};

/** Durée de validité du jeton Veo, en jours — dérivée de la documentation officielle. */
export const VEO_TOKEN_LIFETIME_DAYS = Math.floor(VEO_API.tokenLifetimeSeconds / 86400);

function createStyles(tokens: VideoSurfaceTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.surface,
      borderRadius: CARD_RADIUS,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
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
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      flexShrink: 0,
    },
    statusText: { ...APPLE_TYPOGRAPHY.caption2, fontWeight: '700' },
    metaList: { gap: spacing.xs },
    metaRow: { gap: 1 },
    metaLabel: { ...APPLE_TYPOGRAPHY.caption2, textTransform: 'uppercase', fontWeight: '600' },
    metaValue: { ...APPLE_TYPOGRAPHY.footnote, lineHeight: 17 },
    switcherRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: CARD_RADIUS,
      borderWidth: 1,
    },
    chipLabel: { fontWeight: '700', fontSize: 13 },
    methodHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    methodHeadText: { flex: 1, minWidth: 0, gap: 2 },
    methodDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
    methodBody: { gap: spacing.sm, paddingBottom: spacing.md },
    stepsOverline: {
      ...APPLE_TYPOGRAPHY.caption2,
      textTransform: 'uppercase',
      fontWeight: '700',
      marginTop: spacing.xs,
    },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    stepIndex: { ...APPLE_TYPOGRAPHY.caption2, fontWeight: '700', minWidth: 12 },
    stepText: { flex: 1, minWidth: 0, lineHeight: 17 },
    axisRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    statText: { flex: 1, minWidth: 0, gap: 1 },
    statLabel: { ...APPLE_TYPOGRAPHY.body, fontWeight: '600' },
    statHint: { ...APPLE_TYPOGRAPHY.caption2, lineHeight: 15 },
    statValue: { ...APPLE_TYPOGRAPHY.headline, flexShrink: 0 },
    group: { gap: 0 },
    capabilityRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    capabilityText: { flex: 1, minWidth: 0, gap: 2 },
    capabilityLabel: { fontWeight: '700', fontSize: 14 },
    capabilityDetail: { lineHeight: 16 },
    capabilityRequires: { lineHeight: 16, fontStyle: 'italic' },
    productRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.border,
      // Filet aligné sous le texte, pas sous la pastille (D-010).
      marginLeft: 0,
    },
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
    emptyBox: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
    emptyTitle: { textAlign: 'center' },
    emptyBody: { textAlign: 'center', lineHeight: 17 },
  });
}

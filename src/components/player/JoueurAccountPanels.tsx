import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../models/User';
import type { AppColors } from '../../theme/universeTheme';
import type { ProductLineId } from '../../models/ProductLine';
import type { AppSpaceId } from '../../models/AppSpace';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { isAmateurProductLine } from '../../models/ProductLine';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring, StaggerReveal } from '../motion';
import { Icon } from '../ui/Icon';
import { PlayerPositionPitchPicker } from '../profile/PlayerPositionPitchPicker';
import { PlayerCvLivePreview } from '../profile/PlayerCvLivePreview';
import { ProfileGalleryEditor } from '../profile/ProfileGalleryEditor';
import { LanguageSettingControl } from '../settings/LanguageSettingControl';
import { PlayerThemeSettingsPanel } from './PlayerThemeSettingsPanel';
import { AppSpacePill } from '../appSpace/AppSpaceBanner';
import { JoueurMesVideosPanel } from './JoueurMesVideosPanel';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';
import { buildPlayerCvHtmlFromUser } from '../../utils/pdfGenerator';
import { openPlayerCvHtml } from '../../utils/openCvHtml';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { spacing } from '../../theme/designTokens';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';

type Accent = string;

function PanelShell({
  accent,
  kicker,
  title,
  subtitle,
  children,
  wash,
}: {
  accent: Accent;
  kicker: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wash?: [string, string, string];
}) {
  const gradient = wash ?? (['#0B1220', '#07101C', '#05080F'] as [string, string, string]);
  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={gradient}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.shellHeader}>
        <View style={[styles.topBar, { borderColor: `${accent}55` }]}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <ProDayText variant="caption" style={[styles.topKicker, { color: accent }]}>
            {kicker}
          </ProDayText>
        </View>
        <ProDayText variant="title" style={styles.topTitle}>
          {title}
        </ProDayText>
        {subtitle ? (
          <Text style={styles.shellSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Block({
  accent,
  label,
  sublabel,
  icon,
  children,
}: {
  accent: Accent;
  label: string;
  sublabel?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.block, { borderColor: `${accent}33` }]}>
      <View style={styles.blockHeader}>
        {icon ? (
          <View style={[styles.blockIconBox, { backgroundColor: `${accent}18` }]}>
            <Ionicons name={icon} size={15} color={accent} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <ProDayText variant="caption" style={[styles.blockLabel, { color: accent }]}>
            {label}
          </ProDayText>
          {sublabel ? <Text style={styles.blockSublabel}>{sublabel}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function ActionTile({
  accent,
  icon,
  title,
  sub,
  onPress,
}: {
  accent: Accent;
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <PressableSpring onPress={onPress} scaleTo={0.97} haptic style={[styles.tile, { borderColor: `${accent}44` }]}>
      <View style={[styles.tileIcon, { backgroundColor: `${accent}22` }]}>
        <Icon name={icon} size={18} color={accent} />
      </View>
      <View style={styles.tileCopy}>
        <ProDayText variant="section" style={styles.tileTitle}>
          {title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.tileSub}>
          {sub}
        </ProDayText>
      </View>
      <Icon name="chevron-forward" size={16} color={JOUEUR_SITE.muted} />
    </PressableSpring>
  );
}

type VitrineProps = {
  profile: User;
  colors: AppColors;
  productLine: ProductLineId;
  accent: Accent;
  wash?: [string, string, string];
  gallery: string[];
  videos: string[];
  uploadingGallery: boolean;
  savingPosition?: boolean;
  hasStats: boolean;
  stats?: { matches: number; goals: number; assists: number };
  onPositionChange?: (position: string) => void | Promise<void>;
  onJerseyNumberChange?: (jersey: number | null) => void | Promise<void>;
  onCvEditor: () => void;
  onGalleryAdd: () => void;
  onGalleryRemove: (url: string) => void;
  onAvatarPress?: () => void;
  JerseyField: React.ReactNode;
};

export function JoueurVitrinePanel(props: VitrineProps) {
  const p = props.profile.profile;
  const gradient = props.wash ?? (['#080E18', '#050A12', '#03060A'] as [string, string, string]);

  const handleExportPdf = () => {
    prodayHaptics.confirm();
    const html = buildPlayerCvHtmlFromUser(props.profile);
    openPlayerCvHtml(html, props.profile.display_name);
  };

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={gradient}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 1. EN-TÊTE HERO PARCOURS */}
      <View style={vitrineStyles.heroHeader}>
        <View
          style={[
            vitrineStyles.heroBadge,
            { borderColor: `${props.accent}55`, backgroundColor: `${props.accent}15` },
          ]}
        >
          <View style={[vitrineStyles.liveDot, { backgroundColor: '#10B981' }]} />
          <Text style={[vitrineStyles.heroBadgeText, { color: props.accent }]}>
            MON PARCOURS ATHLÈTE
          </Text>
        </View>
        <Text style={vitrineStyles.heroTitle}>Passeport & Carrière</Text>
        <Text style={vitrineStyles.heroSubtitle}>
          Votre vitrine officielle, passeport joueur, poste terrain et historique de clubs pour les recruteurs et coachs.
        </Text>
      </View>

      {/* PHOTO DE PROFIL RAPIDE */}
      {props.onAvatarPress ? (
        <Block
          accent={props.accent}
          label="PHOTO DE PROFIL OFFICIELLE"
          sublabel="Votre photo officielle affichée sur votre carte et votre passeport"
          icon="camera-outline"
        >
          <PressableSpring
            onPress={props.onAvatarPress}
            scaleTo={0.97}
            haptic
            style={[styles.outlineBtn, { borderColor: `${props.accent}55` }]}
          >
            <Ionicons name="camera" size={16} color={props.accent} />
            <ProDayText variant="caption" style={[styles.outlineBtnText, { color: props.accent }]}>
              {props.profile.avatar_url ? 'Modifier ma photo de profil' : 'Ajouter une photo de profil'}
            </ProDayText>
          </PressableSpring>
        </Block>
      ) : null}

      {/* 2. BLOC TACTIQUE : POSTE & NUMÉRO */}
      <Block
        accent={props.accent}
        label="POSTE SUR LE TERRAIN & MAILLOT"
        sublabel="Définissez votre zone de jeu et numéro officiel de match"
        icon="football-outline"
      >
        {props.JerseyField}

        <PlayerPositionPitchPicker
          value={p.position ?? ''}
          onChange={(position) => void props.onPositionChange?.(position)}
          saving={props.savingPosition}
          hint={p.position ? undefined : 'Choisis ton poste pour ta carte'}
          compact
        />
      </Block>

      {/* 3. BLOC CV SPORTIF & PASSEPORT PRO */}
      <Block
        accent={props.accent}
        label="PASSEPORT & CV SPORTIF OFFICIEL"
        sublabel="Votre dossier athlète certifié avec export PDF imprimable A4"
        icon="document-text-outline"
      >
        <PlayerCvLivePreview user={props.profile} colors={props.colors} />

        <View style={styles.btnRow}>
          <PressableSpring
            onPress={props.onCvEditor}
            scaleTo={0.97}
            haptic
            style={[styles.primaryBtn, { backgroundColor: props.accent, flex: 1 }]}
          >
            <Ionicons name="create-outline" size={16} color="#070B14" />
            <ProDayText variant="caption" style={styles.primaryBtnText}>
              Modifier CV
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={handleExportPdf}
            scaleTo={0.97}
            haptic
            style={[styles.outlineBtn, { borderColor: `${props.accent}55`, flex: 1 }]}
          >
            <Ionicons name="download-outline" size={16} color="#FFFFFF" />
            <ProDayText variant="caption" style={styles.outlineBtnText}>
              Télécharger PDF
            </ProDayText>
          </PressableSpring>
        </View>
      </Block>

      {/* 4. BLOC STATISTIQUES OFFICIELLES */}
      {props.hasStats && props.stats ? (
        <Block
          accent={props.accent}
          label="BILAN STATISTIQUE SAISON"
          sublabel="Données de performance certifiées"
          icon="stats-chart-outline"
        >
          <View style={styles.statRow}>
            {(
              [
                { v: props.stats.matches, l: 'Matchs' },
                { v: props.stats.goals, l: 'Buts' },
                { v: props.stats.assists, l: 'Passes Dé' },
              ] as const
            ).map((s) => (
              <View key={s.l} style={[styles.statChip, { borderColor: `${props.accent}44` }]}>
                <ProDayText variant="title" style={styles.statValue}>
                  {s.v}
                </ProDayText>
                <ProDayText variant="caption" style={styles.statLabel}>
                  {s.l}
                </ProDayText>
              </View>
            ))}
          </View>
        </Block>
      ) : null}

      {/* 5. BLOC MÉDIAS & HIGHLIGHTS */}
      <Block
        accent={props.accent}
        label="VIDÉOS & PHOTOS HIGHLIGHTS"
        sublabel="Vos meilleurs gestes et photos de match pour les recruteurs"
        icon="videocam-outline"
      >
        <ProfileGalleryEditor
          urls={props.gallery}
          productLine={props.productLine}
          uploading={props.uploadingGallery}
          onAdd={props.onGalleryAdd}
          onRemove={props.onGalleryRemove}
        />

        {props.videos.length > 0 ? (
          props.videos.map((url, index) => (
            <StaggerReveal key={url} index={index}>
              <PressableSpring
                style={[styles.videoRow, { borderColor: `${props.accent}33` }]}
                onPress={() => Linking.openURL(url).catch(() => {})}
                scaleTo={0.99}
              >
                <Ionicons name="play-circle-outline" size={18} color={props.accent} />
                <Text style={styles.videoLink} numberOfLines={1}>
                  {url}
                </Text>
                <Ionicons name="open-outline" size={14} color="rgba(255,255,255,0.4)" />
              </PressableSpring>
            </StaggerReveal>
          ))
        ) : (
          <View style={vitrineStyles.emptyMediaCard}>
            <Ionicons name="videocam-outline" size={24} color="rgba(255,255,255,0.3)" />
            <Text style={vitrineStyles.emptyMediaText}>
              Ajoutez des vidéos et photos de match pour enrichir votre passeport auprès des clubs.
            </Text>
          </View>
        )}
      </Block>
    </View>
  );
}

type ActiviteProps = {
  accent: Accent;
  wash?: [string, string, string];
  productLine: ProductLineId;
  playerUid: string;
  clubId?: string | null;
  appSpace: AppSpaceId;
  selectableAppSpaces: AppSpaceId[];
  canManageClub: boolean;
  onApplications: () => void;
  onAnnouncements: () => void;
  onTeamManagement?: () => void;
  onSetAppSpace: (space: AppSpaceId) => void;
};

export function JoueurActivitePanel(props: ActiviteProps) {
  const gradient = props.wash ?? (['#080E18', '#050A12', '#03060A'] as [string, string, string]);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={gradient}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 1. EN-TÊTE HERO ACTIVITÉ */}
      <View style={vitrineStyles.heroHeader}>
        <View
          style={[
            vitrineStyles.heroBadge,
            { borderColor: `${props.accent}55`, backgroundColor: `${props.accent}15` },
          ]}
        >
          <View style={[vitrineStyles.liveDot, { backgroundColor: '#38BDF8' }]} />
          <Text style={[vitrineStyles.heroBadgeText, { color: props.accent }]}>
            HUB ACTIVITÉ & VESTIAIRE
          </Text>
        </View>
        <Text style={vitrineStyles.heroTitle}>Activité & Vie Sportive</Text>
        <Text style={vitrineStyles.heroSubtitle}>
          Opportunités de détection mercato, découpages vidéo du staff et communications officielles du vestiaire.
        </Text>
      </View>

      {/* 2. BLOC MERCATO & OPPORTUNITÉS */}
      <Block
        accent={props.accent}
        label="MERCATO & OPPORTUNITÉS"
        sublabel="Vos candidatures, retours de clubs et détections en cours"
        icon="briefcase-outline"
      >
        <PressableSpring
          onPress={props.onApplications}
          scaleTo={0.98}
          haptic
          style={[activiteStyles.actionRow, { borderColor: `${props.accent}33` }]}
        >
          <View style={[activiteStyles.actionIconBox, { backgroundColor: `${props.accent}18` }]}>
            <Ionicons name="briefcase" size={18} color={props.accent} />
          </View>
          <View style={activiteStyles.actionCopy}>
            <Text style={activiteStyles.actionTitle}>Mes candidatures</Text>
            <Text style={activiteStyles.actionSubtitle}>
              Suivi des offres, retours des clubs et pipeline de recrutement
            </Text>
          </View>
          <View style={activiteStyles.actionBadge}>
            <Text style={[activiteStyles.actionBadgeText, { color: props.accent }]}>Consulter</Text>
            <Ionicons name="chevron-forward" size={14} color={props.accent} />
          </View>
        </PressableSpring>
      </Block>

      {/* 3. BLOC SÉQUENCES DU COACH */}
      {props.clubId ? (
        <Block
          accent={props.accent}
          label="SÉQUENCES VIDÉO DU COACH"
          sublabel="Découpages vidéo et analyses partagés par votre staff"
          icon="videocam-outline"
        >
          <JoueurMesVideosPanel
            clubId={props.clubId}
            playerUid={props.playerUid}
            accent={props.accent}
          />
        </Block>
      ) : null}

      {/* 4. BLOC PRATIQUE & FORMATS DE JEU */}
      {isAmateurProductLine(props.productLine) ? (
        <Block
          accent={props.accent}
          label="UNIVERS & PRATIQUE"
          sublabel="Basculez d’univers pour adapter vos filtres et opportunités"
          icon="compass-outline"
        >
          <View style={styles.pillWrap}>
            {props.selectableAppSpaces.map((space) => (
              <AppSpacePill
                key={space}
                space={space}
                active={props.appSpace === space}
                onPress={() => props.onSetAppSpace(space)}
              />
            ))}
          </View>

          <View style={activiteStyles.filterRow}>
            <Ionicons name="funnel-outline" size={12} color="rgba(255, 255, 255, 0.4)" />
            <Text style={activiteStyles.filterText}>
              Filtre actif : <Text style={{ color: props.accent, fontWeight: '700' }}>{APP_SPACE_LABELS[props.appSpace]}</Text>
            </Text>
          </View>
        </Block>
      ) : null}

      {/* 5. BLOC VIE DU CLUB & VESTIAIRE */}
      <Block
        accent={props.accent}
        label="VIE DU CLUB & VESTIAIRE"
        sublabel="Actualités officielles, convocations et vie d’équipe"
        icon="shield-checkmark-outline"
      >
        {props.clubId ? (
          <View style={{ gap: 8 }}>
            {props.canManageClub && props.onTeamManagement ? (
              <PressableSpring
                onPress={props.onTeamManagement}
                scaleTo={0.98}
                haptic
                style={[activiteStyles.actionRow, { borderColor: `${props.accent}33` }]}
              >
                <View style={[activiteStyles.actionIconBox, { backgroundColor: `${props.accent}18` }]}>
                  <Ionicons name="people" size={18} color={props.accent} />
                </View>
                <View style={activiteStyles.actionCopy}>
                  <Text style={activiteStyles.actionTitle}>Gérer l’équipe</Text>
                  <Text style={activiteStyles.actionSubtitle}>
                    Effectif, rôles, organisation et staff technique
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
              </PressableSpring>
            ) : null}

            <PressableSpring
              onPress={props.onAnnouncements}
              scaleTo={0.98}
              haptic
              style={[activiteStyles.actionRow, { borderColor: `${props.accent}33` }]}
            >
              <View style={[activiteStyles.actionIconBox, { backgroundColor: `${props.accent}18` }]}>
                <Ionicons name="notifications" size={18} color={props.accent} />
              </View>
              <View style={activiteStyles.actionCopy}>
                <Text style={activiteStyles.actionTitle}>Annonces du club</Text>
                <Text style={activiteStyles.actionSubtitle}>
                  Infos officielles, calendrier et communications du vestiaire
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </PressableSpring>
          </View>
        ) : (
          <View style={[activiteStyles.emptyClubCard, { borderColor: `${props.accent}30` }]}>
            <View style={[activiteStyles.emptyClubIconWrap, { backgroundColor: `${props.accent}12` }]}>
              <Ionicons name="shield-outline" size={26} color={props.accent} />
            </View>
            <Text style={activiteStyles.emptyClubTitle}>Aucun club rattaché</Text>
            <Text style={activiteStyles.emptyClubText}>
              Rejoignez votre club pour débloquer les annonces officielles, les convocations et les découpages vidéo du coach.
            </Text>
          </View>
        )}
      </Block>
    </View>
  );
}

type ParamsProps = {
  accent: Accent;
  wash?: [string, string, string];
  showPlayerVerificationReminder: boolean;
  playerVerifyLabel?: string;
  pendingVerify: boolean;
  docLoading: boolean;
  canManageClub: boolean;
  verifiedStaff: boolean;
  clubId?: string | null;
  isPlayer: boolean;
  onPlayerVerification: () => void;
  onPickDocument: () => void;
  onVerificationFlow: () => void;
  onTeamManagement?: () => void;
  onCreateClub: () => void;
  onJoinClub: () => void;
  onVerificationSuccess: () => void;
  onReferral?: () => void;
  onLegal: (id: 'terms' | 'privacy') => void;
  onSignOut: () => void;
  onAvatarPress?: () => void;
  AlertCard: React.ComponentType<{
    title: string;
    body: string;
    cta: string;
    onPress: () => void;
    colors: AppColors;
    secondaryCta?: string;
    onSecondaryPress?: () => void;
  }>;
  colors: AppColors;
};

export function JoueurParamsPanel(props: ParamsProps) {
  const { confirmDeleteAccount, deleting } = useAccountDeletion();

  return (
    <PanelShell
      accent={props.accent}
      wash={props.wash}
      kicker="PARAMÈTRES & CONTRÔLE"
      title="Paramètres & Sécurité"
      subtitle="Gestion de vos préférences, langue, vérification d'identité et options de compte."
    >
      {props.onAvatarPress ? (
        <Block accent={props.accent} label="PHOTO DE PROFIL" icon="camera-outline">
          <ActionTile
            accent={props.accent}
            icon="person"
            title="Modifier ma photo"
            sub="Changer votre photo de profil officielle"
            onPress={props.onAvatarPress}
          />
        </Block>
      ) : null}

      <Block accent={props.accent} label="LANGUE DE L'APPLICATION" icon="language-outline">
        <LanguageSettingControl variant="card" />
      </Block>

      {props.isPlayer ? (
        <Block accent={props.accent} label="COULEURS DE MON ESPACE" icon="color-palette-outline">
          <PlayerThemeSettingsPanel />
        </Block>
      ) : null}

      {props.showPlayerVerificationReminder && props.playerVerifyLabel ? (
        <Block accent={props.accent} label="VÉRIFICATION D'IDENTITÉ" icon="shield-checkmark-outline">
          <props.AlertCard
            title={`Complète ${props.playerVerifyLabel}`}
            body="Valide ton identité pour débloquer le badge certifié ProDay."
            cta="Compléter"
            onPress={props.onPlayerVerification}
            colors={props.colors}
          />
        </Block>
      ) : null}

      {props.pendingVerify ? (
        <Block accent={props.accent} label="DOCUMENTS & JUSTIFICATIFS" icon="document-outline">
          <props.AlertCard
            title="Documents requis"
            body="Envoie tes pièces pour finaliser la vérification de ton profil."
            cta={props.docLoading ? 'Envoi…' : 'Envoyer un document'}
            onPress={props.onPickDocument}
            colors={props.colors}
            secondaryCta="Suivre le dossier"
            onSecondaryPress={props.onVerificationFlow}
          />
        </Block>
      ) : null}

      {(props.canManageClub || props.verifiedStaff || (props.isPlayer && !props.clubId)) ? (
        <Block accent={props.accent} label="CLUB & STRUCTURE" icon="business-outline">
          {props.canManageClub && props.clubId && props.onTeamManagement ? (
            <ActionTile
              accent={props.accent}
              icon="people"
              title="Gérer l’équipe"
              sub="Organisation, effectif et licences"
              onPress={props.onTeamManagement}
            />
          ) : null}
          {props.canManageClub && !props.clubId ? (
            <>
              <ActionTile
                accent={props.accent}
                icon="business"
                title="Créer un club"
                sub="Lancer une nouvelle structure"
                onPress={props.onCreateClub}
              />
              <ActionTile
                accent={props.accent}
                icon="people"
                title="Rejoindre un club"
                sub="Avec un code ou lien d'invitation"
                onPress={props.onJoinClub}
              />
            </>
          ) : null}
          {!props.clubId && props.isPlayer ? (
            <ActionTile
              accent={props.accent}
              icon="people"
              title="Rejoindre mon club"
              sub="Agenda, convocations et effectif"
              onPress={props.onJoinClub}
            />
          ) : null}
          {props.verifiedStaff ? (
            <ActionTile
              accent={props.accent}
              icon="shield"
              title="Diplôme vérifié"
              sub="Badge actif sur votre profil"
              onPress={props.onVerificationSuccess}
            />
          ) : null}
        </Block>
      ) : null}

      <Block accent={props.accent} label="LÉGAL & SÉCURITÉ" icon="lock-closed-outline">
        {props.onReferral ? (
          <ActionTile
            accent={props.accent}
            icon="people"
            title="Parrainage"
            sub="Invite des coéquipiers et gagne des récompenses"
            onPress={props.onReferral}
          />
        ) : null}
        <ActionTile
          accent={props.accent}
          icon="document"
          title="Conditions Générales"
          sub="CGU et règles d'utilisation ProDay"
          onPress={() => props.onLegal('terms')}
        />
        <ActionTile
          accent={props.accent}
          icon="lock"
          title="Confidentialité"
          sub="Politique de protection des données"
          onPress={() => props.onLegal('privacy')}
        />
      </Block>

      {/* SESSION & DANGER ZONE */}
      <PressableSpring
        onPress={props.onSignOut}
        scaleTo={0.97}
        haptic
        style={styles.logout}
      >
        <Ionicons name="log-out-outline" size={18} color="#F87171" style={{ marginRight: 6 }} />
        <ProDayText variant="caption" style={styles.logoutText}>
          Se déconnecter
        </ProDayText>
      </PressableSpring>

      <View style={[styles.block, { borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.05)', marginTop: 4 }]}>
        <Text style={[styles.blockLabel, { color: '#EF4444' }]}>ZONE DE DANGER</Text>
        <Text style={styles.dangerSubText}>
          La suppression de votre compte efface définitivement toutes vos données, vidéos et statistiques.
        </Text>
        <PressableSpring
          onPress={confirmDeleteAccount}
          disabled={deleting}
          scaleTo={0.97}
          haptic
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
          <ProDayText variant="caption" style={styles.deleteBtnText}>
            {deleting ? 'Suppression en cours…' : 'Supprimer définitivement mon compte'}
          </ProDayText>
        </PressableSpring>
      </View>
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  shellHeader: {
    gap: 4,
    marginBottom: 4,
  },
  shellSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
    marginTop: 2,
  },
  topBar: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(8,14,24,0.8)',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  topKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  topTitle: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: -0.7,
    marginTop: 4,
  },
  block: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(10,16,28,0.92)',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  blockIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  blockSublabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#070B14', fontWeight: '900', fontSize: 13 },
  outlineBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  outlineBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  statRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(8,14,24,0.75)',
  },
  statValue: { color: JOUEUR_SITE.foreground, fontWeight: '900', fontSize: 22 },
  statLabel: { color: JOUEUR_SITE.muted, fontWeight: '700', marginTop: 2 },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  videoLink: { flex: 1, color: JOUEUR_SITE.muted, fontSize: 12 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(8,14,24,0.72)',
    marginBottom: 8,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCopy: { flex: 1, gap: 2 },
  tileTitle: { color: JOUEUR_SITE.foreground, fontWeight: '800', fontSize: 14 },
  tileSub: { color: JOUEUR_SITE.muted, fontSize: 12 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logout: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#F87171',
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logoutText: { color: '#F87171', fontWeight: '900', letterSpacing: 0.4 },
  dangerSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
});

const vitrineStyles = StyleSheet.create({
  heroHeader: {
    marginBottom: 4,
    gap: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  emptyMediaCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyMediaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 17,
  },
});

const activiteStyles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 15,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  filterText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyClubCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyClubIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyClubTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyClubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 280,
  },
});

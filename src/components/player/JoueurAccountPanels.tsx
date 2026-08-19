import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { spacing } from '../../theme/designTokens';

type Accent = string;

function PanelShell({
  accent,
  kicker,
  title,
  children,
  wash,
}: {
  accent: Accent;
  kicker: string;
  title: string;
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
      <View style={[styles.topBar, { borderColor: `${accent}55` }]}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <ProDayText variant="caption" style={[styles.topKicker, { color: accent }]}>
          {kicker}
        </ProDayText>
      </View>
      <ProDayText variant="title" style={styles.topTitle}>
        {title}
      </ProDayText>
      {children}
    </View>
  );
}

function Block({
  accent,
  label,
  children,
}: {
  accent: Accent;
  wash?: [string, string, string];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.block, { borderColor: `${accent}33` }]}>
      <ProDayText variant="caption" style={[styles.blockLabel, { color: accent }]}>
        {label}
      </ProDayText>
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
  wash?: [string, string, string];
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
  JerseyField: React.ReactNode;
};

export function JoueurVitrinePanel(props: VitrineProps) {
  const p = props.profile.profile;
  return (
    <PanelShell accent={props.accent} wash={props.wash} kicker="VITRINE" title="Studio public">
      <Block accent={props.accent} label="01 · POSTE">
        <PlayerPositionPitchPicker
          value={p.position ?? ''}
          onChange={(position) => void props.onPositionChange?.(position)}
          saving={props.savingPosition}
          hint={p.position ? undefined : 'Choisis ton poste pour ta carte'}
        />
      </Block>

      <Block accent={props.accent} label="02 · MAILLOT + CV">
        {props.JerseyField}
        <View style={styles.gapSm} />
        <PlayerCvLivePreview user={props.profile} colors={props.colors} />
        <PressableSpring onPress={props.onCvEditor} scaleTo={0.97} haptic style={[styles.primaryBtn, { backgroundColor: props.accent }]}>
          <Icon name="document" size={16} color="#070B14" />
          <ProDayText variant="caption" style={styles.primaryBtnText}>
            Éditer mon CV
          </ProDayText>
        </PressableSpring>
      </Block>

      {props.hasStats && props.stats ? (
        <Block accent={props.accent} label="03 · SAISON">
          <View style={styles.statRow}>
            {(
              [
                { v: props.stats.matches, l: 'Matchs' },
                { v: props.stats.goals, l: 'Buts' },
                { v: props.stats.assists, l: 'Passes' },
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

      <Block accent={props.accent} label={props.hasStats ? '04 · MÉDIAS' : '03 · MÉDIAS'}>
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
                <Icon name="time" size={16} color={props.accent} />
                <Text style={styles.videoLink} numberOfLines={1}>
                  {url}
                </Text>
              </PressableSpring>
            </StaggerReveal>
          ))
        ) : (
          <ProDayText variant="caption" style={styles.muted}>
            Ajoute des clips pour booster ta vitrine.
          </ProDayText>
        )}
      </Block>
    </PanelShell>
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
  return (
    <PanelShell accent={props.accent} wash={props.wash} kicker="ACTIVITÉ" title="Activité joueur">
      <Block accent={props.accent} label="MERCATO">
        <ActionTile
          accent={props.accent}
          icon="briefcase"
          title="Mes candidatures"
          sub="Suivi offres, retours clubs, pipeline"
          onPress={props.onApplications}
        />
      </Block>

      {props.clubId ? (
        <Block accent={props.accent} label="VIDÉO">
          <JoueurMesVideosPanel
            clubId={props.clubId}
            playerUid={props.playerUid}
            accent={props.accent}
          />
        </Block>
      ) : null}

      {isAmateurProductLine(props.productLine) ? (
        <Block accent={props.accent} label="UNIVERS">
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
          <ProDayText variant="caption" style={styles.muted}>
            Filtre actif : {APP_SPACE_LABELS[props.appSpace]}
          </ProDayText>
        </Block>
      ) : null}

      <Block accent={props.accent} label="CLUB">
        {props.clubId ? (
          <>
            {props.canManageClub && props.onTeamManagement ? (
              <ActionTile
                accent={props.accent}
                icon="people"
                title="Gérer l’équipe"
                sub="Effectif, rôles, organisation"
                onPress={props.onTeamManagement}
              />
            ) : null}
            <ActionTile
              accent={props.accent}
              icon="notifications"
              title="Annonces club"
              sub="Infos, news, communications"
              onPress={props.onAnnouncements}
            />
          </>
        ) : (
          <View style={[styles.emptyClub, { borderColor: `${props.accent}33` }]}>
            <Icon name="people" size={18} color={JOUEUR_SITE.muted} />
            <ProDayText variant="caption" style={styles.muted}>
              Aucun club lié — rejoins une structure pour débloquer ce module.
            </ProDayText>
          </View>
        )}
      </Block>
    </PanelShell>
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
  return (
    <PanelShell accent={props.accent} wash={props.wash} kicker="PARAMÈTRES" title="Contrôle compte">
      <Block accent={props.accent} label="LANGUE">
        <LanguageSettingControl variant="card" />
      </Block>

      {props.isPlayer ? (
        <Block accent={props.accent} label="COULEURS DE MON ESPACE">
          <PlayerThemeSettingsPanel />
        </Block>
      ) : null}

      {props.showPlayerVerificationReminder && props.playerVerifyLabel ? (
        <Block accent={props.accent} label="VÉRIFICATION">
          <props.AlertCard
            title={`Complète ${props.playerVerifyLabel}`}
            body="Valide ton identité pour débloquer le badge joueur."
            cta="Compléter"
            onPress={props.onPlayerVerification}
            colors={props.colors}
          />
        </Block>
      ) : null}

      {props.pendingVerify ? (
        <Block accent={props.accent} label="DOCUMENTS">
          <props.AlertCard
            title="Documents requis"
            body="Envoie tes pièces pour finaliser la vérification."
            cta={props.docLoading ? 'Envoi…' : 'Envoyer un document'}
            onPress={props.onPickDocument}
            colors={props.colors}
            secondaryCta="Suivre le dossier"
            onSecondaryPress={props.onVerificationFlow}
          />
        </Block>
      ) : null}

      {(props.canManageClub || props.verifiedStaff || (props.isPlayer && !props.clubId)) ? (
        <Block accent={props.accent} label="STRUCTURE">
          {props.canManageClub && props.clubId && props.onTeamManagement ? (
            <ActionTile
              accent={props.accent}
              icon="people"
              title="Gérer l’équipe"
              sub="Organisation club"
              onPress={props.onTeamManagement}
            />
          ) : null}
          {props.canManageClub && !props.clubId ? (
            <>
              <ActionTile
                accent={props.accent}
                icon="business"
                title="Créer un club"
                sub="Lancer ta structure"
                onPress={props.onCreateClub}
              />
              <ActionTile
                accent={props.accent}
                icon="people"
                title="Rejoindre un club"
                sub="Code / invitation"
                onPress={props.onJoinClub}
              />
            </>
          ) : null}
          {!props.clubId && props.isPlayer ? (
            <ActionTile
              accent={props.accent}
              icon="people"
              title="Rejoindre mon club"
              sub="Agenda, convocations, équipe"
              onPress={props.onJoinClub}
            />
          ) : null}
          {props.verifiedStaff ? (
            <ActionTile
              accent={props.accent}
              icon="shield"
              title="Diplôme vérifié"
              sub="Badge actif"
              onPress={props.onVerificationSuccess}
            />
          ) : null}
        </Block>
      ) : null}

      <Block accent={props.accent} label="LÉGAL">
        {props.onReferral ? (
          <ActionTile
            accent={props.accent}
            icon="people"
            title="Parrainage"
            sub="Invite et gagne"
            onPress={props.onReferral}
          />
        ) : null}
        <ActionTile
          accent={props.accent}
          icon="document"
          title="Conditions"
          sub="CGU ProDay"
          onPress={() => props.onLegal('terms')}
        />
        <ActionTile
          accent={props.accent}
          icon="lock"
          title="Confidentialité"
          sub="Politique & données"
          onPress={() => props.onLegal('privacy')}
        />
      </Block>

      <PressableSpring
        onPress={props.onSignOut}
        scaleTo={0.97}
        style={styles.logout}
      >
        <ProDayText variant="caption" style={styles.logoutText}>
          Se déconnecter
        </ProDayText>
      </PressableSpring>
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
    fontSize: 28,
    letterSpacing: -0.7,
    marginTop: -2,
  },
  block: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(10,16,28,0.92)',
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  gapSm: { height: 8 },
  primaryBtn: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#070B14', fontWeight: '900' },
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
  muted: { color: JOUEUR_SITE.muted, lineHeight: 18 },
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
  emptyClub: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  logout: {
    borderWidth: 1.5,
    borderColor: '#F87171',
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#F87171', fontWeight: '900', letterSpacing: 0.4 },
});

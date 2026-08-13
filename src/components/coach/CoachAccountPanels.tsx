import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import { COACH_SITE } from '../../content/coachPageIdentity';
import {
  CoachActionRow,
  CoachEmptyState,
  CoachSectionCard,
} from './coachPortalUi';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { LanguageSettingControl } from '../settings/LanguageSettingControl';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { spacing } from '../../theme/designTokens';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.field}>
      <ProDayText variant="caption" style={styles.fieldLabel}>
        {label}
      </ProDayText>
      <ProDayText variant="body" style={styles.fieldValue}>
        {value?.trim() ? value : '—'}
      </ProDayText>
    </View>
  );
}

export function CoachVitrinePanel({
  profile,
  onEdit,
  onPublicProfile,
}: {
  profile: User;
  onEdit?: () => void;
  onPublicProfile?: () => void;
}) {
  const p = profile.profile;
  const experiences = p.experiences ?? [];
  const diplomas =
    p.diplomas_list ??
    (p.diploma
      ? [{ id: 'diploma', name: p.diploma, institution: 'Renseigné', verified: profile.is_verified }]
      : []);

  return (
    <View style={styles.stack}>
      <CoachSectionCard
        kicker="Vitrine"
        title="Parcours coach"
        body="Ce que les clubs et joueurs voient sur ton profil public."
      >
        <Field label="Titre" value={p.job_title} />
        <Field label="Diplôme" value={p.diploma} />
        <Field label="Licence" value={p.license_number} />
        <Field label="Bio" value={p.bio} />
        {p.specialties?.length ? (
          <View style={styles.tags}>
            {p.specialties.map((s) => (
              <View key={s} style={styles.tag}>
                <ProDayText variant="caption" style={styles.tagText}>
                  {s}
                </ProDayText>
              </View>
            ))}
          </View>
        ) : null}
        <CoachActionRow
          primary="Éditer"
          onPrimary={() => onEdit?.()}
          secondary="Voir public"
          onSecondary={() => onPublicProfile?.()}
        />
      </CoachSectionCard>

      <CoachSectionCard kicker="Expérience" title="Clubs & missions">
        {experiences.length ? (
          experiences.map((exp, index) => (
            <View
              key={exp.id}
              style={[styles.timelineRow, index > 0 && styles.timelineBorder]}
            >
              <View style={styles.dot} />
              <View style={styles.timelineBody}>
                <ProDayText variant="section" style={styles.expTitle}>
                  {exp.title}
                </ProDayText>
                <ProDayText variant="caption" style={styles.expOrg}>
                  {exp.organization}
                </ProDayText>
                <ProDayText variant="caption" style={styles.expPeriod}>
                  {exp.period}
                </ProDayText>
              </View>
            </View>
          ))
        ) : (
          <CoachEmptyState
            title="Aucune expérience"
            body="Ajoute tes clubs entraînés et tes missions pour renforcer ta vitrine."
            cta="Compléter"
            onPress={() => onEdit?.()}
          />
        )}
      </CoachSectionCard>

      <CoachSectionCard kicker="Certifications" title="Diplômes">
        {diplomas.length ? (
          diplomas.map((d) => (
            <View key={d.id} style={styles.diplomaRow}>
              <View style={styles.diplomaIcon}>
                <Icon name="school" size={16} color={COACH_SITE.accent} />
              </View>
              <View style={styles.diplomaInfo}>
                <ProDayText variant="section" style={styles.diplomaName}>
                  {d.name}
                </ProDayText>
                <ProDayText variant="caption" style={styles.diplomaInst}>
                  {d.institution}
                </ProDayText>
              </View>
              <ProDayText
                variant="caption"
                style={d.verified ? styles.badgeOk : styles.badgePending}
              >
                {d.verified ? 'Vérifié' : 'À vérifier'}
              </ProDayText>
            </View>
          ))
        ) : (
          <CoachEmptyState
            title="Aucun diplôme listé"
            body="BEF, UEFA B/A, BMF… renseigne tes certifications."
            cta="Ajouter"
            onPress={() => onEdit?.()}
          />
        )}
      </CoachSectionCard>
    </View>
  );
}

export function CoachActivitePanel({
  profile,
  canManageClub,
  onTeamManagement,
  onAnnouncements,
}: {
  profile: User;
  canManageClub?: boolean;
  onTeamManagement?: () => void;
  onAnnouncements?: () => void;
}) {
  const shellNav = useCoachShellNav();
  const clubId = profile.profile.club_id;

  return (
    <View style={styles.stack}>
      <CoachSectionCard
        kicker="Club"
        title={clubId ? 'Club lié' : 'Pas encore de club'}
        body={
          clubId
            ? 'Gère ton effectif, les annonces et le jour de match.'
            : 'Rejoins ou crée une structure pour activer le cockpit coach.'
        }
      >
        {clubId ? (
          <View style={styles.menu}>
            {canManageClub && onTeamManagement ? (
              <MenuRow
                icon="people"
                title="Gestion d’équipe"
                sub="Licences, invitations, catégories"
                onPress={onTeamManagement}
              />
            ) : null}
            {onAnnouncements ? (
              <MenuRow
                icon="notifications"
                title="Annonces club"
                sub="Communiqués et relais parents"
                onPress={onAnnouncements}
              />
            ) : null}
            <MenuRow
              icon="football"
              title="Centre Match"
              sub="Convocations, live, amicaux"
              onPress={() => shellNav?.requestNav('match_center')}
            />
            <MenuRow
              icon="star-four-points"
              title="Tactique IA"
              sub="Composition et consignes"
              onPress={() => shellNav?.requestNav('smart_tactics')}
            />
          </View>
        ) : (
          <CoachEmptyState
            title="Lier un club"
            body="Sans club, le planning et l’effectif restent limités."
            cta="Ouvrir effectif"
            onPress={() => shellNav?.requestNav('effectif')}
          />
        )}
      </CoachSectionCard>

      <CoachSectionCard
        kicker="Coaching"
        title="Séances & forme"
        body="Planning, analyse de charge et communication staff."
      >
        <View style={styles.menu}>
          <MenuRow
            icon="calendar"
            title="Planning"
            sub="Séances et suggestions IA"
            onPress={() => shellNav?.requestNav('planning')}
          />
          <MenuRow
            icon="heart"
            title="Analyse de forme"
            sub="Alertes avant match"
            onPress={() => shellNav?.requestNav('forme')}
          />
          <MenuRow
            icon="mail"
            title="Parents & alertes"
            sub="Relais et documents"
            onPress={() => shellNav?.requestNav('com_staff')}
          />
        </View>
      </CoachSectionCard>
    </View>
  );
}

export function CoachParamsPanel({
  profile,
  verifiedStaff,
  pendingVerify,
  showVerificationReminder,
  onVerificationFlow,
  onVerificationSuccess,
  onPickDocument,
  onCreateClub,
  onJoinClub,
  onLegal,
  onReferral,
  onSignOut,
}: {
  profile: User;
  verifiedStaff?: boolean;
  pendingVerify?: boolean;
  showVerificationReminder?: boolean;
  onVerificationFlow?: () => void;
  onVerificationSuccess?: () => void;
  onPickDocument?: () => void;
  onCreateClub?: () => void;
  onJoinClub?: () => void;
  onLegal?: (id: 'terms' | 'privacy') => void;
  onReferral?: () => void;
  onSignOut?: () => void;
}) {
  return (
    <View style={styles.stack}>
      <CoachSectionCard kicker="Préférences" title="Langue">
        <LanguageSettingControl variant="card" />
      </CoachSectionCard>

      <CoachSectionCard
        kicker="Vérification"
        title="Statut coach"
        body={
          verifiedStaff
            ? 'Ton profil coach est vérifié.'
            : pendingVerify || showVerificationReminder
              ? 'Envoie tes justificatifs pour activer le badge vérifié.'
              : 'Vérifie ton identité et tes diplômes pour renforcer la confiance.'
        }
      >
        <View style={styles.menu}>
          {onVerificationFlow ? (
            <MenuRow
              icon="shield"
              title="Parcours de vérification"
              sub="Identité & diplômes"
              onPress={onVerificationFlow}
            />
          ) : null}
          {onPickDocument ? (
            <MenuRow
              icon="document"
              title="Envoyer un document"
              sub="PDF ou photo"
              onPress={onPickDocument}
            />
          ) : null}
          {verifiedStaff && onVerificationSuccess ? (
            <MenuRow
              icon="checkmark-circle"
              title="Badge vérifié"
              sub="Actif sur ta vitrine"
              onPress={onVerificationSuccess}
            />
          ) : null}
        </View>
      </CoachSectionCard>

      {!profile.profile.club_id ? (
        <CoachSectionCard kicker="Structure" title="Club">
          <View style={styles.menu}>
            {onCreateClub ? (
              <MenuRow
                icon="add"
                title="Créer un club"
                sub="Nouvelle structure ProDay"
                onPress={onCreateClub}
              />
            ) : null}
            {onJoinClub ? (
              <MenuRow
                icon="people"
                title="Rejoindre un club"
                sub="Code invitation"
                onPress={onJoinClub}
              />
            ) : null}
          </View>
        </CoachSectionCard>
      ) : null}

      <CoachSectionCard kicker="Légal" title="Compte">
        <View style={styles.menu}>
          {onReferral ? (
            <MenuRow
              icon="people"
              title="Parrainage"
              sub="Invite un coach ou un club"
              onPress={onReferral}
            />
          ) : null}
          {onLegal ? (
            <>
              <MenuRow
                icon="document"
                title="Conditions"
                sub="CGU ProDay"
                onPress={() => onLegal('terms')}
              />
              <MenuRow
                icon="lock"
                title="Confidentialité"
                sub="Politique de données"
                onPress={() => onLegal('privacy')}
              />
            </>
          ) : null}
        </View>
        {onSignOut ? (
          <CoachActionRow primary="Se déconnecter" onPrimary={onSignOut} />
        ) : null}
      </CoachSectionCard>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.menuRow}>
      <View style={styles.menuIcon}>
        <Icon name={icon} size={16} color={COACH_SITE.accent} />
      </View>
      <View style={styles.menuCopy}>
        <ProDayText variant="section" style={styles.menuTitle}>
          {title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.menuSub}>
          {sub}
        </ProDayText>
      </View>
      <Icon name="chevron-forward" size={16} color={COACH_SITE.muted} />
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  field: { gap: 2, marginTop: spacing.sm },
  fieldLabel: {
    color: COACH_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontSize: 10,
    fontWeight: '700',
  },
  fieldValue: { color: COACH_SITE.foreground, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  tag: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COACH_SITE.accent}66`,
    backgroundColor: COACH_SITE.soft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { color: COACH_SITE.foreground, fontWeight: '700', fontSize: 11 },
  timelineRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  timelineBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COACH_SITE.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COACH_SITE.accent,
    marginTop: 6,
  },
  timelineBody: { flex: 1, gap: 2 },
  expTitle: { color: COACH_SITE.foreground, fontWeight: '800' },
  expOrg: { color: COACH_SITE.accent, fontWeight: '700' },
  expPeriod: { color: COACH_SITE.muted },
  diplomaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  diplomaIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
  },
  diplomaInfo: { flex: 1, gap: 2 },
  diplomaName: { color: COACH_SITE.foreground, fontWeight: '800' },
  diplomaInst: { color: COACH_SITE.muted },
  badgeOk: { color: COACH_SITE.accent, fontWeight: '800', fontSize: 10, letterSpacing: 0.8 },
  badgePending: { color: COACH_SITE.muted, fontWeight: '700', fontSize: 10 },
  menu: { gap: 4, marginTop: spacing.sm },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  menuIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
  },
  menuCopy: { flex: 1, gap: 2 },
  menuTitle: { color: COACH_SITE.foreground, fontWeight: '800' },
  menuSub: { color: COACH_SITE.muted },
});

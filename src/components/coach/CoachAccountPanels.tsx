import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../models/User';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { LanguageSettingControl } from '../settings/LanguageSettingControl';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { spacing } from '../../theme/designTokens';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { coachTokensAsAppColors } from '../../features/coach/shell/coachTokensAsAppColors';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';
import { buildCoachCvHtmlFromUser } from '../../utils/pdfGenerator';
import { openPlayerCvHtml } from '../../utils/openCvHtml';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';

function PanelHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.panelHeader}>
      <View style={styles.kickerBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.kickerText}>{kicker}</Text>
      </View>
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelSubtitle}>{subtitle}</Text>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>
          <Ionicons name={icon} size={16} color={ELITE_COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function MenuRow({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.menuRow}>
      <View style={styles.menuIconBox}>
        <Ionicons name={icon} size={16} color={ELITE_COLORS.primary} />
      </View>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
    </PressableSpring>
  );
}

export function CoachVitrinePanel({
  profile,
  onEdit,
  onPublicProfile,
  onAvatarPress,
}: {
  profile: User;
  onEdit?: () => void;
  onPublicProfile?: () => void;
  onAvatarPress?: () => void;
}) {
  const p = profile.profile;
  const experiences = p.experiences ?? [];
  const diplomas =
    p.diplomas_list ??
    (p.diploma
      ? [{ id: 'diploma', name: p.diploma, institution: 'FFF / Fédéral', verified: profile.is_verified }]
      : []);
  const specialties = p.specialties ?? ['Animation tactique', 'Préparation physique', 'Management'];

  const handleExportCv = () => {
    prodayHaptics.confirm();
    const html = buildCoachCvHtmlFromUser(profile);
    openPlayerCvHtml(html, profile.display_name);
  };

  return (
    <View style={styles.stack}>
      <PanelHeader
        kicker="PARCOURS DU COACH"
        title="Parcours & Vitrine Staff"
        subtitle="Votre CV officiel, diplômes certifiés et historique des clubs entraînés."
      />

      {/* 1. INFORMATIONS CLÉS */}
      <SectionCard
        title="IDENTITÉ TERRAIN & LICENCE"
        subtitle="Informations certifiées visibles par les clubs et recruteurs"
        icon="school-outline"
      >
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Poste / Titre</Text>
            <Text style={styles.infoValue}>{p.job_title || 'Entraîneur principal'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Diplôme principal</Text>
            <Text style={styles.infoValue}>{p.diploma || 'BEF / UEFA'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Licence FFF</Text>
            <Text style={styles.infoValue}>{p.license_number || 'Validée FFF'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Expérience</Text>
            <Text style={styles.infoValue}>{p.years_experience ? `${p.years_experience} ans` : '8 ans'}</Text>
          </View>
        </View>

        <View style={styles.specialtiesWrap}>
          <Text style={styles.infoLabel}>Spécialités tactiques :</Text>
          <View style={styles.tags}>
            {specialties.map((s) => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.btnRow}>
          <PressableSpring
            onPress={() => {
              prodayHaptics.press();
              onEdit?.();
            }}
            scaleTo={0.97}
            haptic
            style={[styles.primaryBtn, { flex: 1 }]}
          >
            <Ionicons name="create-outline" size={16} color="#000000" />
            <Text style={styles.primaryBtnText}>Modifier profil</Text>
          </PressableSpring>

          <PressableSpring
            onPress={() => {
              prodayHaptics.press();
              onPublicProfile?.();
            }}
            scaleTo={0.97}
            haptic
            style={[styles.outlineBtn, { flex: 1 }]}
          >
            <Ionicons name="globe-outline" size={16} color="#FFFFFF" />
            <Text style={styles.outlineBtnText}>Vitrine publique</Text>
          </PressableSpring>
        </View>
      </SectionCard>

      {/* 2. DIPLÔMES ET CERTIFICATIONS */}
      <SectionCard
        title="DIPLÔMES & CERTIFICATIONS"
        subtitle="Diplômes d’État et formations fédérales enregistrées"
        icon="ribbon-outline"
      >
        {diplomas.length ? (
          diplomas.map((d) => (
            <View key={d.id} style={styles.diplomaRow}>
              <View style={styles.diplomaIconBox}>
                <Ionicons name="school" size={16} color={ELITE_COLORS.primary} />
              </View>
              <View style={styles.diplomaInfo}>
                <Text style={styles.diplomaName}>{d.name}</Text>
                <Text style={styles.diplomaInst}>{d.institution || 'FFF'}</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>VÉRIFIÉ</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHint}>Renseignez vos diplômes pour valoriser votre profil.</Text>
        )}
      </SectionCard>

      {/* 3. PARCOURS & EXPÉRIENCES */}
      <SectionCard
        title="HISTORIQUE & CLUBS ENTRAÎNÉS"
        subtitle="Clubs précédents, catégories et missions accomplies"
        icon="briefcase-outline"
      >
        {experiences.length ? (
          experiences.map((exp, index) => (
            <View
              key={exp.id}
              style={[styles.timelineRow, index > 0 && styles.timelineBorder]}
            >
              <View style={styles.dot} />
              <View style={styles.timelineBody}>
                <Text style={styles.expTitle}>{exp.title || 'Entraîneur'}</Text>
                <Text style={styles.expOrg}>{exp.organization}</Text>
                {exp.period ? <Text style={styles.expPeriod}>{exp.period}</Text> : null}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHint}>Ajoutez vos expériences pour enrichir votre CV en ligne.</Text>
        )}

        <PressableSpring
          onPress={handleExportCv}
          scaleTo={0.97}
          haptic
          style={[styles.outlineBtn, { marginTop: 12 }]}
        >
          <Ionicons name="document-text" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.outlineBtnText}>Télécharger mon CV Coach (PDF)</Text>
        </PressableSpring>
      </SectionCard>
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
      <PanelHeader
        kicker="ACTIVITÉ DU VESTIAIRE"
        title="Activité & Jour de Match"
        subtitle="Centre match, tactique IA, gestion de l'effectif et communications."
      />

      {/* 1. MATCHS & TACTIQUE */}
      <SectionCard
        title="CENTRE MATCH & STRATÉGIE IA"
        subtitle="Gestion du banc, convocations et dispositif tactique"
        icon="football-outline"
      >
        <View style={styles.menu}>
          <MenuRow
            icon="clipboard-outline"
            title="Centre Match & Convocations"
            sub="Feuille de match, pointage vestiaire et live"
            onPress={() => shellNav?.requestNav('match_center')}
          />
          <MenuRow
            icon="analytics-outline"
            title="Terrain & Compositions"
            sub="Compositions ajustables, pressing et plan de jeu"
            onPress={() => shellNav?.requestNav('equipe')}
          />
          <MenuRow
            icon="sparkles-outline"
            title="Copilote Assistant IA"
            sub="Générateur de séances, causeries et analyse adverse"
            onPress={() => shellNav?.requestNav('coach_ia')}
          />
        </View>
      </SectionCard>

      {/* 2. ENTRAÎNEMENTS & CHARGE */}
      <SectionCard
        title="PLANNING & ANALYSE DE FORME"
        subtitle="Calendrier des séances et état physique du groupe"
        icon="calendar-outline"
      >
        <View style={styles.menu}>
          <MenuRow
            icon="calendar-outline"
            title="Planning des Séances"
            sub="Séances, thèmes d'entraînement et calendrier"
            onPress={() => shellNav?.requestNav('entrainements')}
          />
          <MenuRow
            icon="heart-outline"
            title="Analyse de Forme & Blessures"
            sub="Disponibilité pour le week-end et assiduité"
            onPress={() => shellNav?.requestNav('forme')}
          />
          <MenuRow
            icon="chatbubbles-outline"
            title="Vestiaire & Relais Parents"
            sub="Communications staff, documents et alertes"
            onPress={() => shellNav?.requestNav('com_staff')}
          />
        </View>
      </SectionCard>

      {/* 3. CLUB & EFFECTIF */}
      <SectionCard
        title="STRUCTURE & EFFECTIF"
        subtitle={clubId ? 'Club rattaché actif' : 'Rejoindre ou créer un club'}
        icon="people-outline"
      >
        {clubId ? (
          <View style={styles.menu}>
            {canManageClub && onTeamManagement ? (
              <MenuRow
                icon="people-outline"
                title="Gestion d’équipe"
                sub="Licences, effectif et numéros"
                onPress={onTeamManagement}
              />
            ) : null}
            {onAnnouncements ? (
              <MenuRow
                icon="notifications-outline"
                title="Annonces Club"
                sub="Communiqués officiels et calendrier"
                onPress={onAnnouncements}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="shield-outline" size={28} color={ELITE_COLORS.primary} />
            <Text style={styles.emptyTitle}>Lier un club officiel</Text>
            <Text style={styles.emptyText}>
              Rattachez votre structure pour activer le planning complet et la gestion de vos joueurs.
            </Text>
          </View>
        )}
      </SectionCard>
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
  onAvatarPress,
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
  onAvatarPress?: () => void;
}) {
  const { tokens } = useCoachTheme();
  const { confirmDeleteAccount, deleting } = useAccountDeletion();

  return (
    <View style={styles.stack}>
      <PanelHeader
        kicker="PARAMÈTRES DU STAFF"
        title="Paramètres & Sécurité"
        subtitle="Gestion de vos préférences, vérification FFF, club et compte."
      />

      {/* 1. PRÉFÉRENCES & PHOTO */}
      <SectionCard
        title="IDENTITÉ VISUELLE & PRÉFÉRENCES"
        subtitle="Photo de profil, langue de l'interface et personnalisation"
        icon="person-outline"
      >
        {onAvatarPress ? (
          <View style={styles.menu}>
            <MenuRow
              icon="camera-outline"
              title="Photo de profil"
              sub={profile.avatar_url ? 'Modifier votre photo officielle staff' : 'Ajouter une photo de profil'}
              onPress={onAvatarPress}
            />
          </View>
        ) : null}
        <LanguageSettingControl
          variant="card"
          colors={coachTokensAsAppColors(tokens)}
        />
      </SectionCard>

      {/* 2. VÉRIFICATION DIPLÔMES */}
      <SectionCard
        title="CERTIFICATION STAFF & FFF"
        subtitle="Vérification de votre identité et licence pour activer le badge"
        icon="shield-checkmark-outline"
      >
        <View style={styles.menu}>
          {onVerificationFlow ? (
            <MenuRow
              icon="shield-outline"
              title="Parcours de vérification"
              sub="Diplômes fédéraux & pièce d'identité"
              onPress={onVerificationFlow}
            />
          ) : null}
          {onPickDocument ? (
            <MenuRow
              icon="document-outline"
              title="Envoyer un justificatif"
              sub="Photo de licence ou diplôme PDF"
              onPress={onPickDocument}
            />
          ) : null}
          {verifiedStaff && onVerificationSuccess ? (
            <MenuRow
              icon="checkmark-circle-outline"
              title="Badge Vérifié actif"
              sub="Affiché sur votre carte et vitrine"
              onPress={onVerificationSuccess}
            />
          ) : null}
        </View>
      </SectionCard>

      {/* 3. STRUCTURE */}
      {!profile.profile.club_id ? (
        <SectionCard
          title="STRUCTURE & CLUB"
          subtitle="Création ou adhésion à une structure ProDay"
          icon="business-outline"
        >
          <View style={styles.menu}>
            {onCreateClub ? (
              <MenuRow
                icon="add-circle-outline"
                title="Créer un club"
                sub="Lancer une nouvelle entité sportive"
                onPress={onCreateClub}
              />
            ) : null}
            {onJoinClub ? (
              <MenuRow
                icon="people-outline"
                title="Rejoindre un club"
                sub="Avec un code invitation"
                onPress={onJoinClub}
              />
            ) : null}
          </View>
        </SectionCard>
      ) : null}

      {/* 4. LÉGAL & PARRAINAGE */}
      <SectionCard
        title="LÉGAL & COMPTE"
        subtitle="Parrainage, conditions générales et sécurité des données"
        icon="lock-closed-outline"
      >
        <View style={styles.menu}>
          {onReferral ? (
            <MenuRow
              icon="people-outline"
              title="Parrainage Coach"
              sub="Invitez un autre éducateur ou club"
              onPress={onReferral}
            />
          ) : null}
          {onLegal ? (
            <>
              <MenuRow
                icon="document-text-outline"
                title="Conditions Générales"
                sub="CGU et règles ProDay"
                onPress={() => onLegal('terms')}
              />
              <MenuRow
                icon="lock-closed-outline"
                title="Confidentialité"
                sub="Protection des données personnelles"
                onPress={() => onLegal('privacy')}
              />
            </>
          ) : null}
        </View>

        {onSignOut ? (
          <PressableSpring
            onPress={onSignOut}
            scaleTo={0.97}
            haptic
            style={styles.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={17} color="#F87171" style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Se déconnecter</Text>
          </PressableSpring>
        ) : null}

        <View style={styles.dangerBox}>
          <Text style={styles.dangerTitle}>ZONE DE DANGER</Text>
          <Text style={styles.dangerSubtitle}>
            La suppression du compte supprime définitivement tous vos entraînements, fiches tactiques et effectifs.
          </Text>
          <PressableSpring
            onPress={confirmDeleteAccount}
            disabled={deleting}
            scaleTo={0.97}
            haptic
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.deleteBtnText}>
              {deleting ? 'Suppression en cours…' : 'Supprimer définitivement mon compte'}
            </Text>
          </PressableSpring>
        </View>
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  panelHeader: {
    gap: 4,
    marginBottom: 4,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: ELITE_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ELITE_COLORS.primary,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: '800',
    color: ELITE_COLORS.primary,
    letterSpacing: 0.8,
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  panelSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  card: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: ELITE_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: ELITE_COLORS.primary,
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoItem: {
    width: '48%',
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    padding: 12,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  specialtiesWrap: {
    gap: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: ELITE_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  tagText: {
    color: ELITE_COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: ELITE_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  outlineBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  diplomaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  diplomaIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: ELITE_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diplomaInfo: {
    flex: 1,
  },
  diplomaName: {
    fontSize: 13,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  diplomaInst: {
    fontSize: 11,
    color: ELITE_COLORS.textSecondary,
  },
  badgeSuccess: {
    backgroundColor: ELITE_COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccessText: {
    color: ELITE_COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  timelineBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ELITE_COLORS.primary,
    marginTop: 6,
  },
  timelineBody: {
    flex: 1,
  },
  expTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  expOrg: {
    fontSize: 12,
    color: ELITE_COLORS.primary,
    fontWeight: '600',
  },
  expPeriod: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
  },
  emptyHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  menu: {
    gap: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCopy: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  menuSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 16,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: ELITE_COLORS.border,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  logoutBtnText: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 13,
  },
  dangerBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    gap: 6,
  },
  dangerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EF4444',
  },
  dangerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 15,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 12,
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon, type IconName } from '../components/ui/Icon';
import { PressableSpring, StaggerReveal } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { prodayHaptics } from '../utils/prodayHaptics';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { JoueurScreenChrome } from '../components/joueur/JoueurScreenChrome';
import { FUT18_PREMIUM } from '../theme/fut18PremiumPalette';
import { JOUEUR_SURFACES } from '../theme/joueurDesignSystem';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { clubsService } from '../services/clubs.service';
import { teamsService } from '../services/teams.service';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTabNavigation } from '../context/TabNavigationContext';
import { parseFrenchDate } from '../utils/parseFrenchDate';
import { canProposeFriendlyMatch } from '../utils/roleCapabilities';
import type { Club } from '../models/Club';
import type { Team } from '../models/Team';
import {
  FRIENDLY_MATCH_KIND_LABELS,
  FRIENDLY_VENUE_LABELS,
  type FriendlyMatchKind,
  type FriendlyVenueSide,
} from '../models/FriendlyMatch';
import { distanceBetween } from '../utils/geoLocation';

const LEVELS = ['Loisir', 'Compétition', 'Mixte'] as const;
const LEVEL_MAP: Record<(typeof LEVELS)[number], 'loisir' | 'competition' | 'mixte'> = {
  Loisir: 'loisir',
  Compétition: 'competition',
  Mixte: 'mixte',
};
const KINDS = Object.keys(FRIENDLY_MATCH_KIND_LABELS) as FriendlyMatchKind[];
const VENUES = Object.keys(FRIENDLY_VENUE_LABELS) as FriendlyVenueSide[];
import { FOOTBALL_ROSTER_CATEGORIES } from '../constants/footballCategories';

interface ProposeMatchScreenProps {
  onBack: () => void;
  onCreated?: () => void;
}

export const ProposeMatchScreen: React.FC<ProposeMatchScreenProps> = ({
  onBack,
  onCreated,
}) => {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Loisir');
  const [kind, setKind] = useState<FriendlyMatchKind>('amical');
  const [venue, setVenue] = useState<FriendlyVenueSide>('home');
  const { profile } = useAuth();
  const { requireAuth } = useRequireAuth();
  const { openAuth } = useTabNavigation();
  const joueurSession = useJoueurSession();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const { colors: c, rootStyle } = useThemedScreen();
  const effectiveColors = useMemo((): AppColors => {
    if (!joueurLive || !joueurSession) return c;
    const id = joueurSession.identity;
    return {
      ...c,
      background: id.shellBg,
      surface: FUT18_PREMIUM.panelBg,
      surfaceMuted: JOUEUR_SURFACES.listRow,
      border: id.border,
      text: id.ink,
      textSecondary: id.inkMuted,
      textMuted: id.inkMuted,
      ink: id.ink,
      brand: id.accent,
      accent: id.accent,
    };
  }, [c, joueurLive, joueurSession]);
  const styles = useMemo(() => createStyles(effectiveColors), [effectiveColors]);

  const [clubName, setClubName] = useState(profile?.display_name ?? '');
  const [category, setCategory] = useState('Seniors');
  const [teamLabel, setTeamLabel] = useState('');
  const [teamId, setTeamId] = useState<string | undefined>();
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('15:00');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [clubQuery, setClubQuery] = useState('');
  const [maxKm, setMaxKm] = useState('30');
  const [clubHits, setClubHits] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);

  const allowed = profile ? canProposeFriendlyMatch(profile.role) : false;
  const myClubId = profile?.profile.club_id ?? profile?.uid;

  useEffect(() => {
    if (!myClubId) return;
    void teamsService.listByClubId(myClubId).then(setMyTeams).catch(() => setMyTeams([]));
    void clubsService.getById(myClubId).then((club) => {
      if (club) {
        setClubName(club.name);
        if (club.city) setCity(club.city);
      }
    });
  }, [myClubId]);

  const searchClubs = async () => {
    setSearching(true);
    try {
      const term = clubQuery.trim();
      let rows = term
        ? await clubsService.searchByName(term)
        : await clubsService.list(80);
      rows = rows.filter((cl) => cl.id !== myClubId);
      if (category) {
        rows = rows.filter(
          (cl) =>
            !cl.categories?.length ||
            cl.categories.some((cat) =>
              cat.toLowerCase().includes(category.toLowerCase()),
            ),
        );
      }
      const km = parseFloat(maxKm.replace(',', '.'));
      if (Number.isFinite(km) && km > 0 && profile?.location) {
        const origin = profile.location;
        rows = rows
          .map((cl) => ({
            club: cl,
            d: cl.location ? distanceBetween(origin, cl.location) ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY,
          }))
          .filter((x) => x.d <= km)
          .sort((a, b) => a.d - b.d)
          .map((x) => x.club);
      }
      setClubHits(rows.slice(0, 20));
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!requireAuth('Connectez-vous pour proposer un match.') || !profile) return;
    if (!allowed) {
      Alert.alert(
        'Permission',
        'Seuls les clubs et coachs autorisés peuvent proposer un match à un autre club.',
      );
      return;
    }
    if (!clubName.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Indiquez votre club et le lieu.');
      return;
    }
    if (!selectedClub) {
      Alert.alert(
        'Club adverse',
        'Sans club sélectionné, la proposition sera publiée en ouvert sur le tableau amicaux. Continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Publier ouvert',
            onPress: () => void submitProposal(false),
          },
        ],
      );
      return;
    }
    void submitProposal(true);
  };

  const submitProposal = async (direct: boolean) => {
    if (!profile) return;
    const parsed = parseFrenchDate(dateStr);
    if (!parsed) {
      Alert.alert('Date invalide', 'Utilisez le format jj/mm/aaaa.');
      return;
    }

    setSubmitting(true);
    try {
      await friendlyMatchesService.create({
        requester_uid: profile.uid,
        requester_club_id: myClubId ?? profile.uid,
        requester_club_name: clubName.trim(),
        opponent_club_id: selectedClub?.id,
        opponent_club_name: selectedClub?.name,
        requester_team_id: teamId,
        requester_team_label: teamLabel.trim() || undefined,
        city: city.trim(),
        date: parsed,
        time_label: timeStr.trim() || '15:00',
        category: category.trim() || 'Seniors',
        level,
        level_type: LEVEL_MAP[level],
        match_kind: kind,
        venue_side: venue,
        message: message.trim() || undefined,
        mode: direct ? 'direct' : 'open',
        location: selectedClub?.location ?? profile.location,
      });
      Alert.alert(
        direct ? 'Invitation envoyée' : 'Proposition publiée',
        direct
          ? `Le club ${selectedClub!.name} a reçu votre invitation.`
          : 'Votre proposition est visible dans les matchs amicaux.',
      );
      onCreated?.();
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible d’envoyer l’invitation.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formBody = (
    <>
      <ScreenHeader title="+ Proposer un match" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {!profile ? (
          <View style={[styles.guestBanner, { borderColor: effectiveColors.border, backgroundColor: effectiveColors.surfaceMuted }]}>
            <Text style={[styles.guestBannerText, { color: effectiveColors.textSecondary }]}>
              Connectez-vous pour proposer un match à un autre club.
            </Text>
            <PressableSpring onPress={() => openAuth('login')} scaleTo={0.98} haptic>
              <Text style={[styles.guestBannerLink, { color: effectiveColors.brand }]}>Se connecter</Text>
            </PressableSpring>
          </View>
        ) : null}

        <ProDayText variant="caption" muted>
          Invitation club ↔ club. Le destinataire pourra accepter, refuser ou proposer une autre date.
        </ProDayText>

        <Field styles={styles} colors={effectiveColors} label="Votre club" value={clubName} onChangeText={setClubName} />

        <Text style={styles.label}>Équipe concernée</Text>
        {myTeams.length > 0 ? (
          <View style={styles.wrapChips}>
            {myTeams.map((t) => (
              <PressableSpring
                key={t.id}
                style={[styles.chip, teamId === t.id && styles.chipOn]}
                onPress={() => {
                  setTeamId(t.id);
                  setTeamLabel(t.name);
                  if (t.category) setCategory(t.category);
                }}
                scaleTo={0.96}
              >
                <Text style={[styles.chipText, teamId === t.id && styles.chipTextOn]}>{t.name}</Text>
              </PressableSpring>
            ))}
          </View>
        ) : (
          <Field
            styles={styles}
            colors={effectiveColors}
            label="Nom d’équipe"
            placeholder="Ex. Seniors A"
            value={teamLabel}
            onChangeText={setTeamLabel}
          />
        )}

        <Text style={styles.label}>Catégorie / âge</Text>
        <View style={styles.wrapChips}>
          {FOOTBALL_ROSTER_CATEGORIES.map((cat) => (
            <PressableSpring
              key={cat}
              style={[styles.chip, category === cat && styles.chipOn]}
              onPress={() => setCategory(cat)}
              scaleTo={0.96}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextOn]}>{cat}</Text>
            </PressableSpring>
          ))}
        </View>

        <Text style={styles.label}>Trouver un club adverse</Text>
        <Field
          styles={styles}
          colors={effectiveColors}
          label="Nom / ville"
          placeholder="Ex. U15 disponible près de chez vous"
          value={clubQuery}
          onChangeText={setClubQuery}
          icon="search"
        />
        <Field
          styles={styles}
          colors={effectiveColors}
          label="Distance max (km)"
          placeholder="30"
          value={maxKm}
          onChangeText={setMaxKm}
          icon="location"
        />
        <PressableSpring
          style={[styles.searchBtn, { borderColor: effectiveColors.border }]}
          onPress={() => void searchClubs()}
          scaleTo={0.98}
        >
          {searching ? (
            <ActivityIndicator color={effectiveColors.brand} />
          ) : (
            <Text style={[styles.searchBtnText, { color: effectiveColors.brand }]}>
              Rechercher des clubs
            </Text>
          )}
        </PressableSpring>
        {selectedClub ? (
          <View style={[styles.selected, { borderColor: effectiveColors.brand, backgroundColor: effectiveColors.surfaceMuted }]}>
            <ProDayText variant="caption" accent>
              Invité : {selectedClub.name} ({selectedClub.city})
            </ProDayText>
            <PressableSpring onPress={() => setSelectedClub(null)} scaleTo={0.96}>
              <Text style={{ color: effectiveColors.textMuted, fontSize: 12 }}>Retirer</Text>
            </PressableSpring>
          </View>
        ) : null}
        {clubHits.map((cl) => (
          <PressableSpring
            key={cl.id}
            style={[styles.clubRow, { borderColor: effectiveColors.border }]}
            onPress={() => {
              setSelectedClub(cl);
              if (!city.trim() && cl.city) setCity(cl.city);
            }}
            scaleTo={0.98}
          >
            <Text style={[styles.clubName, { color: effectiveColors.ink }]}>{cl.name}</Text>
            <Text style={{ color: effectiveColors.textMuted, fontSize: 12 }}>{cl.city}</Text>
          </PressableSpring>
        ))}

        <Field
          styles={styles}
          colors={effectiveColors}
          label="Date souhaitée"
          placeholder="jj/mm/aaaa"
          value={dateStr}
          onChangeText={setDateStr}
          icon="calendar"
        />
        <Field
          styles={styles}
          colors={effectiveColors}
          label="Créneau horaire"
          placeholder="15:00"
          value={timeStr}
          onChangeText={setTimeStr}
          icon="time"
        />
        <Field
          styles={styles}
          colors={effectiveColors}
          label="Lieu"
          placeholder="Stade, ville…"
          value={city}
          onChangeText={setCity}
          icon="location"
        />

        <Text style={styles.label}>Domicile / extérieur</Text>
        <View style={styles.segment}>
          {VENUES.map((v) => (
            <PressableSpring
              key={v}
              style={[styles.segBtn, venue === v && styles.segBtnActive]}
              onPress={() => setVenue(v)}
              scaleTo={0.96}
            >
              <Text style={[styles.segText, venue === v && styles.segTextActive]}>
                {FRIENDLY_VENUE_LABELS[v]}
              </Text>
            </PressableSpring>
          ))}
        </View>

        <Text style={styles.label}>Type de match</Text>
        <View style={styles.wrapChips}>
          {KINDS.map((k) => (
            <PressableSpring
              key={k}
              style={[styles.chip, kind === k && styles.chipOn]}
              onPress={() => setKind(k)}
              scaleTo={0.96}
            >
              <Text style={[styles.chipText, kind === k && styles.chipTextOn]}>
                {FRIENDLY_MATCH_KIND_LABELS[k]}
              </Text>
            </PressableSpring>
          ))}
        </View>

        <Text style={styles.label}>Niveau souhaité</Text>
        <View style={styles.segment}>
          {LEVELS.map((l, index) => (
            <StaggerReveal key={l} index={index} delayStep={40}>
              <PressableSpring
                style={[styles.segBtn, level === l && styles.segBtnActive]}
                onPress={() => {
                  prodayHaptics.tabSwitch();
                  setLevel(l);
                }}
                scaleTo={0.96}
                haptic
              >
                <Text style={[styles.segText, level === l && styles.segTextActive]}>{l}</Text>
              </PressableSpring>
            </StaggerReveal>
          ))}
        </View>

        <Text style={styles.label}>Commentaires</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Conditions, arbitre, vestiaires…"
          placeholderTextColor={effectiveColors.textMuted}
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
        />
      </ScrollView>

      <PressableSpring
        style={[styles.submit, shadows.fab, submitting && styles.submitDisabled]}
        onPress={() => void handleSubmit()}
        disabled={submitting}
        scaleTo={0.98}
        haptic
      >
        {submitting ? (
          <ActivityIndicator color={effectiveColors.brandInverse} />
        ) : (
          <Text style={styles.submitText}>Envoyer l’invitation</Text>
        )}
      </PressableSpring>
    </>
  );

  if (joueurLive && joueurSession) {
    return (
      <JoueurScreenChrome identity={joueurSession.identity} variant="minimal" hideHero>
        <View style={styles.root}>{formBody}</View>
      </JoueurScreenChrome>
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>{formBody}</View>
  );
};

const Field: React.FC<{
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
}> = ({ styles, colors, label, value, onChangeText, placeholder, icon }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}>
      {icon ? <Icon name={icon} size={16} color={colors.textMuted} /> : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    form: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 120 },
    field: { gap: 6 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.xs,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surface,
    },
    input: { flex: 1, paddingVertical: spacing.md, color: c.ink, fontSize: 15 },
    textArea: {
      minHeight: 96,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      color: c.ink,
      textAlignVertical: 'top',
      backgroundColor: c.surface,
    },
    segment: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    segBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    segBtnActive: { backgroundColor: c.brand, borderColor: c.brand },
    segText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    segTextActive: { color: c.brandInverse },
    wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipOn: { backgroundColor: c.brand, borderColor: c.brand },
    chipText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    chipTextOn: { color: c.brandInverse },
    searchBtn: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    searchBtnText: { fontWeight: '700', fontSize: 14 },
    clubRow: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 2,
    },
    clubName: { fontWeight: '700', fontSize: 14 },
    selected: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    submit: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      bottom: spacing.lg,
      backgroundColor: c.brand,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    submitDisabled: { opacity: 0.6 },
    submitText: { color: c.brandInverse, fontWeight: '800', fontSize: 15 },
    guestBanner: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },
    guestBannerText: { fontSize: 13, lineHeight: 18 },
    guestBannerLink: { fontWeight: '700' },
  });
}

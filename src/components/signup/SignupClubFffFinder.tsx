import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  fffOfficialRegistryService,
  FffOfficialRegistryError,
  type OfficialFffClub,
} from '../../services/fffOfficialRegistry.service';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { AUTH_XP } from '../../features/auth/experience/tokens';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import {
  pickVerificationFromCamera,
  pickVerificationFromGallery,
  pickVerificationPdf,
} from '../../utils/pickVerificationDocument';

type IdentityDoc = { uri: string; name: string; type: string };

type Props = {
  selectedClub: OfficialFffClub | null;
  onSelectClub: (club: OfficialFffClub | null) => void;
  /** Appelé dès qu’un club est choisi / équipes DOFA chargées — pour préremplir le form. */
  onAutofill: (payload: ReturnType<typeof buildClubSignupAutofill>) => void;
  identityDoc: IdentityDoc | null;
  onSetIdentityDoc: (doc: IdentityDoc | null) => void;
  error?: string;
};

/**
 * Parcours club : recherche FFF d’abord, puis fiche auto (zéro re-saisie de ce que DOFA connaît).
 * Pas de poste, licence joueur, ni effectif — UX distincte du flux joueur.
 */
export const SignupClubFffFinder: React.FC<Props> = ({
  selectedClub,
  onSelectClub,
  onAutofill,
  identityDoc,
  onSetIdentityDoc,
  error,
}) => {
  const styles = useMemo(() => createStyles(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OfficialFffClub[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsNote, setTeamsNote] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    let active = true;
    if (selectedClub) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    const timer = setTimeout(async () => {
      try {
        const results = await fffOfficialRegistryService.searchOfficialClubs(q);
        if (!active) return;
        setSearchResults(results.slice(0, 25));
        if (results.length === 0) {
          setSearchError(
            'Aucun club FFF trouvé. Essayez la ville, le code postal (5 chiffres) ou le n° d’affiliation.'
          );
        }
      } catch (err) {
        if (!active) return;
        setSearchResults([]);
        setSearchError(
          err instanceof FffOfficialRegistryError
            ? err.message
            : 'Erreur lors de la recherche FFF. Réessayez.'
        );
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedClub]);

  useEffect(() => {
    let active = true;
    if (!selectedClub) {
      setTeams([]);
      setTeamsNote(null);
      return;
    }
    const base = buildClubSignupAutofill(selectedClub, []);
    onAutofill(base);
    setLoadingTeams(true);
    setTeamsNote(null);
    void fffOfficialRegistryService
      .getCategoriesForClub(selectedClub)
      .then((cats) => {
        if (!active) return;
        setTeams(cats);
        onAutofill(buildClubSignupAutofill(selectedClub, cats));
        if (cats.length === 0) {
          setTeamsNote(
            'Aucune équipe engagée publiée par la FFF pour ce club pour le moment.'
          );
        }
      })
      .catch(() => {
        if (!active) return;
        setTeams([]);
        setTeamsNote('Impossible de charger les équipes FFF — le club reste valide.');
      })
      .finally(() => {
        if (active) setLoadingTeams(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onAutofill stable enough via parent
  }, [selectedClub?.id]);

  const clearClub = () => {
    onSelectClub(null);
    setTeams([]);
    setTeamsNote(null);
    setSearchQuery('');
  };

  const selectClub = (club: OfficialFffClub) => {
    onSelectClub(club);
    setSearchQuery('');
  };

  const attachDoc = async (kind: 'camera' | 'gallery' | 'pdf') => {
    setUploadingDoc(true);
    try {
      const file =
        kind === 'camera'
          ? await pickVerificationFromCamera('document')
          : kind === 'gallery'
            ? await pickVerificationFromGallery()
            : await pickVerificationPdf();
      if (!file) return;
      onSetIdentityDoc({
        uri: file.uri,
        name:
          kind === 'pdf'
            ? 'Mandat_Club_FFF.pdf'
            : kind === 'camera'
              ? 'Mandat_Club_Photo.jpg'
              : 'Justificatif_Club.jpg',
        type: 'club_mandate',
      });
    } finally {
      setUploadingDoc(false);
    }
  };

  const autofill = selectedClub
    ? buildClubSignupAutofill(selectedClub, teams)
    : null;
  const summaryLines = autofill ? formatClubAutofillSummary(autofill) : [];

  if (!selectedClub) {
    return (
      <View style={styles.wrap}>
        <View style={styles.heroSearch}>
          <Icon name="business" size={28} color={AUTH_XP.goldBright} />
          <ProDayText style={styles.heroTitle}>Trouvez votre club FFF</ProDayText>
          <ProDayText style={styles.heroSub}>
            Ville, code postal ou n° d’affiliation. Dès la sélection, ProDay remplit la fiche
            automatiquement — aucune donnée inventée.
          </ProDayText>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color={AUTH_XP.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ex. Melun, 77000, 542557…"
              placeholderTextColor={AUTH_XP.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={AUTH_XP.goldBright} />
            ) : null}
          </View>
        </View>

        {searchError ? <ProDayText style={styles.errorText}>{searchError}</ProDayText> : null}
        {error ? <ProDayText style={styles.errorText}>{error}</ProDayText> : null}

        {searchResults.length > 0 ? (
          <View style={styles.results}>
            {searchResults.map((club) => (
              <PressableSpring
                key={club.id}
                onPress={() => selectClub(club)}
                style={styles.resultRow}
              >
                <View style={styles.resultBadge}>
                  <Icon name="shield" size={16} color="#000" />
                </View>
                <View style={styles.resultCol}>
                  <ProDayText style={styles.resultName}>{club.name}</ProDayText>
                  <ProDayText style={styles.resultMeta}>
                    {[
                      club.fffNumber ? `N° ${club.fffNumber}` : null,
                      club.city,
                      club.postalCode,
                      club.league,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </ProDayText>
                </View>
                <Icon name="chevron-forward" size={18} color={AUTH_XP.textMuted} />
              </PressableSpring>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.fiche}>
        <View style={styles.ficheHeader}>
          <View style={styles.ficheBadge}>
            <Icon name="checkmark-circle" size={22} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <ProDayText style={styles.ficheEyebrow}>Club FFF reconnu</ProDayText>
            <ProDayText style={styles.ficheTitle}>{selectedClub.name}</ProDayText>
          </View>
          <PressableSpring onPress={clearClub} style={styles.changeBtn}>
            <ProDayText style={styles.changeBtnText}>Changer</ProDayText>
          </PressableSpring>
        </View>

        <View style={styles.autoBanner}>
          <Icon name="flash" size={14} color={AUTH_XP.goldBright} />
          <ProDayText style={styles.autoBannerText}>
            Fiche préremplie automatiquement depuis la FFF / DOFA
          </ProDayText>
        </View>

        {summaryLines.map((line) => (
          <ProDayText key={line} style={styles.ficheLine}>
            {line}
          </ProDayText>
        ))}

        {loadingTeams ? (
          <ActivityIndicator
            size="small"
            color={AUTH_XP.goldBright}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}

        {teams.length > 0 ? (
          <View style={styles.teamsBlock}>
            <ProDayText style={styles.teamsLabel}>Équipes engagées (FFF)</ProDayText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.teamsRow}
            >
              {teams.slice(0, 24).map((team) => (
                <View key={team} style={styles.teamChip}>
                  <ProDayText style={styles.teamChipText}>{team}</ProDayText>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
        {teamsNote ? <ProDayText style={styles.note}>{teamsNote}</ProDayText> : null}
      </View>

      <View style={styles.docSection}>
        <ProDayText style={styles.docTitle}>Mandat club (optionnel)</ProDayText>
        <ProDayText style={styles.docHint}>
          Attestation d’affiliation, PV d’AG ou extrait justifiant que vous représentez ce club.
          Vous pourrez aussi le fournir plus tard.
        </ProDayText>
        {identityDoc ? (
          <View style={styles.docAttached}>
            <Icon name="checkmark-circle" size={18} color="#10B981" />
            <ProDayText style={styles.docName}>{identityDoc.name}</ProDayText>
            <PressableSpring onPress={() => onSetIdentityDoc(null)}>
              <Icon name="trash" size={16} color={AUTH_XP.error} />
            </PressableSpring>
          </View>
        ) : (
          <View style={styles.docRow}>
            <PressableSpring
              disabled={uploadingDoc}
              onPress={() => void attachDoc('camera')}
              style={styles.docBtn}
            >
              <Icon name="camera" size={16} color={AUTH_XP.goldBright} />
              <ProDayText style={styles.docBtnText}>Caméra</ProDayText>
            </PressableSpring>
            <PressableSpring
              disabled={uploadingDoc}
              onPress={() => void attachDoc('gallery')}
              style={styles.docBtn}
            >
              <Icon name="image" size={16} color={AUTH_XP.goldBright} />
              <ProDayText style={styles.docBtnText}>Galerie</ProDayText>
            </PressableSpring>
            <PressableSpring
              disabled={uploadingDoc}
              onPress={() => void attachDoc('pdf')}
              style={styles.docBtn}
            >
              <Icon name="document-text" size={16} color={AUTH_XP.goldBright} />
              <ProDayText style={styles.docBtnText}>PDF</ProDayText>
            </PressableSpring>
          </View>
        )}
      </View>

      {error ? <ProDayText style={styles.errorText}>{error}</ProDayText> : null}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: { width: '100%', gap: spacing.md },
    heroSearch: {
      backgroundColor: AUTH_XP.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      padding: spacing.lg,
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    heroTitle: {
      fontSize: 20,
      fontFamily: fontFamily.extrabold,
      color: AUTH_XP.text,
      letterSpacing: -0.3,
    },
    heroSub: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: fontFamily.regular,
      color: AUTH_XP.textMuted,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      width: '100%',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: AUTH_XP.borderHighlight,
      backgroundColor: '#0A0A0A',
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.text,
      paddingVertical: spacing.xs,
    },
    results: { gap: spacing.xs },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      backgroundColor: AUTH_XP.surface,
    },
    resultBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: AUTH_XP.goldBright,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultCol: { flex: 1, gap: 2 },
    resultName: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.text,
    },
    resultMeta: {
      fontSize: 12,
      fontFamily: fontFamily.regular,
      color: AUTH_XP.textMuted,
    },
    fiche: {
      backgroundColor: AUTH_XP.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: AUTH_XP.goldBright,
      padding: spacing.lg,
      gap: 4,
    },
    ficheHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    ficheBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: AUTH_XP.goldBright,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ficheEyebrow: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.goldBright,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    ficheTitle: {
      fontSize: 17,
      fontFamily: fontFamily.extrabold,
      color: AUTH_XP.text,
    },
    changeBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
    },
    changeBtnText: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.textMuted,
    },
    autoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: 'rgba(197, 160, 89, 0.12)',
    },
    autoBannerText: {
      flex: 1,
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.goldBright,
    },
    ficheLine: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.text,
    },
    teamsBlock: { marginTop: spacing.md, gap: spacing.xs },
    teamsLabel: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    teamsRow: { gap: spacing.xs, paddingVertical: 2 },
    teamChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      backgroundColor: '#0A0A0A',
    },
    teamChipText: {
      fontSize: 11,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.textMuted,
    },
    note: {
      marginTop: spacing.xs,
      fontSize: 12,
      fontFamily: fontFamily.regular,
      color: AUTH_XP.textMuted,
    },
    docSection: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      backgroundColor: AUTH_XP.surface,
    },
    docTitle: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.text,
    },
    docHint: {
      fontSize: 12,
      lineHeight: 17,
      fontFamily: fontFamily.regular,
      color: AUTH_XP.textMuted,
    },
    docRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
    docBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
    },
    docBtnText: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.text,
    },
    docAttached: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    docName: {
      flex: 1,
      fontSize: 13,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.text,
    },
    errorText: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.error,
    },
  });
}

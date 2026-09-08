import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {
  fffOfficialRegistryService,
  type OfficialFffClub,
} from '../../services/fffOfficialRegistry.service';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { SignupVisualChrome } from '../../screens/signup/signupVisualSystem';
import {
  buildClubSignupAutofill,
  type ClubSignupAutofill,
} from '../../utils/clubSignupAutofill';
import {
  pickVerificationFromCamera,
  pickVerificationFromGallery,
  pickVerificationPdf,
} from '../../utils/pickVerificationDocument';
import { PublicClubAutocomplete } from './PublicClubAutocomplete';

type IdentityDoc = { uri: string; name: string; type: string };

type Props = {
  selectedClub: OfficialFffClub | null;
  onSelectClub: (club: OfficialFffClub | null) => void;
  onAutofill: (payload: ClubSignupAutofill) => void;
  identityDoc: IdentityDoc | null;
  onSetIdentityDoc: (doc: IdentityDoc | null) => void;
  error?: string;
};

const TEAMS_TIMEOUT_MS = 8_000;

/**
 * Parcours club : recherche annuaire public + DOFA, puis justificatif claim.
 * La fiche club sélectionnée est uniquement dans PublicClubAutocomplete (pas de doublon).
 */
export const SignupClubFffFinder: React.FC<Props> = ({
  selectedClub,
  onSelectClub,
  onAutofill,
  identityDoc,
  onSetIdentityDoc,
  error,
}) => {
  const { visual } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(visual), [visual]);
  const onAutofillRef = useRef(onAutofill);
  onAutofillRef.current = onAutofill;

  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsNote, setTeamsNote] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    let active = true;
    if (!selectedClub) {
      setTeamsNote(null);
      setLoadingTeams(false);
      return;
    }

    // Préremplir tout de suite (sans attendre DOFA /equipes) pour débloquer « Continuer ».
    onAutofillRef.current(buildClubSignupAutofill(selectedClub, []));
    setLoadingTeams(true);
    setTeamsNote(null);

    void (async () => {
      try {
        const list = await Promise.race([
          fffOfficialRegistryService.getCategoriesForClub(selectedClub),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('teams_timeout')), TEAMS_TIMEOUT_MS);
          }),
        ]);
        if (!active) return;
        onAutofillRef.current(buildClubSignupAutofill(selectedClub, list));
        setTeamsNote(
          list.length === 0
            ? 'Équipes DOFA non listées — la fiche club reste préremplie.'
            : `${list.length} équipe${list.length > 1 ? 's' : ''} engagée${list.length > 1 ? 's' : ''} FFF.`,
        );
      } catch {
        if (!active) return;
        setTeamsNote('Équipes FFF indisponibles pour le moment — vous pouvez continuer.');
      } finally {
        if (active) setLoadingTeams(false);
      }
    })();

    return () => {
      active = false;
    };
    // Intentionnel : pas de onAutofill en deps (callback parent non mémoïsé → boucle spinner).
  }, [selectedClub]);

  const pickDoc = async (fn: () => Promise<IdentityDoc | null>) => {
    setUploadingDoc(true);
    try {
      const doc = await fn();
      if (doc) onSetIdentityDoc(doc);
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <View style={styles.root}>
      <ProDayText variant="eyebrow" style={styles.kicker}>
        Club FFF
      </ProDayText>
      <ProDayText variant="title" style={styles.title}>
        Retrouvez votre structure
      </ProDayText>
      <ProDayText variant="body" style={styles.sub}>
        Annuaire public des clubs français — sélectionnez pour préremplir et revendiquer
        l’espace ProDay.
      </ProDayText>

      <PublicClubAutocomplete
        selectedClub={selectedClub}
        onSelectClub={onSelectClub}
        accent={visual.accent}
        error={error}
      />

      {selectedClub ? (
        <View style={styles.sheet}>
          {loadingTeams ? (
            <View style={styles.teamsStatus}>
              <ActivityIndicator size="small" color={visual.accent} />
              <ProDayText variant="caption" style={styles.note}>
                Chargement des équipes FFF…
              </ProDayText>
            </View>
          ) : teamsNote ? (
            <ProDayText variant="caption" style={styles.note}>
              {teamsNote}
            </ProDayText>
          ) : null}

          <ProDayText variant="section" style={styles.mandateTitle}>
            Mandat / justificatif (optionnel)
          </ProDayText>
          <ProDayText variant="caption" style={styles.note}>
            Accélère la vérification du claim (admin provisoire → vérifié).
          </ProDayText>
          <View style={styles.docRow}>
            <PressableSpring
              disabled={uploadingDoc}
              onPress={() => void pickDoc(pickVerificationFromCamera)}
              style={styles.docBtn}
              scaleTo={0.97}
              haptic
            >
              <Icon name="camera" size={16} color={visual.text} />
              <ProDayText variant="caption" style={styles.docBtnText}>
                Photo
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              disabled={uploadingDoc}
              onPress={() => void pickDoc(pickVerificationFromGallery)}
              style={styles.docBtn}
              scaleTo={0.97}
              haptic
            >
              <Icon name="image" size={16} color={visual.text} />
              <ProDayText variant="caption" style={styles.docBtnText}>
                Galerie
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              disabled={uploadingDoc}
              onPress={() => void pickDoc(pickVerificationPdf)}
              style={styles.docBtn}
              scaleTo={0.97}
              haptic
            >
              <Icon name="document" size={16} color={visual.text} />
              <ProDayText variant="caption" style={styles.docBtnText}>
                PDF
              </ProDayText>
            </PressableSpring>
          </View>
          {identityDoc ? (
            <ProDayText variant="caption" style={styles.docName}>
              {identityDoc.name}
            </ProDayText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

function createStyles(v: SignupVisualChrome) {
  return StyleSheet.create({
    root: { gap: spacing.md },
    kicker: {
      color: v.focus,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontWeight: '700',
      fontSize: 11,
    },
    title: {
      color: v.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    sub: {
      color: v.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
    },
    sheet: {
      gap: 8,
      padding: 14,
      borderRadius: radius.lg,
      backgroundColor: v.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: v.border,
    },
    teamsStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 20,
    },
    note: { color: v.textFaint, flexShrink: 1 },
    mandateTitle: {
      color: v.text,
      marginTop: 4,
      fontSize: 14,
      fontWeight: '700',
    },
    docRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    docBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: v.surface,
      borderWidth: 1,
      borderColor: v.border,
    },
    docBtnText: { color: v.text, fontWeight: '600' },
    docName: { color: v.accent, marginTop: 4 },
  });
}

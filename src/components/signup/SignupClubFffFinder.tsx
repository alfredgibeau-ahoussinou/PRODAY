import React, { useEffect, useMemo, useState } from 'react';
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
  formatClubAutofillSummary,
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

/**
 * Parcours club : recherche annuaire public + DOFA, puis fiche auto.
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
  const [teams, setTeams] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsNote, setTeamsNote] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    let active = true;
    if (!selectedClub) {
      setTeams([]);
      setTeamsNote(null);
      return;
    }
    setLoadingTeams(true);
    setTeamsNote(null);
    void (async () => {
      try {
        const list = await fffOfficialRegistryService.getCategoriesForClub(selectedClub);
        if (!active) return;
        setTeams(list);
        onAutofill(buildClubSignupAutofill(selectedClub, list));
        if (list.length === 0) {
          setTeamsNote('Équipes DOFA non listées — la fiche club reste préremplie.');
        }
      } catch {
        if (!active) return;
        setTeams([]);
        onAutofill(buildClubSignupAutofill(selectedClub, []));
        setTeamsNote('Équipes indisponibles pour le moment.');
      } finally {
        if (active) setLoadingTeams(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedClub, onAutofill]);

  const summary = selectedClub
    ? formatClubAutofillSummary(buildClubSignupAutofill(selectedClub, teams))
    : [];

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
            <ActivityIndicator color={visual.accent} />
          ) : (
            <>
              {summary.map((line) => (
                <ProDayText key={line} variant="caption" style={styles.summaryLine}>
                  {line}
                </ProDayText>
              ))}
              {teamsNote ? (
                <ProDayText variant="caption" style={styles.note}>
                  {teamsNote}
                </ProDayText>
              ) : null}
            </>
          )}

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
    summaryLine: { color: v.textMuted, lineHeight: 18 },
    note: { color: v.textFaint },
    mandateTitle: {
      color: v.text,
      marginTop: 8,
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

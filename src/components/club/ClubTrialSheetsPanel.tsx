import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { clubTrialSheetsService } from '../../services/clubTrialSheets.service';
import {
  TRIAL_SHEET_RATING_LABELS,
  TRIAL_SHEET_DECISION_LABELS,
  type ClubTrialSheet,
  type TrialSheetDecision,
  type TrialSheetRatingKey,
  trialSheetRequiresParentalConsent,
} from '../../models/ClubTrialSheet';
import type { User } from '../../models/User';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';

const RATING_KEYS = Object.keys(TRIAL_SHEET_RATING_LABELS) as TrialSheetRatingKey[];

export const ClubTrialSheetsPanel: React.FC<{ clubId: string; profile: User }> = ({
  clubId,
  profile,
}) => {
  const { colors } = useAppTheme();
  const [sheets, setSheets] = useState<ClubTrialSheet[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthYear, setBirthYear] = useState('2012');
  const [position, setPosition] = useState('Milieu');
  const [team, setTeam] = useState('');
  const [isMinor, setIsMinor] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await clubTrialSheetsService.listForClub(clubId, profile.uid);
    setSheets(rows.filter((s) => !s.deleted_at));
  }, [clubId, profile.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Champs requis', 'Prénom et nom obligatoires.');
      return;
    }
    try {
      const sheet = await clubTrialSheetsService.create({
        club_id: clubId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_year: parseInt(birthYear, 10) || new Date().getFullYear() - 12,
        position: position.trim() || '—',
        target_team_label: team.trim() || undefined,
        trial_date: new Date(),
        coach_uid: profile.uid,
        coach_name: profile.display_name,
        is_minor: isMinor,
        authorized_uids: [profile.uid],
      });
      if (isMinor) {
        Alert.alert(
          'Mineur',
          'Consentement parental requis pour conserver le dossier. Visibilité limitée au staff autorisé.',
        );
      }
      setFirstName('');
      setLastName('');
      setSheets((prev) => [sheet, ...prev]);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible');
    }
  };

  const saveRatings = async (sheet: ClubTrialSheet, ratings: ClubTrialSheet['ratings']) => {
    const values = Object.values(ratings).filter((n): n is number => typeof n === 'number');
    const overall =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : null;
    try {
      await clubTrialSheetsService.updateRatings(sheet.id, { ratings, overall });
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible');
    }
  };

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Fiches d’essai</ProDayText>
      <ProDayText variant="caption" muted>
        Confidentialité stricte. Mineurs : consentement + accès réservé.
      </ProDayText>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <TextInput
          placeholder="Prénom"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
        />
        <TextInput
          placeholder="Nom"
          value={lastName}
          onChangeText={setLastName}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
        />
        <TextInput
          placeholder="Année de naissance"
          value={birthYear}
          onChangeText={setBirthYear}
          keyboardType="number-pad"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
        />
        <TextInput
          placeholder="Poste"
          value={position}
          onChangeText={setPosition}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
        />
        <TextInput
          placeholder="Équipe envisagée"
          value={team}
          onChangeText={setTeam}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
        />
        <View style={styles.switchRow}>
          <ProDayText variant="caption">Mineur</ProDayText>
          <Switch value={isMinor} onValueChange={setIsMinor} />
        </View>
        <PressableSpring onPress={() => void create()} scaleTo={0.96} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            Créer la fiche
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>

      {sheets.length === 0 ? (
        <ProDayText variant="caption" muted>
          Aucune fiche — créez un dossier d’essai.
        </ProDayText>
      ) : (
        sheets.map((sheet) => {
          const open = expandedId === sheet.id;
          return (
            <ProDaySurface
              key={sheet.id}
              variant="module"
              style={[styles.card, { borderColor: colors.border }]}
            >
              <PressableSpring
                onPress={() => setExpandedId(open ? null : sheet.id)}
                scaleTo={0.98}
                haptic
              >
                <ProDayText variant="caption" style={{ fontWeight: '800' }}>
                  {sheet.first_name} {sheet.last_name} · {sheet.position}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {sheet.target_team_label ?? 'Équipe —'} ·{' '}
                  {trialSheetRequiresParentalConsent(sheet)
                    ? 'Consentement parental manquant'
                    : sheet.is_minor
                      ? 'Consentement OK'
                      : 'Majeur'}
                </ProDayText>
              </PressableSpring>
              {open ? (
                <View style={styles.form}>
                  {RATING_KEYS.map((key) => (
                    <View key={key} style={styles.rateRow}>
                      <ProDayText variant="caption" style={{ flex: 1 }}>
                        {TRIAL_SHEET_RATING_LABELS[key]}
                      </ProDayText>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <PressableSpring
                          key={n}
                          onPress={() => {
                            const ratings = { ...sheet.ratings, [key]: n };
                            void saveRatings(sheet, ratings);
                          }}
                          scaleTo={0.9}
                        >
                          <ProDayText
                            variant="caption"
                            accent={sheet.ratings[key] === n}
                            muted={sheet.ratings[key] !== n}
                          >
                            {n}
                          </ProDayText>
                        </PressableSpring>
                      ))}
                    </View>
                  ))}
                  {sheet.overall != null ? (
                    <ProDayText variant="caption" accent>
                      Note globale : {sheet.overall}/5
                    </ProDayText>
                  ) : null}
                  <TextInput
                    placeholder="Notes du coach"
                    value={sheet.notes ?? ''}
                    onChangeText={(text) => {
                      void clubTrialSheetsService
                        .updateRatings(sheet.id, { notes: text })
                        .then(load);
                    }}
                    multiline
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
                  />
                  <ProDayText variant="caption" muted>
                    Décision
                  </ProDayText>
                  <View style={styles.switchRow}>
                    {(
                      ['retained', 'not_retained', 'to_review'] as TrialSheetDecision[]
                    ).map((d) => (
                      <PressableSpring
                        key={d}
                        onPress={() => {
                          void clubTrialSheetsService
                            .updateRatings(sheet.id, { decision: d })
                            .then(load);
                        }}
                        scaleTo={0.96}
                      >
                        <ProDayText
                          variant="caption"
                          accent={sheet.decision === d}
                          muted={sheet.decision !== d}
                          style={sheet.decision === d ? styles.link : undefined}
                        >
                          {TRIAL_SHEET_DECISION_LABELS[d]}
                        </ProDayText>
                      </PressableSpring>
                    ))}
                  </View>
                  {sheet.is_minor && trialSheetRequiresParentalConsent(sheet) ? (
                    <PressableSpring
                      onPress={() =>
                        void clubTrialSheetsService.recordParentalConsent(sheet.id).then(load)
                      }
                      scaleTo={0.96}
                      haptic
                    >
                      <ProDayText variant="caption" accent style={styles.link}>
                        Enregistrer consentement parental
                      </ProDayText>
                    </PressableSpring>
                  ) : null}
                  <PressableSpring
                    onPress={() => {
                      Alert.alert('Supprimer', 'Suppression logique du dossier ?', [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Supprimer',
                          style: 'destructive',
                          onPress: () =>
                            void clubTrialSheetsService.softDelete(sheet.id).then(load),
                        },
                      ]);
                    }}
                    scaleTo={0.96}
                  >
                    <ProDayText variant="caption" muted>
                      Supprimer le dossier
                    </ProDayText>
                  </PressableSpring>
                </View>
              ) : null}
            </ProDaySurface>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontWeight: '800' },
  form: { gap: spacing.xs, marginTop: spacing.sm },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

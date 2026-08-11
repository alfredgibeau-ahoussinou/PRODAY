import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { profileService } from '../../services/profile.service';
import { writeJoueurGate, type JoueurGateProfile } from '../../utils/joueurGateStorage';
import type { Gender } from '../../models/User';
import {
  resolveJoueurPageIdentity,
  JOUEUR_AGE_GENDER_ACCENTS,
  JOUEUR_SITE,
} from '../../content/joueurPageIdentity';
import { resolveJoueurGenderVisual } from '../../utils/joueurExperienceTheme';
import {
  isValidPlayerBirthDate,
  JOUEUR_UNIVERSE_LABELS,
} from '../../utils/joueurBirthAge';
import { BirthDateFields, birthPartsToIso } from '../../components/player/BirthDateFields';
import { JoueurWorldScene } from '../../features/joueur/JoueurWorldScene';
import { JoueurActionRow, JoueurIdentityProvider } from '../../components/player/joueurPortalUi';
import { spacing } from '../../theme/designTokens';
import { playJoueurSfxFireAndForget, joueurGameConfirm } from '../../features/joueur/joueurSfx';

type GenderChoice = Extract<Gender, 'men' | 'women'>;

type Props = {
  uid: string;
  onComplete: (gate: JoueurGateProfile) => void;
};

/**
 * Qui es-tu ? — genre → date de naissance → enter (parity site).
 */
export function JoueurWhoAreYouGateScreen({ uid, onComplete }: Props) {
  const [phase, setPhase] = useState<'gender' | 'birth'>('gender');
  const [gender, setGender] = useState<GenderChoice | null>(null);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [birthError, setBirthError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewIdentity = useMemo(() => {
    const iso = birthPartsToIso(day, month, year);
    const valid = iso ? isValidPlayerBirthDate(iso) : null;
    const ageGroup =
      valid && valid.ok ? valid.ageGroup : gender ? 'teen' : 'adult';
    return resolveJoueurPageIdentity({
      ageGroup,
      gender: resolveJoueurGenderVisual(gender),
    });
  }, [day, month, year, gender]);

  const sceneKind =
    previewIdentity.ageGroup === 'youth'
      ? 'pitch_playful'
      : previewIdentity.ageGroup === 'teen'
        ? 'pitch_dynamic'
        : 'pitch_data';

  const enter = async () => {
    if (!gender || saving) return;
    const iso = birthPartsToIso(day, month, year);
    const valid = isValidPlayerBirthDate(iso);
    if (!valid.ok) {
      setBirthError(valid.reason);
      return;
    }
    setBirthError(null);
    setSaving(true);
    try {
      const gate = await writeJoueurGate(uid, {
        gender,
        ageGroup: valid.ageGroup,
        age: valid.age,
        birthDate: iso!,
      });
      try {
        await profileService.updateProfile(uid, {
          profile: {
            gender,
            age: valid.age,
            birth_date: iso!,
          },
        });
      } catch {
        // gate locale suffit
      }
      onComplete(gate);
      playJoueurSfxFireAndForget('levelup');
      joueurGameConfirm();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’enregistrer.');
    } finally {
      setSaving(false);
    }
  };

  const universePreview =
    phase === 'birth' && birthPartsToIso(day, month, year)
      ? (() => {
          const v = isValidPlayerBirthDate(birthPartsToIso(day, month, year));
          return v.ok ? JOUEUR_UNIVERSE_LABELS[v.ageGroup] : null;
        })()
      : null;

  return (
    <JoueurIdentityProvider identity={previewIdentity}>
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        colors={previewIdentity.wash}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.sceneFrame}>
        <JoueurWorldScene
          identity={previewIdentity}
          kind={sceneKind}
          height={180}
          showBanner
          bannerLabel={
            phase === 'gender'
              ? 'CHOIX JOUEUR'
              : JOUEUR_UNIVERSE_LABELS[previewIdentity.ageGroup].short
          }
        />
      </View>

      <View style={styles.body}>
        <ProDayText
          variant="caption"
          style={[styles.kicker, { color: previewIdentity.accent }]}
        >
          QUI ES-TU ?
        </ProDayText>
        <ProDayText variant="title" style={styles.title}>
          {phase === 'gender' ? 'Choisis ton profil' : 'Ta date de naissance'}
        </ProDayText>
        <ProDayText variant="caption" style={styles.support}>
          {phase === 'gender'
            ? 'Joueuse ou joueur — ton accent change aussi selon l’âge (Jeunes / Classé / Pro).'
            : 'L’âge calendaire ouvre ton univers. Moins de 13 = Jeunes, 13–17 = Classé, 18+ = Pro.'}
        </ProDayText>

        {phase === 'gender' ? (
          <View style={styles.choices}>
            {(
              [
                {
                  id: 'women' as const,
                  label: 'Joueuse',
                  sub: 'Jeunes teal · Classé violet · Pro teal',
                  accent: '#5EEAD4',
                },
                {
                  id: 'men' as const,
                  label: 'Joueur',
                  sub: 'Jeunes or · Classé cyan · Pro bleu',
                  accent: '#4C8BFF',
                },
              ] as const
            ).map((opt) => {
              const active = gender === opt.id;
              return (
                <PressableSpring
                  key={opt.id}
                  onPress={() => {
                    setGender(opt.id);
                    setPhase('birth');
                  }}
                  scaleTo={0.97}
                  haptic
                  style={[
                    styles.choice,
                    {
                      borderColor: active ? opt.accent : JOUEUR_SITE.border,
                      borderLeftColor: opt.accent,
                    },
                  ]}
                >
                  <ProDayText variant="section" style={{ color: JOUEUR_SITE.foreground }}>
                    {opt.label}
                  </ProDayText>
                  <ProDayText variant="caption" style={{ color: JOUEUR_SITE.muted }}>
                    {opt.sub}
                  </ProDayText>
                </PressableSpring>
              );
            })}

            <View style={styles.ageHints}>
              {(
                [
                  { label: '<13', hint: 'Défis · étoiles · mini-terrain', g: 'youth' as const },
                  { label: '13–17', hint: 'Niveau · XP · missions', g: 'teen' as const },
                  { label: '18+', hint: 'Data · forme · performance', g: 'adult' as const },
                ] as const
              ).map((h) => {
                const genderVisual = resolveJoueurGenderVisual(gender);
                const ageAccent = JOUEUR_AGE_GENDER_ACCENTS[h.g][genderVisual].accent;
                return (
                <View key={h.g} style={styles.ageHint}>
                  <ProDayText variant="caption" style={{ color: ageAccent, fontWeight: '900' }}>
                    {h.label}
                  </ProDayText>
                  <ProDayText variant="caption" style={{ color: JOUEUR_SITE.muted, fontSize: 10 }}>
                    {h.hint}
                  </ProDayText>
                </View>
              );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.birthBlock}>
            <BirthDateFields
              day={day}
              month={month}
              year={year}
              onDay={setDay}
              onMonth={setMonth}
              onYear={setYear}
              accent={previewIdentity.accent}
              error={birthError}
            />
            {universePreview ? (
              <View
                style={[styles.previewChip, { borderColor: previewIdentity.accent }]}
              >
                <ProDayText
                  variant="caption"
                  style={{ color: previewIdentity.accent, fontWeight: '800' }}
                >
                  {universePreview.title}
                </ProDayText>
                <ProDayText variant="caption" style={{ color: JOUEUR_SITE.muted }}>
                  {universePreview.range} — bascule automatique à l’anniversaire
                </ProDayText>
              </View>
            ) : null}
            <JoueurActionRow
              primary={saving ? 'Chargement…' : 'Entrer dans mon univers'}
              onPrimary={() => void enter()}
              secondary="Genre"
              onSecondary={() => setPhase('gender')}
            />
          </View>
        )}
      </View>
    </ScrollView>
    </JoueurIdentityProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: JOUEUR_SITE.bg },
  pad: { paddingBottom: spacing.xl },
  sceneFrame: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 0,
    overflow: 'hidden',
    borderRadius: 28,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: -0.4,
  },
  support: { color: JOUEUR_SITE.muted, lineHeight: 18, marginBottom: spacing.sm },
  choices: { gap: spacing.sm },
  choice: {
    borderWidth: 1.5,
    borderLeftWidth: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(10,16,28,0.9)',
    padding: spacing.md,
    gap: 4,
    overflow: 'hidden',
  },
  ageHints: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ageHint: {
    flex: 1,
    borderWidth: 1,
    borderColor: JOUEUR_SITE.border,
    backgroundColor: 'rgba(8,14,24,0.88)',
    padding: spacing.sm,
    gap: 2,
    borderRadius: 16,
  },
  birthBlock: { gap: spacing.md },
  previewChip: {
    borderWidth: 1.5,
    borderRadius: 18,
    backgroundColor: 'rgba(8,14,24,0.9)',
    padding: spacing.md,
    gap: 4,
  },
});

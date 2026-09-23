import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  playerWellnessService,
  calculateWellnessScore,
  type PlayerDailyWellness,
} from '../../services/playerWellness.service';
import { PlayerPageGuideModal, type GuideSection } from '../../components/player/PlayerPageGuideModal';
import { PlayerPageGuideBanner } from '../../components/player/PlayerPageGuideBanner';
import {
  playerColors,
  playerType,
  playerForm,
  playerCard,
  playerChip,
  PLAYER_SURFACE_TOKENS,
} from '../../theme/playerDesignSystem';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';

/**
 * Santé & Check-In — refonte Player §2.
 *
 * Le check-in (sommeil, courbatures, énergie, stress) est réel : le score et le
 * niveau de vigilance sont calculés à partir des réponses du jour. Les
 * indicateurs qui dépendent du staff (ratio de charge ACWR, charge prévue) et
 * l'agenda n'affichent **aucune valeur inventée** : ils disent honnêtement
 * qu'ils seront connectés aux données réelles (DATA-01).
 */
export const PlayerWellnessScreen: React.FC = () => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';

  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [soreness, setSoreness] = useState(2);
  const [energy, setEnergy] = useState(4);
  const [stress, setStress] = useState(2);
  const [savedToday, setSavedToday] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [wellnessRecord, setWellnessRecord] = useState<PlayerDailyWellness | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    let alive = true;
    void playerWellnessService.getTodayWellness(userId).then((res) => {
      if (!alive || !res) return;
      setSleepHours(res.sleepHours);
      setSleepQuality(res.sleepQuality);
      setSoreness(res.soreness);
      setEnergy(res.energy);
      setStress(res.stress);
      setWellnessRecord(res);
      setSavedToday(true);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const currentScore = calculateWellnessScore({
    sleepHours,
    sleepQuality,
    soreness,
    energy,
    stress,
  });

  const riskTone =
    currentScore.risk === 'low'
      ? { color: CLUB_TOKENS.success, soft: CLUB_TOKENS.successSoft, label: 'Forme optimale' }
      : currentScore.risk === 'moderate'
      ? { color: CLUB_TOKENS.warning, soft: CLUB_TOKENS.warningSoft, label: 'Vigilance fatigue' }
      : { color: CLUB_TOKENS.danger, soft: CLUB_TOKENS.dangerSoft, label: 'Risque de blessure' };

  const handleSaveCheckin = () => {
    prodayHaptics.impactMedium();
    setSaveError(false);
    setSaveBusy(true);
    playerWellnessService
      .saveTodayWellness(userId, { sleepHours, sleepQuality, soreness, energy, stress })
      .then((res) => {
        setWellnessRecord(res);
        setSavedToday(true);
        prodayHaptics.rsvpConfirm();
      })
      .catch(() => {
        setSaveError(true);
        prodayHaptics.error();
      })
      .finally(() => setSaveBusy(false));
  };

  const getSorenessLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Aucune';
      case 2:
        return 'Légère';
      case 3:
        return 'Modérée';
      case 4:
        return 'Forte';
      case 5:
        return 'Sévère';
      default:
        return '';
    }
  };

  const getEnergyLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Épuisé';
      case 2:
        return 'Bas';
      case 3:
        return 'Correct';
      case 4:
        return 'Bon';
      case 5:
        return 'Au sommet';
      default:
        return '';
    }
  };

  const guideSections: GuideSection[] = [
    {
      icon: 'sunny',
      iconColor: CLUB_TOKENS.warning,
      title: 'Check-in matinal quotidien (30 sec)',
      description: 'Chaque matin, ajuste tes 4 curseurs : sommeil, courbatures, énergie et stress. Ce rituel donne au staff une lecture de ta charge interne et de ta fraîcheur.',
      badge: 'QUOTIDIEN',
    },
    {
      icon: 'pulse',
      iconColor: playerColors.accent,
      title: 'Score de forme & vigilance',
      description: 'Ton score sur 100 et le niveau de vigilance sont calculés à partir de tes réponses réelles du jour — jamais d\'une valeur figée.',
      badge: 'TEMPS RÉEL',
    },
    {
      icon: 'shield-checkmark',
      iconColor: playerColors.accentAlt,
      title: 'Prévention des blessures',
      description: 'Un check-in régulier permet au préparateur physique d\'ajuster l\'intensité avant la surcharge. Tes réponses sont transmises au staff.',
      badge: 'PRÉVENTION',
    },
    {
      icon: 'heart',
      iconColor: CLUB_TOKENS.warning,
      title: 'Ratio de charge ACWR',
      description: 'Le ratio charge aiguë / charge chronique provient des données d\'entraînement du staff. Il s\'affichera ici dès que cette connexion sera disponible — aucune valeur n\'est inventée en attendant.',
    },
  ];

  /** Échelle 1–5 — puces du socle : la sélection se lit au contour d'accent. */
  const renderScale = (
    value: number,
    onChange: (next: number) => void,
    label: string,
    testID: string,
  ) => (
    <View style={styles.scaleRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {[1, 2, 3, 4, 5].map((lvl) => {
        const active = value === lvl;
        return (
          <TouchableOpacity
            key={lvl}
            testID={`${testID}-${lvl}`}
            style={[playerChip(PLAYER_SURFACE_TOKENS, active), styles.scaleChip]}
            onPress={() => {
              prodayHaptics.selection();
              onChange(lvl);
            }}
            activeOpacity={0.8}
            accessibilityRole="radio"
            /** `checked` porte l'état d'un radio sur natif ; `selected` couvre le web. */
            accessibilityState={{ checked: active, selected: active }}
            accessibilityLabel={`${label} : ${lvl} sur 5`}
          >
            <Text style={[styles.scaleChipText, active && styles.scaleChipTextActive]}>
              {lvl}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* En-tête */}
      <View style={styles.topHeader}>
        <View style={styles.headerTextCol}>
          <Text style={styles.screenSubtitle}>Prévention & Récupération</Text>
          <Text style={styles.screenTitle} numberOfLines={2}>
            Forme & Check-In
          </Text>
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.guideIconBtn}
            onPress={() => {
              prodayHaptics.selection();
              setShowGuideModal(true);
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Guide de la page"
          >
            <Ionicons name="help-circle-outline" size={16} color={playerColors.accent} />
            <Text style={styles.guideBtnText}>Guide</Text>
          </TouchableOpacity>

          <View style={[styles.riskPill, { backgroundColor: riskTone.soft, borderColor: riskTone.color }]}>
            <Ionicons
              name={currentScore.risk === 'low' ? 'checkmark-circle' : 'warning'}
              size={14}
              color={riskTone.color}
            />
            <Text style={[styles.riskText, { color: riskTone.color }]} numberOfLines={1}>
              {riskTone.label}
            </Text>
          </View>
        </View>
      </View>

      <PlayerPageGuideBanner
        pageKey="wellness"
        title="Guide Forme & Prévention Blessures"
        subtitle="Découvre pourquoi le check-in matinal protège ton corps"
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* Check-in du jour — valeurs réelles saisies par le joueur */}
      <View style={[styles.checkinCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
        <View style={styles.checkinHeader}>
          <View style={styles.checkinHeaderLeft}>
            <Ionicons name="sunny" size={18} color={CLUB_TOKENS.warning} />
            <Text style={styles.checkinTitle}>Check-In matinal du jour</Text>
          </View>
          <Text style={styles.scoreBadge}>{currentScore.score}/100</Text>
        </View>

        {/* Sommeil */}
        <View style={styles.controlRow}>
          <View style={styles.controlTextCol}>
            <Text style={styles.controlLabel}>Sommeil</Text>
            <Text style={styles.controlValue}>{sleepHours} h de repos</Text>
          </View>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                prodayHaptics.selection();
                setSleepHours(Math.max(4, sleepHours - 0.5));
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Réduire le sommeil"
            >
              <Ionicons name="remove" size={16} color={playerColors.text} />
            </TouchableOpacity>
            <Text style={styles.stepDisplay}>{sleepHours}h</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                prodayHaptics.selection();
                setSleepHours(Math.min(12, sleepHours + 0.5));
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Augmenter le sommeil"
            >
              <Ionicons name="add" size={16} color={playerColors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Courbatures */}
        <View style={styles.controlRow}>
          <View style={styles.controlTextCol}>
            <Text style={styles.controlLabel}>Courbatures & raideurs</Text>
            <Text style={styles.controlValue}>{getSorenessLabel(soreness)}</Text>
          </View>
          {renderScale(soreness, setSoreness, 'Courbatures', 'soreness')}
        </View>

        {/* Énergie */}
        <View style={styles.controlRow}>
          <View style={styles.controlTextCol}>
            <Text style={styles.controlLabel}>Niveau d'énergie</Text>
            <Text style={styles.controlValue}>{getEnergyLabel(energy)}</Text>
          </View>
          {renderScale(energy, setEnergy, 'Énergie', 'energy')}
        </View>

        {/* Stress */}
        <View style={[styles.controlRow, styles.controlRowLast]}>
          <View style={styles.controlTextCol}>
            <Text style={styles.controlLabel}>Stress / tension</Text>
            <Text style={styles.controlValue}>
              {stress <= 2 ? 'Calme' : stress === 3 ? 'Moyen' : 'Élevé'}
            </Text>
          </View>
          {renderScale(stress, setStress, 'Stress', 'stress')}
        </View>

        <TouchableOpacity
          style={[styles.validateBtn, saveBusy && styles.validateBtnBusy]}
          onPress={handleSaveCheckin}
          disabled={saveBusy}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityState={{ disabled: saveBusy }}
        >
          <Ionicons
            name={savedToday ? 'checkmark-done-circle' : 'checkmark-circle'}
            size={18}
            color={playerColors.bg}
          />
          <Text style={styles.validateText}>
            {savedToday ? 'Check-In transmis au staff' : 'Valider mon Check-In du jour'}
          </Text>
        </TouchableOpacity>

        {saveError ? (
          <Text style={styles.saveFeedbackError}>
            Check-In non enregistré — vérifie ta connexion puis réessaie.
          </Text>
        ) : savedToday && wellnessRecord ? (
          <Text style={styles.saveFeedbackOk}>
            Enregistré aujourd'hui — visible par le staff.
          </Text>
        ) : null}
      </View>

      {/* Ratio de charge ACWR — donnée staff non connectée : état honnête */}
      <View style={[styles.acwrCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
        <View style={styles.acwrHeader}>
          <View style={styles.acwrIcon}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color={playerColors.accent} />
          </View>
          <View style={styles.acwrTextCol}>
            <Text style={styles.acwrTitle}>Ratio de charge ACWR</Text>
            <Text style={styles.acwrSub}>Charge aiguë / charge chronique</Text>
          </View>
          <Text style={styles.acwrValue}>—</Text>
        </View>
        <Text style={styles.honestNote}>
          Le ratio réel provient des données d'entraînement saisies par le staff. Il s'affichera
          ici dès que cette connexion sera disponible — aucune valeur n'est inventée.
        </Text>
      </View>

      {/* Agenda — aucune source connectée pour l'instant */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Agenda équipe & convocations</Text>
        <Text style={styles.honestNote}>
          Tes séances réelles, tes matchs et les sessions de récupération apparaîtront ici —
          retrouve tes convocations et tes réponses dans l'onglet Calendrier.
        </Text>
      </View>

      <PlayerPageGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        pageTitle="Forme & Récupération"
        pageSubtitle="Indique ton état de forme réel au staff en 30 secondes"
        badgeLabel="GUIDE FORME & RÉCUPÉRATION"
        badgeColor={playerColors.accent}
        introText="Cet écran te permet d'indiquer ton état de fatigue chaque matin en 30 secondes pour que le préparateur physique et le coach adaptent la charge de travail et préviennent les blessures."
        sections={guideSections}
        proTip="Remplis ton check-in avant 11h : le staff s'appuie sur les remontées du groupe pour calibrer l'intensité des séances d'entraînement."
        ctaLabel="Compris, je gère !"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: playerColors.bg,
  },
  content: {
    padding: playerForm.space.lg,
    paddingBottom: playerForm.space.xxl,
  },

  /* En-tête */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    /** 320 pt : le titre garde sa largeur, guide + vigilance passent dessous. */
    flexWrap: 'wrap',
    gap: playerForm.space.sm,
    marginBottom: playerForm.space.lg,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 168,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: playerForm.space.sm,
  },
  guideIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: playerForm.chipHeight - 12,
    backgroundColor: playerColors.accentSoft,
    borderWidth: 1,
    borderColor: playerColors.border,
    paddingHorizontal: 9,
    borderRadius: playerForm.chipRadius,
  },
  guideBtnText: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.accent,
  },
  screenSubtitle: {
    ...playerType.caption,
    color: playerColors.textMuted,
  },
  screenTitle: {
    ...playerType.title,
    color: playerColors.text,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: playerForm.chipRadius,
    borderWidth: 1,
    maxWidth: 168,
  },
  riskText: {
    ...playerType.micro,
    fontWeight: '800',
    flexShrink: 1,
  },

  /* Check-in */
  checkinCard: {
    padding: playerForm.cardPaddingH,
    marginBottom: playerForm.space.lg,
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: playerForm.space.sm,
    marginBottom: playerForm.space.sm,
  },
  checkinHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: playerForm.space.sm,
    flex: 1,
  },
  checkinTitle: {
    ...playerType.headline,
    color: playerColors.text,
    flexShrink: 1,
  },
  scoreBadge: {
    ...playerType.callout,
    fontWeight: '800',
    color: playerColors.accent,
    backgroundColor: playerColors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: playerForm.fieldRadius - 10,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    /** Écrans étroits : l'échelle 1–5 passe sous le libellé plutôt que d'être clipsée. */
    flexWrap: 'wrap',
    gap: playerForm.space.sm,
    minHeight: playerForm.rowMinHeight,
    borderBottomWidth: playerForm.separatorThickness,
    borderBottomColor: playerColors.border,
  },
  controlRowLast: {
    borderBottomWidth: 0,
  },
  controlTextCol: {
    flex: 1,
  },
  controlLabel: {
    ...playerType.callout,
    color: playerColors.text,
  },
  controlValue: {
    ...playerType.caption,
    color: playerColors.textDim,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: playerForm.space.sm,
    backgroundColor: playerColors.surfaceRaised,
    borderRadius: playerForm.fieldRadius,
    borderWidth: 1,
    borderColor: playerColors.border,
    padding: 3,
  },
  stepBtn: {
    /** Cible tactile du socle (44 pt) ; 34 pt mesurés avant sur écran étroit. */
    width: playerForm.chipHeight,
    height: playerForm.chipHeight,
    borderRadius: playerForm.fieldRadius - 6,
    backgroundColor: playerColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisplay: {
    ...playerType.callout,
    fontWeight: '800',
    color: playerColors.text,
    minWidth: 38,
    textAlign: 'center',
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scaleChip: {
    width: 40,
    minHeight: playerForm.chipHeight,
    paddingHorizontal: 0,
  },
  scaleChipText: {
    ...playerType.caption,
    color: playerColors.textMuted,
  },
  scaleChipTextActive: {
    color: playerColors.accent,
    fontWeight: '800',
  },
  validateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: playerForm.space.sm,
    minHeight: playerForm.actionMinHeight,
    borderRadius: playerForm.actionRadius,
    backgroundColor: playerColors.accent,
    marginTop: playerForm.space.lg,
  },
  validateBtnBusy: {
    opacity: 0.6,
  },
  validateText: {
    ...playerType.callout,
    fontWeight: '800',
    color: playerColors.bg,
  },
  saveFeedbackOk: {
    ...playerType.caption,
    color: CLUB_TOKENS.success,
    marginTop: playerForm.space.sm,
    textAlign: 'center',
  },
  saveFeedbackError: {
    ...playerType.caption,
    color: CLUB_TOKENS.danger,
    marginTop: playerForm.space.sm,
    textAlign: 'center',
  },

  /* ACWR */
  acwrCard: {
    padding: playerForm.cardPaddingH,
    marginBottom: playerForm.space.lg,
  },
  acwrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: playerForm.space.md,
    marginBottom: playerForm.space.md,
  },
  acwrIcon: {
    width: 36,
    height: 36,
    borderRadius: playerForm.fieldRadius,
    backgroundColor: playerColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acwrTextCol: {
    flex: 1,
  },
  acwrTitle: {
    ...playerType.headline,
    color: playerColors.text,
  },
  acwrSub: {
    ...playerType.caption,
    color: playerColors.textDim,
    marginTop: 1,
  },
  acwrValue: {
    ...playerType.stat,
    color: playerColors.textMuted,
  },

  /* Sections */
  sectionBlock: {
    marginBottom: playerForm.space.lg,
  },
  sectionTitle: {
    ...playerType.section,
    color: playerColors.text,
    marginBottom: playerForm.space.sm,
  },
  honestNote: {
    ...playerType.caption,
    color: playerColors.textMuted,
    lineHeight: 18,
  },
});

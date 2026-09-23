import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { fontFamily } from '../../theme/typography';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import {
  fffOfficialRegistryService,
  type OfficialFffClub,
  type PreRegisteredMember,
} from '../../services/fffOfficialRegistry.service';
import { PublicClubAutocomplete } from './PublicClubAutocomplete';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';
import { spacing, radius } from '../../theme/designTokens';
import { PressableSpring } from '../motion';

export interface SignupFffAffiliationCardProps {
  role: 'player' | 'coach' | 'club' | 'parent';
  hasClub: boolean;
  onToggleHasClub: (hasClub: boolean) => void;
  selectedClub: OfficialFffClub | null;
  onSelectClub: (club: OfficialFffClub | null) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedRosterMember?: PreRegisteredMember | null;
  onSelectRosterMember?: (member: PreRegisteredMember | null) => void;
  isCustomProfile?: boolean;
  onToggleCustomProfile?: (custom: boolean) => void;
  identityDoc?: { uri: string; name: string; type: string } | null;
  onSetIdentityDoc?: (doc: { uri: string; name: string; type: string } | null) => void;
  defaultUserName?: string;
  onChangeCustomName?: (name: string) => void;
  error?: string;
}

/**
 * Nouveau composant interactif d'affiliation club :
 * - Question claire et deux grands choix interactifs Liquid Glass
 * - Recherche club épurée avec complétion FFF instantanée
 * - Sélection de catégorie intuitive
 * - Zéro formulaire dense ni sous-cartes imbriquées
 */
export const SignupFffAffiliationCard: React.FC<SignupFffAffiliationCardProps> = ({
  role,
  hasClub,
  onToggleHasClub,
  selectedClub,
  onSelectClub,
  selectedCategory,
  onSelectCategory,
  error,
}) => {
  const { visual } = useSignupFlowTheme();
  const [clubCategories, setClubCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [manualCategory, setManualCategory] = useState('');

  const isCoach = role === 'coach';
  const isClub = role === 'club';

  // Chargement des catégories engagées du club sélectionné
  useEffect(() => {
    let active = true;
    if (!selectedClub) {
      setClubCategories([]);
      setManualCategory('');
      return;
    }

    setLoadingCategories(true);
    fffOfficialRegistryService
      .getCategoriesForClub(selectedClub)
      .then((cats) => {
        if (!active) return;
        setClubCategories(cats);
      })
      .catch(() => {
        if (!active) return;
        setClubCategories([]);
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });

    return () => {
      active = false;
    };
  }, [selectedClub]);

  return (
    <View style={styles.container}>
      {/* Question principale */}
      <ProDayText style={styles.sectionLabel}>
        {isCoach
          ? 'Encadrez-vous un club actuellement ?'
          : isClub
            ? 'Votre club est-il affilié FFF ?'
            : 'Faites-vous partie d’un club de football ?'}
      </ProDayText>

      {/* 2 Choix interactifs grand format */}
      <View style={styles.choicesRow}>
        <LiquidGlassSurface
          variant="interactive"
          active={hasClub}
          onPress={() => onToggleHasClub(true)}
          style={styles.choiceCard}
          contentStyle={styles.choiceContent}
          accessibilityLabel="Oui, j'ai un club"
        >
          <View style={[styles.choiceIconWrap, hasClub && { backgroundColor: visual.accent }]}>
            <Icon
              name="shield"
              size={22}
              color={hasClub ? visual.onAccent : visual.textMuted}
            />
          </View>
          <View style={styles.choiceTextWrap}>
            <ProDayText style={[styles.choiceTitle, hasClub && { color: visual.text, fontWeight: '700' }]}>
              {isCoach ? "Oui, j'encadre un club" : isClub ? "Oui, club affilié" : "Oui, j'ai un club"}
            </ProDayText>
            <ProDayText style={styles.choiceSubtitle}>
              Recherche dans l’annuaire FFF
            </ProDayText>
          </View>
          {hasClub && (
            <View style={[styles.checkBadge, { backgroundColor: visual.accent }]}>
              <Icon name="checkmark-circle" size={16} color={visual.onAccent} />
            </View>
          )}
        </LiquidGlassSurface>

        <LiquidGlassSurface
          variant="interactive"
          active={!hasClub}
          onPress={() => {
            onToggleHasClub(false);
            onSelectClub(null);
            onSelectCategory('');
          }}
          style={styles.choiceCard}
          contentStyle={styles.choiceContent}
          accessibilityLabel="Sans club pour le moment"
        >
          <View style={[styles.choiceIconWrap, !hasClub && { backgroundColor: visual.accent }]}>
            <Icon
              name="football"
              size={22}
              color={!hasClub ? visual.onAccent : visual.textMuted}
            />
          </View>
          <View style={styles.choiceTextWrap}>
            <ProDayText style={[styles.choiceTitle, !hasClub && { color: visual.text, fontWeight: '700' }]}>
              Sans club pour le moment
            </ProDayText>
            <ProDayText style={styles.choiceSubtitle}>
              Parcours autonome et détection
            </ProDayText>
          </View>
          {!hasClub && (
            <View style={[styles.checkBadge, { backgroundColor: visual.accent }]}>
              <Icon name="checkmark-circle" size={16} color={visual.onAccent} />
            </View>
          )}
        </LiquidGlassSurface>
      </View>

      {/* Si rattaché à un club : recherche et sélection de l'équipe */}
      {hasClub ? (
        <View style={styles.clubSelectionSection}>
          <ProDayText style={styles.subSectionLabel}>
            Rechercher votre club officiel FFF
          </ProDayText>

          <PublicClubAutocomplete
            selectedClub={selectedClub}
            onSelectClub={(club) => {
              onSelectClub(club);
              onSelectCategory('');
            }}
            placeholder="Nom du club, ville ou n° affiliation FFF"
            accent={visual.accent}
            error={error}
          />

          {/* Sélection de la catégorie / équipe si club sélectionné */}
          {selectedClub ? (
            <View style={styles.categorySection}>
              <ProDayText style={styles.subSectionLabel}>
                Catégorie ou équipe
              </ProDayText>

              {loadingCategories ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={visual.accent} />
                  <ProDayText style={styles.loadingText}>
                    Chargement des équipes FFF du club...
                  </ProDayText>
                </View>
              ) : clubCategories.length > 0 ? (
                <View style={styles.chipsWrap}>
                  {clubCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <PressableSpring
                        key={cat}
                        onPress={() => onSelectCategory(cat)}
                        style={[
                          styles.categoryChip,
                          isSelected && {
                            backgroundColor: visual.accent,
                            borderColor: visual.accent,
                          },
                        ]}
                      >
                        <ProDayText
                          style={[
                            styles.categoryChipText,
                            isSelected && {
                              color: visual.onAccent,
                              fontFamily: fontFamily.bold,
                            },
                          ]}
                        >
                          {cat}
                        </ProDayText>
                      </PressableSpring>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.manualCategoryWrap}>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="Ex: U17 National, Seniors R1, R2..."
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={selectedCategory || manualCategory}
                    onChangeText={(val) => {
                      setManualCategory(val);
                      onSelectCategory(val);
                    }}
                  />
                </View>
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <ProDayText style={[styles.errorText, { color: visual.danger }]}>
          {error}
        </ProDayText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 4,
  },
  choicesRow: {
    gap: 12,
  },
  choiceCard: {
    width: '100%',
  },
  choiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  choiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTextWrap: {
    flex: 1,
    gap: 3,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  choiceSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubSelectionSection: {
    marginTop: 8,
    gap: 12,
  },
  subSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  categorySection: {
    marginTop: 8,
    gap: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  manualCategoryWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  manualInput: {
    fontSize: 14,
    color: '#FFFFFF',
    padding: 0,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
});

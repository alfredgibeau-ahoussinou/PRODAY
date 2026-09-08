import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  type OfficialFffClub,
  FffOfficialRegistryError,
} from '../../services/fffOfficialRegistry.service';
import { publicClubDirectoryService } from '../../services/publicClubDirectory.service';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { AUTH_XP } from '../../features/auth/experience/tokens';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import type { PublicClubClaimStatus } from '../../models/PublicClubDirectory';

type Props = {
  selectedClub: OfficialFffClub | null;
  onSelectClub: (club: OfficialFffClub | null) => void;
  /** Accent pôle (coach / club / joueur) */
  accent?: string;
  placeholder?: string;
  error?: string;
  /** Affiche le badge claim si connu dans l’annuaire */
  showClaimBadge?: boolean;
};

const CLAIM_LABEL: Record<PublicClubClaimStatus, string> = {
  unclaimed: 'À revendiquer',
  claimed_pending: 'En vérification',
  verified: 'Vérifié',
  activated: 'Actif',
};

/**
 * Autocomplete clubs français — annuaire public ProDay + DOFA live.
 * Données association uniquement (pas de licenciés / PII).
 */
export const PublicClubAutocomplete: React.FC<Props> = ({
  selectedClub,
  onSelectClub,
  accent = AUTH_XP.gold,
  placeholder = 'Club, ville, CP ou n° affiliation FFF',
  error,
  showClaimBadge = true,
}) => {
  const styles = useMemo(() => createStyles(accent), [accent]);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<OfficialFffClub[]>([]);
  const [claimByFff, setClaimByFff] = useState<Record<string, PublicClubClaimStatus>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (selectedClub) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    const timer = setTimeout(async () => {
      try {
        const clubs = await publicClubDirectoryService.searchClubs(q);
        if (!active) return;
        setResults(clubs.slice(0, 25));
        if (clubs.length === 0) {
          setSearchError(
            'Aucun club FFF trouvé. Essayez la ville, le CP (5 chiffres) ou le n° d’affiliation.',
          );
        }
        // Badges claim (best-effort)
        if (showClaimBadge) {
          const statuses: Record<string, PublicClubClaimStatus> = {};
          await Promise.all(
            clubs.slice(0, 12).map(async (c) => {
              if (!c.fffNumber) return;
              const entry = await publicClubDirectoryService.getByAffiliation(c.fffNumber);
              if (entry) statuses[c.fffNumber] = entry.claim_status;
            }),
          );
          if (active) setClaimByFff((prev) => ({ ...prev, ...statuses }));
        }
      } catch (err) {
        if (!active) return;
        setResults([]);
        setSearchError(
          err instanceof FffOfficialRegistryError
            ? err.message
            : 'Erreur de recherche club. Réessayez.',
        );
      } finally {
        if (active) setIsSearching(false);
      }
    }, 280);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedClub, showClaimBadge]);

  if (selectedClub) {
    const status = selectedClub.fffNumber
      ? claimByFff[selectedClub.fffNumber]
      : undefined;
    return (
      <View style={styles.selectedCard}>
        <View style={[styles.selectedAccent, { backgroundColor: accent }]} />
        <View style={styles.selectedBody}>
          <ProDayText variant="section" style={styles.selectedName}>
            {selectedClub.name}
          </ProDayText>
          <ProDayText variant="caption" style={styles.selectedMeta}>
            {[selectedClub.city, selectedClub.postalCode, selectedClub.department]
              .filter(Boolean)
              .join(' · ')}
          </ProDayText>
          {selectedClub.fffNumber ? (
            <ProDayText variant="caption" style={styles.selectedFff}>
              N° FFF {selectedClub.fffNumber}
            </ProDayText>
          ) : null}
          {status && showClaimBadge ? (
            <View style={styles.badge}>
              <ProDayText variant="caption" style={[styles.badgeText, { color: accent }]}>
                {CLAIM_LABEL[status]}
              </ProDayText>
            </View>
          ) : null}
        </View>
        <PressableSpring
          onPress={() => {
            onSelectClub(null);
            setSearchQuery('');
          }}
          scaleTo={0.94}
          haptic
          style={styles.clearBtn}
          accessibilityLabel="Changer de club"
        >
          <Icon name="close" size={16} color="#FFFFFF" />
        </PressableSpring>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.inputWrap}>
        <Icon name="search" size={18} color="rgba(255,255,255,0.45)" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {isSearching ? <ActivityIndicator size="small" color={accent} /> : null}
      </View>

      {error ? (
        <ProDayText variant="caption" style={styles.error}>
          {error}
        </ProDayText>
      ) : null}
      {searchError ? (
        <ProDayText variant="caption" style={styles.hint}>
          {searchError}
        </ProDayText>
      ) : null}

      {results.length > 0 ? (
        <ScrollView
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {results.map((club) => {
            const status = club.fffNumber ? claimByFff[club.fffNumber] : undefined;
            return (
              <PressableSpring
                key={`${club.id}-${club.fffNumber}`}
                onPress={() => onSelectClub(club)}
                scaleTo={0.98}
                haptic
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel={club.name}
              >
                <View style={[styles.dot, { backgroundColor: accent }]} />
                <View style={styles.rowCopy}>
                  <ProDayText variant="section" style={styles.rowTitle} numberOfLines={1}>
                    {club.name}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.rowSub} numberOfLines={1}>
                    {[club.city, club.postalCode, club.department ? `Dept ${club.department}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </ProDayText>
                </View>
                {status && status !== 'unclaimed' ? (
                  <ProDayText variant="caption" style={[styles.rowBadge, { color: accent }]}>
                    {CLAIM_LABEL[status]}
                  </ProDayText>
                ) : (
                  <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                )}
              </PressableSpring>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
};

function createStyles(accent: string) {
  return StyleSheet.create({
    root: { gap: 8 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      minHeight: 48,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: fontFamily.regular,
      paddingVertical: 10,
    },
    dropdown: {
      maxHeight: 260,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    dot: { width: 7, height: 7, borderRadius: 4 },
    rowCopy: { flex: 1, gap: 2 },
    rowTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    rowSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
    rowBadge: { fontSize: 10, fontWeight: '700' },
    error: { color: '#FF6B6B' },
    hint: { color: 'rgba(255,255,255,0.45)' },
    selectedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: `${accent}55`,
    },
    selectedAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
    selectedBody: { flex: 1, gap: 2 },
    selectedName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    selectedMeta: { color: 'rgba(255,255,255,0.55)' },
    selectedFff: { color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    badge: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: `${accent}22`,
    },
    badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    clearBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
  });
}

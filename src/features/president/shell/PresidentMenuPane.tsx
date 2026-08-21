import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PresidentActionRow, PresidentSectionCard, PresidentText } from '../ui/presidentUi';
import { usePresidentTheme } from './PresidentThemeContext';
import type { PresidentNavResolvedItem } from '../navigation/resolvePresidentNavAccess';
import type { PresidentNavItemId } from '../navigation/presidentNavConfig';
import { presidentSpace } from '../theme/presidentDesignSystem';
import type { PresidentThemeTokens } from '../theme/presidentTokens';

type Props = {
  items: PresidentNavResolvedItem[];
  onSelect: (id: PresidentNavItemId) => void;
  onExitClub: () => void;
};

export function PresidentMenuPane({ items, onSelect, onExitClub }: Props) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: presidentSpace.lg, gap: presidentSpace.lg }}
    >
      <View style={{ gap: 4 }}>
        <PresidentText variant="label" champagne>
          Menu
        </PresidentText>
        <PresidentText variant="h1">Pôle Président</PresidentText>
        <PresidentText variant="body" muted>
          Direction, prestige, stratégie — distinct du Club quotidien.
        </PresidentText>
      </View>

      <PresidentSectionCard title="Sections">
        {items.map((item) => (
          <PresidentActionRow
            key={item.id}
            label={item.label}
            hint={item.hint}
            icon={item.icon}
            onPress={() => onSelect(item.id)}
          />
        ))}
      </PresidentSectionCard>

      <PresidentSectionCard title="Navigation">
        <PresidentActionRow
          label="Retourner au Pôle Club"
          hint="Gestion sportive quotidienne"
          icon="football"
          accent
          onPress={onExitClub}
        />
      </PresidentSectionCard>
    </ScrollView>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
  });
}

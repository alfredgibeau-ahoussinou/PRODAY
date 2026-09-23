/**
 * Rendu des réponses de l'assistant.
 *
 * Le serveur renvoie du texte structuré (paragraphes, listes numérotées ou à puces, tableaux,
 * blocs de code, liens). L'afficher tel quel faisait apparaître les `**` et les `|` : ce
 * composant traduit les blocs en éléments lisibles.
 *
 * Les **tableaux** ne provoquent jamais de défilement horizontal : au-delà de 560 px de large
 * ils s'affichent en grille, en dessous ils deviennent des paires « libellé / valeur »
 * empilées, ce qui reste lisible sur iPhone.
 */
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { parseCopilotBlocks } from './copilotCore';
import type { CopilotBlock, CopilotInlineSpan } from './copilotCore';
import type { CopilotTokens } from './copilotTokens';

const GRID_MIN_WIDTH = 560;

type Props = {
  content: string;
  tokens: CopilotTokens;
};

function Spans({
  spans,
  tokens,
  style,
}: {
  spans: CopilotInlineSpan[];
  tokens: CopilotTokens;
  style?: object;
}) {
  return (
    <ProDayText variant="body" style={[styles.body, { color: tokens.foreground }, style]}>
      {spans.map((span, i) => (
        <ProDayText
          key={`s${i}`}
          variant="body"
          style={[
            styles.body,
            { color: tokens.foreground },
            span.bold ? styles.bold : null,
            span.code
              ? { fontFamily: 'Courier', backgroundColor: tokens.elevated, color: tokens.accent }
              : null,
            span.href ? { color: tokens.accent, textDecorationLine: 'underline' } : null,
          ]}
        >
          {span.text}
        </ProDayText>
      ))}
    </ProDayText>
  );
}

function Table({
  block,
  tokens,
}: {
  block: Extract<CopilotBlock, { kind: 'table' }>;
  tokens: CopilotTokens;
}) {
  const { width } = useWindowDimensions();
  const asGrid = width >= GRID_MIN_WIDTH;

  if (asGrid) {
    return (
      <View style={[styles.table, { borderColor: tokens.border }]}>
        <View style={[styles.tableRow, { backgroundColor: tokens.elevated }]}>
          {block.headers.map((h, i) => (
            <View key={`h${i}`} style={styles.tableCell}>
              <Spans spans={h} tokens={tokens} style={styles.bold} />
            </View>
          ))}
        </View>
        {block.rows.map((row, r) => (
          <View
            key={`r${r}`}
            style={[
              styles.tableRow,
              r > 0 ? { borderTopWidth: 1, borderTopColor: tokens.border } : null,
            ]}
          >
            {row.map((cell, c) => (
              <View key={`c${c}`} style={styles.tableCell}>
                <Spans spans={cell} tokens={tokens} />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  // Étroit : une fiche par ligne, en-tête repris comme libellé. Aucune information perdue.
  return (
    <View style={styles.stack}>
      {block.rows.map((row, r) => (
        <View
          key={`sr${r}`}
          style={[styles.stackCard, { borderColor: tokens.border, backgroundColor: tokens.elevated }]}
        >
          {row.map((cell, c) => (
            <View key={`sc${c}`} style={styles.stackLine}>
              <ProDayText variant="caption" style={{ color: tokens.muted }}>
                {block.headers[c]?.map((s) => s.text).join('') ?? ''}
              </ProDayText>
              <Spans spans={cell} tokens={tokens} style={styles.stackValue} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function CopilotBlocks({ content, tokens }: Props) {
  const blocks = parseCopilotBlocks(content);

  return (
    <View style={styles.root}>
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.kind) {
          case 'heading':
            return (
              <ProDayText
                key={key}
                variant={block.level === 2 ? 'section' : 'body'}
                style={[
                  styles.heading,
                  block.level === 3 ? styles.heading3 : null,
                  { color: tokens.foreground },
                ]}
              >
                {block.spans.map((s) => s.text).join('')}
              </ProDayText>
            );
          case 'bullets':
            return (
              <View key={key} style={styles.list}>
                {block.items.map((item, i) => (
                  <View key={`i${i}`} style={styles.listItem}>
                    <ProDayText variant="body" style={[styles.marker, { color: tokens.accent }]}>
                      •
                    </ProDayText>
                    <View style={styles.listBody}>
                      <Spans spans={item} tokens={tokens} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'ordered':
            return (
              <View key={key} style={styles.list}>
                {block.items.map((item, i) => (
                  <View key={`i${i}`} style={styles.listItem}>
                    <ProDayText variant="body" style={[styles.markerNum, { color: tokens.accent }]}>
                      {i + 1}.
                    </ProDayText>
                    <View style={styles.listBody}>
                      <Spans spans={item} tokens={tokens} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'quote':
            return (
              <View key={key} style={[styles.quote, { borderLeftColor: tokens.accent }]}>
                <Spans spans={block.spans} tokens={tokens} style={{ color: tokens.muted }} />
              </View>
            );
          case 'code':
            return (
              <View key={key} style={[styles.code, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                <ProDayText variant="caption" style={{ color: tokens.muted }}>
                  {block.language || 'code'}
                </ProDayText>
                <ProDayText
                  variant="body"
                  style={[styles.codeText, { color: tokens.foreground }]}
                >
                  {block.code}
                </ProDayText>
              </View>
            );
          case 'table':
            return <Table key={key} block={block} tokens={tokens} />;
          case 'divider':
            return <View key={key} style={[styles.divider, { backgroundColor: tokens.border }]} />;
          default:
            return <Spans key={key} spans={block.spans} tokens={tokens} />;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  body: { fontSize: 15, lineHeight: 22 },
  bold: { fontWeight: '700' },
  heading: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  heading3: { fontSize: 15 },
  list: { gap: 6 },
  listItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  marker: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  markerNum: { fontSize: 15, lineHeight: 22, fontWeight: '700', minWidth: 20 },
  listBody: { flex: 1 },
  quote: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 2 },
  code: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  codeText: { fontSize: 13, lineHeight: 19 },
  table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  tableRow: { flexDirection: 'row' },
  tableCell: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  stack: { gap: 8 },
  stackCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  stackLine: { gap: 2 },
  stackValue: { fontSize: 14 },
  divider: { height: 1, marginVertical: 4 },
});

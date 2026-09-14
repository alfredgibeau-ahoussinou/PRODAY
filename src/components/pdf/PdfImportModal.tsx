import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  parseRosterText,
  SAMPLE_FFF_MATCH_SHEET,
  ExtractedPlayer,
  ExtractedTacticsInfo,
  ExistingSquadPlayer,
  PdfRosterParseResult,
  TacticalPositionCategory,
} from '../../services/pdf/pdfRosterExtractor.service';

interface PdfImportModalProps {
  visible: boolean;
  onClose: () => void;
  existingPlayers?: ExistingSquadPlayer[];
  onImportToSquad?: (players: ExtractedPlayer[]) => void;
  onUseForTactics?: (tactics: ExtractedTacticsInfo) => void;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  visible,
  onClose,
  existingPlayers = [],
  onImportToSquad,
  onUseForTactics,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [parseResult, setParseResult] = useState<PdfRosterParseResult | null>(null);
  const [playersList, setPlayersList] = useState<ExtractedPlayer[]>([]);
  const [filterDuplicateOnly, setFilterDuplicateOnly] = useState(false);

  const handleLoadSample = () => {
    const res = parseRosterText(SAMPLE_FFF_MATCH_SHEET, existingPlayers, 'feuille_match_fff_officielle.pdf');
    setParseResult(res);
    setPlayersList(res.players);
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) {
      Alert.alert('Texte vide', 'Veuillez coller le contenu ou les lignes de votre document.');
      return;
    }
    const res = parseRosterText(pastedText, existingPlayers, 'import_manuel.txt');
    setParseResult(res);
    setPlayersList(res.players);
  };

  const handleReset = () => {
    setParseResult(null);
    setPlayersList([]);
    setPastedText('');
  };

  const togglePlayerSelection = (id: string) => {
    setPlayersList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'duplicate' ? 'ready' : 'duplicate' } : p))
    );
  };

  const updatePlayerField = (id: string, field: keyof ExtractedPlayer, value: any) => {
    setPlayersList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleImportToSquad = () => {
    const validPlayers = playersList.filter((p) => p.status !== 'duplicate');
    if (validPlayers.length === 0) {
      Alert.alert('Aucun joueur valide', 'Tous les joueurs sont marqués en doublon ou exclus.');
      return;
    }
    onImportToSquad?.(validPlayers);
    Alert.alert(
      'Import réussi',
      `${validPlayers.length} joueur(s) ont été intégrés à l'effectif.`
    );
    handleReset();
    onClose();
  };

  const handleUseForTactics = () => {
    const starters = playersList.slice(0, 11);
    const substitutes = playersList.slice(11);
    const tactics: ExtractedTacticsInfo = {
      formation: parseResult?.tactics?.formation || '4-3-3',
      starters,
      substitutes,
      matchTitle: parseResult?.tactics?.matchTitle || 'Composition importée',
      matchDate: new Date().toISOString().split('T')[0],
    };

    if (onUseForTactics) {
      onUseForTactics(tactics);
      onClose();
    } else {
      Alert.alert(
        'Composition prête',
        `11 titulaires et ${substitutes.length} remplaçants ont été préparés pour la tactique 6 étapes.`
      );
    }
  };

  const displayedPlayers = filterDuplicateOnly
    ? playersList.filter((p) => p.isDuplicate)
    : playersList;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="document-text-outline" size={22} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Import de PDF & Feuilles de Match</Text>
                <Text style={styles.headerSubtitle}>
                  Section 28 • Extraction de listes, licences FFF & compo tactique
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fermer">
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {!parseResult ? (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              {/* Tab Selector */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'upload' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('upload')}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={16}
                    color={activeTab === 'upload' ? '#0F172A' : '#64748B'}
                  />
                  <Text
                    style={[styles.tabBtnText, activeTab === 'upload' && styles.tabBtnTextActive]}
                  >
                    Dépôt PDF / Exemple
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'paste' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('paste')}
                >
                  <Ionicons
                    name="clipboard-outline"
                    size={16}
                    color={activeTab === 'paste' ? '#0F172A' : '#64748B'}
                  />
                  <Text
                    style={[styles.tabBtnText, activeTab === 'paste' && styles.tabBtnTextActive]}
                  >
                    Coller le texte brut
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'upload' ? (
                <View style={styles.uploadZone}>
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="document-attach" size={40} color="#0284C7" />
                  </View>
                  <Text style={styles.uploadTitle}>Déposez votre PDF ici</Text>
                  <Text style={styles.uploadDescription}>
                    Prend en charge les feuilles de match officielles FFF, exportations d'effectif ou compositions imprimées.
                  </Text>

                  <TouchableOpacity
                    style={styles.sampleActionBtn}
                    onPress={handleLoadSample}
                  >
                    <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.sampleActionBtnText}>
                      Charger l'exemple Feuille FFF (16 joueurs)
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pasteZone}>
                  <Text style={styles.fieldLabel}>Collez le texte brut du PDF :</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={8}
                    placeholder={`Exemple :\n1. Thomas DUPONT (Gardien) Lic. 254199\n10. Kylian MBAPPE Attaquant\n4. Raphael VARANE Défenseur`}
                    placeholderTextColor="#94A3B8"
                    value={pastedText}
                    onChangeText={setPastedText}
                  />
                  <TouchableOpacity
                    style={styles.sampleActionBtn}
                    onPress={handleParsePasted}
                  >
                    <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.sampleActionBtnText}>Analyser et extraire l'effectif</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          ) : (
            /* Results View */
            <View style={styles.resultContainer}>
              {/* Summary Stats */}
              <View style={styles.resultSummaryBar}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{playersList.length}</Text>
                  <Text style={styles.statLabel}>Joueurs extraits</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#16A34A' }]}>
                    {playersList.filter((p) => p.isStarter).length}
                  </Text>
                  <Text style={styles.statLabel}>Titulaires (1-11)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#D97706' }]}>
                    {playersList.filter((p) => p.isDuplicate).length}
                  </Text>
                  <Text style={styles.statLabel}>Doublons détectés</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#0284C7' }]}>
                    {parseResult.tactics?.formation || '4-3-3'}
                  </Text>
                  <Text style={styles.statLabel}>Dispositif</Text>
                </View>
              </View>

              {/* Duplicate Filter Toggle */}
              {parseResult.duplicatesCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.duplicateFilterPill,
                    filterDuplicateOnly && styles.duplicateFilterPillActive,
                  ]}
                  onPress={() => setFilterDuplicateOnly(!filterDuplicateOnly)}
                >
                  <Ionicons
                    name="filter"
                    size={14}
                    color={filterDuplicateOnly ? '#FFFFFF' : '#D97706'}
                  />
                  <Text
                    style={[
                      styles.duplicateFilterText,
                      filterDuplicateOnly && styles.duplicateFilterTextActive,
                    ]}
                  >
                    {filterDuplicateOnly
                      ? 'Afficher tous les joueurs'
                      : `Voir uniquement les ${parseResult.duplicatesCount} doublons`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Reconciliation Table */}
              <ScrollView style={styles.tableScroll}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { width: 34 }]}>#</Text>
                  <Text style={[styles.th, { flex: 2 }]}>Joueur</Text>
                  <Text style={[styles.th, { width: 68 }]}>Poste</Text>
                  <Text style={[styles.th, { flex: 1.2 }]}>Licence</Text>
                  <Text style={[styles.th, { width: 84, textAlign: 'center' }]}>Statut</Text>
                </View>

                {displayedPlayers.map((player, idx) => {
                  const isStarter = idx < 11;
                  return (
                    <View
                      key={player.id}
                      style={[
                        styles.tableRow,
                        player.isDuplicate && styles.tableRowDuplicate,
                        isStarter && styles.tableRowStarter,
                      ]}
                    >
                      <TextInput
                        style={styles.jerseyInput}
                        value={player.number ? String(player.number) : ''}
                        keyboardType="numeric"
                        onChangeText={(t) =>
                          updatePlayerField(player.id, 'number', parseInt(t, 10) || undefined)
                        }
                      />

                      <View style={{ flex: 2, paddingRight: 6 }}>
                        <TextInput
                          style={styles.nameInput}
                          value={player.fullName}
                          onChangeText={(t) => updatePlayerField(player.id, 'fullName', t)}
                        />
                        {player.duplicateReason && (
                          <Text style={styles.duplicateReasonText}>{player.duplicateReason}</Text>
                        )}
                      </View>

                      <View style={{ width: 68 }}>
                        <Text style={styles.badgePosition}>
                          {player.positionCategory || 'POLY'}
                        </Text>
                      </View>

                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.licenseCell} numberOfLines={1}>
                          {player.licenseNumber ? `#${player.licenseNumber}` : '—'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.statusBadge,
                          player.status === 'ready'
                            ? styles.statusBadgeReady
                            : styles.statusBadgeDuplicate,
                        ]}
                        onPress={() => togglePlayerSelection(player.id)}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            player.status === 'ready'
                              ? styles.statusBadgeTextReady
                              : styles.statusBadgeTextDuplicate,
                          ]}
                        >
                          {player.status === 'ready' ? 'Valide' : 'Doublon'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Bottom Actions */}
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.btnSecondary} onPress={handleReset}>
                  <Ionicons name="refresh-outline" size={16} color="#64748B" />
                  <Text style={styles.btnSecondaryText}>Recommencer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnTactics}
                  onPress={handleUseForTactics}
                >
                  <Ionicons name="football-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.btnTacticsText}>Utiliser pour compo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleImportToSquad}
                >
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}>Intégrer effectif</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  uploadZone: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 420,
    marginBottom: 24,
  },
  sampleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sampleActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pasteZone: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: 180,
    textAlignVertical: 'top',
  },
  resultContainer: {
    flex: 1,
    maxHeight: 520,
  },
  resultSummaryBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  duplicateFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  duplicateFilterPillActive: {
    backgroundColor: '#D97706',
  },
  duplicateFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  duplicateFilterTextActive: {
    color: '#FFFFFF',
  },
  tableScroll: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowDuplicate: {
    backgroundColor: '#FFFBEB',
  },
  tableRowStarter: {
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
    paddingLeft: 4,
  },
  jerseyInput: {
    width: 32,
    height: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  nameInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  duplicateReasonText: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 2,
  },
  badgePosition: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  licenseCell: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeReady: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeDuplicate: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextReady: {
    color: '#16A34A',
  },
  statusBadgeTextDuplicate: {
    color: '#DC2626',
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  btnTactics: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  btnTacticsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0284C7',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

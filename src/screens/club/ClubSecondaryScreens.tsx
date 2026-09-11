import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  parseFootclubsCsv,
  exportLicensesToCsv,
  type ParsedLicenseRow,
} from '../../features/club/utils/footclubsCsvParser';
import { clubLicenseService } from '../../features/club/services/clubLicenseService';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { ClubVideoScreen } from './ClubVideoScreen';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import {
  ClubNotifDeliveryNote,
  ClubNotifListCard,
} from '../../features/club/ui/ClubNotifChrome';
import { ClubEventOrganization } from '../../components/club/ClubEventOrganization';
import { ClubFinanceLedgerPanel } from '../../components/club/ClubFinanceLedgerPanel';
import {
  staffNotificationsService,
  type StaffNotification,
} from '../../services/staffNotifications.service';
import {
  clubRoleVisibilityService,
  type ClubRoleVisibilityPrefs,
  type ClubVisibilityRoleId,
} from '../../services/clubRoleVisibility.service';
import type { ClubNavItemId } from '../../features/club/navigation/clubNavConfig';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import type { IconName } from '../../components/ui/iconNames';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';
import {
  STAFF_NOTIF_DELIVERY_HINT,
  staffNotificationRoute,
  staffNotifsSubtitle,
} from '../../utils/staffNotificationRouting';
import { clubTournamentPoolsHonesty } from '../../utils/aiUxHonesty';

function ClubStubShell({
  title,
  subtitle,
  body,
  icon = 'flag',
  children,
}: {
  title: string;
  subtitle: string;
  body: string;
  icon?: IconName;
  children?: React.ReactNode;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title={title} subtitle={subtitle} />
        <ClubEmptyState title={title} body={body} icon={icon} />
        {children}
      </ClubChapterScroll>
    </View>
  );
}

export function ClubEventsScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const clubId = ws.clubId;
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const poolsHonesty = clubTournamentPoolsHonesty();

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader
          title="Événements"
          subtitle="Tournois · stages · organisation · poules"
        />
        {clubId && profile ? (
          <ClubSectionCard title="Organisation & Calendrier Événements">
            <ClubEventOrganization
              clubId={clubId}
              userId={profile.uid}
              organizerName={profile.display_name}
            />
          </ClubSectionCard>
        ) : (
          <ClubEmptyState
            title="Événements"
            body="Liez un club pour organiser tournois et stages."
            icon="flag"
          />
        )}
        <ClubSectionCard title={poolsHonesty.title}>
          <ClubText variant="body" muted>
            {poolsHonesty.body}
          </ClubText>
          <ClubActionRow
            icon="calendar"
            label="Créer un événement ou tournoi"
            hint="Lance le formulaire de création d'événement"
            onPress={() => shellNav?.openCreate?.('event') ?? shellNav?.requestNav('calendar')}
          />
          <ClubActionRow
            icon="trophy"
            label="Consulter l'agenda club complet"
            hint="Voir tous les tournois, matchs et séances"
            onPress={() => shellNav?.requestNav('calendar')}
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

export function ClubLicensesScreen() {
  const ws = useClubWorkspace();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedLicenseRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [verifyingUid, setVerifyingUid] = useState<string | null>(null);

  const totalPlayers = ws.players.length;
  const verifiedCount = ws.players.filter(
    (p) => (p.profile as Record<string, unknown> | undefined)?.verification_status === 'verified',
  ).length;
  const pendingCount = totalPlayers - verifiedCount;

  // Mise à jour de la prévisualisation lorsque le texte CSV change
  const handleCsvChange = (text: string) => {
    setCsvText(text);
    if (text.trim().length > 10) {
      const res = parseFootclubsCsv(text);
      if (res.success) {
        setParsedRows(res.rows);
        setParseError(null);
      } else {
        setParsedRows([]);
        setParseError(res.errors[0] || 'CSV invalide — vérifiez les colonnes Licence / Nom.');
      }
    } else {
      setParsedRows([]);
      setParseError(null);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        handleCsvChange(content);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de lire le fichier sélectionné.');
    }
  };

  const handleExecuteImport = async () => {
    if (!ws.clubId || !profile?.uid) {
      Alert.alert('Erreur', 'Club ou session introuvable.');
      return;
    }
    if (parsedRows.length === 0) {
      Alert.alert('Aucune donnée', 'Veuillez coller ou sélectionner un fichier CSV valide.');
      return;
    }

    setIsImporting(true);
    try {
      const summary = await clubLicenseService.importLicensedRoster({
        clubId: ws.clubId,
        rows: parsedRows,
        approverUid: profile.uid,
        existingPlayers: ws.players,
        fffAffiliationNumber: ws.club?.fff_affiliation_number,
        clubName: ws.club?.name,
        clubCity: ws.club?.city,
      });

      await ws.refresh();
      setImportModalOpen(false);
      setCsvText('');
      setParsedRows([]);

      const affWarn = summary.errors.find((e) => e.includes('affiliation FFF'));
      const cacheHint = affWarn
        ? `\n\n⚠ ${affWarn}`
        : '\n\nEffectif publié pour l’inscription (mise à jour nocturne).';

      Alert.alert(
        'Importation réussie',
        `${summary.updatedCount} joueur(s) existant(s) certifié(s).\n${summary.newPendingCount} nouveau(x) licencié(s) pré-enregistré(s).${cacheHint}`,
      );
    } catch (err) {
      Alert.alert('Erreur lors de l\'import', err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCsv = () => {
    const listToExport = ws.players.map((p) => {
      const prof = p.profile as Record<string, unknown> | undefined;
      return {
        displayName: p.display_name,
        email: p.email,
        licenseNumber: (prof?.license_number as string) || '',
        category: (prof?.category as string) || 'Général',
        verified: prof?.verification_status === 'verified',
      };
    });

    const csvData = exportLicensesToCsv(listToExport);
    Alert.alert(
      'Export Licences généré',
      `${listToExport.length} licencié(s) exporté(s).\n\nLe fichier CSV est prêt pour votre tableur ou vos démarches FFF.`,
      [{ text: 'OK' }],
    );
  };

  const handleVerifyOne = async (playerUid: string, playerName: string) => {
    if (!ws.clubId || !profile?.uid) return;
    setVerifyingUid(playerUid);
    try {
      await clubLicenseService.verifyPlayerLicense({
        clubId: ws.clubId,
        playerUid,
        approverUid: profile.uid,
      });
      await ws.refresh();
      Alert.alert('Licence validée', `La licence de ${playerName} a été certifiée avec succès.`);
    } catch {
      Alert.alert('Erreur', 'Impossible de valider la licence.');
    } finally {
      setVerifyingUid(null);
    }
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader
          title="Licences & Documents"
          subtitle="Suivi des adhésions, pièces d'identité et certificats FFF"
        />

        {/* Compteurs */}
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: tokens.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <ClubText variant="caption" muted>
              Licences Validées
            </ClubText>
            <ClubText
              variant="title"
              style={{ fontSize: 24, fontWeight: '800', color: '#34D399', marginTop: 4 }}
            >
              {verifiedCount}
            </ClubText>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: tokens.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <ClubText variant="caption" muted>
              En Attente
            </ClubText>
            <ClubText
              variant="title"
              style={{ fontSize: 24, fontWeight: '800', color: '#FBBF24', marginTop: 4 }}
            >
              {pendingCount}
            </ClubText>
          </View>
        </View>

        {/* Boutons d'action Import / Export */}
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: tokens.accent,
              paddingVertical: 12,
              borderRadius: 12,
            }}
            onPress={() => setImportModalOpen(true)}
          >
            <Icon name="cloud-upload" size={16} color="#000" />
            <ClubText variant="section" style={{ fontSize: 13, color: '#000', fontWeight: '800' }}>
              Importer Footclubs (CSV)
            </ClubText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: tokens.surface,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
            onPress={handleExportCsv}
          >
            <Icon name="download" size={16} color={tokens.foreground} />
            <ClubText variant="section" style={{ fontSize: 13, fontWeight: '700' }}>
              Exporter
            </ClubText>
          </TouchableOpacity>
        </View>

        {/* Liste des adhérents */}
        <ClubSectionCard title="Contrôle des Adhésions">
          {ws.players.length === 0 ? (
            <ClubEmptyState
              title="Aucun joueur"
              body="Importez un fichier Footclubs ou ajoutez vos licenciés pour démarrer."
              icon="document"
            />
          ) : (
            ws.players.map((player) => {
              const prof = player.profile as Record<string, unknown> | undefined;
              const isVerified = prof?.verification_status === 'verified';
              const licenseNumber = (prof?.license_number as string) || null;
              const isPendingThis = verifyingUid === player.uid;

              return (
                <View
                  key={player.uid}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <ClubText variant="section" style={{ fontSize: 14 }}>
                      {player.display_name || 'Joueur'}
                    </ClubText>
                    <ClubText variant="caption" muted>
                      {player.email || 'Email non renseigné'}
                    </ClubText>
                    {licenseNumber ? (
                      <ClubText
                        variant="caption"
                        style={{ color: tokens.accent, fontSize: 11, marginTop: 2 }}
                      >
                        N° Licence FFF : {licenseNumber}
                      </ClubText>
                    ) : null}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        backgroundColor: isVerified
                          ? 'rgba(52, 211, 153, 0.15)'
                          : 'rgba(251, 191, 36, 0.15)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}
                    >
                      <ClubText
                        variant="caption"
                        style={{
                          color: isVerified ? '#34D399' : '#FBBF24',
                          fontWeight: '700',
                          fontSize: 11,
                        }}
                      >
                        {isVerified ? 'Valide' : 'À vérifier'}
                      </ClubText>
                    </View>

                    {!isVerified ? (
                      <TouchableOpacity
                        style={{
                          backgroundColor: tokens.accent,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                        disabled={isPendingThis}
                        onPress={() => handleVerifyOne(player.uid, player.display_name || 'le joueur')}
                      >
                        {isPendingThis ? (
                          <ActivityIndicator size="small" color="#000" />
                        ) : (
                          <ClubText
                            variant="caption"
                            style={{ color: '#000', fontWeight: '800', fontSize: 11 }}
                          >
                            Valider
                          </ClubText>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ClubSectionCard>
      </ClubChapterScroll>

      {/* Modal d'import Footclubs FFF */}
      <Modal
        visible={importModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setImportModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: tokens.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '85%',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <ClubText variant="title" style={{ fontSize: 18, fontWeight: '800' }}>
                Importer depuis Footclubs (FFF)
              </ClubText>
              <TouchableOpacity onPress={() => setImportModalOpen(false)}>
                <Icon name="close" size={20} color={tokens.foreground} />
              </TouchableOpacity>
            </View>

            <ClubText variant="caption" muted style={{ marginBottom: 14 }}>
              Collez le contenu de votre fichier CSV exporté depuis Footclubs ou sélectionnez le
              fichier depuis votre appareil.
            </ClubText>

            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: tokens.accent,
                borderStyle: 'dashed',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginBottom: 14,
              }}
              onPress={handlePickFile}
            >
              <Icon name="document" size={18} color={tokens.accent} />
              <ClubText variant="section" style={{ fontSize: 13, color: tokens.accent }}>
                Sélectionner un fichier CSV sur l'appareil
              </ClubText>
            </TouchableOpacity>

            <ClubText variant="label" muted style={{ marginBottom: 6 }}>
              Ou collez le texte CSV directement :
            </ClubText>
            <TextInput
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: 12,
                color: '#fff',
                fontSize: 12,
                height: 110,
                textAlignVertical: 'top',
                fontFamily: 'monospace',
                marginBottom: 14,
              }}
              placeholder="Numéro Licence;Nom;Prénom;Catégorie;Email..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              value={csvText}
              onChangeText={handleCsvChange}
            />

            {parseError ? (
              <ClubText variant="caption" style={{ color: '#F87171', marginBottom: 12 }}>
                {parseError}
              </ClubText>
            ) : null}

            {/* Aperçu */}
            {parsedRows.length > 0 ? (
              <View
                style={{
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(52, 211, 153, 0.3)',
                  marginBottom: 16,
                }}
              >
                <ClubText variant="section" style={{ color: '#34D399', fontSize: 13 }}>
                  ✓ {parsedRows.length} licencié(s) prêt(s) à être importé(s)
                </ClubText>
                <ClubText variant="caption" muted style={{ marginTop: 2 }}>
                  Exemple : {parsedRows.slice(0, 3).map((r) => r.displayName).join(', ')}...
                </ClubText>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                }}
                onPress={() => setImportModalOpen(false)}
              >
                <ClubText variant="section" style={{ fontSize: 14 }}>
                  Annuler
                </ClubText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 2,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: tokens.accent,
                  alignItems: 'center',
                  opacity: parsedRows.length > 0 && !isImporting ? 1 : 0.5,
                }}
                disabled={parsedRows.length === 0 || isImporting}
                onPress={handleExecuteImport}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <ClubText
                    variant="section"
                    style={{ fontSize: 14, color: '#000', fontWeight: '800' }}
                  >
                    Confirmer l'import ({parsedRows.length})
                  </ClubText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function ClubFinancesScreen() {
  const ws = useClubWorkspace();
  return <ClubFinanceLedgerPanel clubId={ws.clubId} />;
}

export function ClubSponsoringScreen() {
  const shellNav = useClubShellNav();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [dossierOpen, setDossierOpen] = useState(false);

  const packages = [
    { title: 'Sponsor Titre / Maillot', price: '2 500 € / an', desc: 'Logo principal face avant maillots + visibilité match day', tone: '#FBBF24' },
    { title: 'Sponsor Équipement / Veste', price: '1 200 € / an', desc: 'Logo manche ou dos + bannières stade', tone: '#60A5FA' },
    { title: 'Partenaire Local & Événementiel', price: '500 € / an', desc: 'Présence tournois club, page web vitrine et réseaux', tone: '#34D399' },
  ];

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title="Sponsoring & Partenariats" subtitle="Offres de visibilité, packages maillots et mécénat club" />

        <ClubSectionCard title="Packages de Visibilité Club">
          {packages.map((pkg, i) => (
            <View key={pkg.title} style={{ padding: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, marginTop: i > 0 ? 10 : 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <ClubText variant="section" style={{ fontSize: 14, color: pkg.tone, fontWeight: '800' }}>
                  {pkg.title}
                </ClubText>
                <ClubText variant="section" style={{ fontSize: 13, fontWeight: '700' }}>
                  {pkg.price}
                </ClubText>
              </View>
              <ClubText variant="caption" muted>{pkg.desc}</ClubText>
            </View>
          ))}
        </ClubSectionCard>

        <ClubSectionCard title="Dossier & Pilotage Partenaires">
          <ClubText variant="body" muted>
            Les entreprises locales et mécènes peuvent souscrire directement via le dossier officiel de votre structure.
          </ClubText>
          <ClubActionRow
            icon="gift"
            label="Consulter le dossier de sponsoring club"
            hint="Plaquette partenaires, chiffres clés et fiscalité mécénat"
            onPress={() => setDossierOpen(true)}
          />
          <ClubActionRow
            icon="bag"
            label="Trésorerie & Suivi des cotisations"
            hint="Consulter les versements et encaissements sponsors"
            onPress={() => shellNav?.requestNav('finances')}
          />
          <ClubActionRow
            icon="chat"
            label="Communication & Diffusion partenaires"
            hint="Canaux officiels pour valoriser vos sponsors"
            onPress={() => shellNav?.requestNav('communication')}
          />
        </ClubSectionCard>
      </ClubChapterScroll>

      {/* Modal Dossier Sponsoring */}
      <Modal
        visible={dossierOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDossierOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: tokens.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '90%',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View>
                <ClubText variant="title" style={{ fontSize: 18, fontWeight: '800' }}>
                  Dossier Sponsoring Club
                </ClubText>
                <ClubText variant="caption" muted>
                  {ws.club?.name || 'Votre Club'} · Présentation Partenaires
                </ClubText>
              </View>
              <TouchableOpacity onPress={() => setDossierOpen(false)}>
                <Icon name="close" size={20} color={tokens.foreground} />
              </TouchableOpacity>
            </View>

            {/* Chiffres clés */}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                backgroundColor: 'rgba(255,255,255,0.04)',
                padding: 12,
                borderRadius: 12,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ClubText variant="title" style={{ color: tokens.accent, fontSize: 18, fontWeight: '800' }}>
                  {ws.players.length}
                </ClubText>
                <ClubText variant="caption" muted style={{ fontSize: 11 }}>
                  Licenciés
                </ClubText>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ClubText variant="title" style={{ color: tokens.accent, fontSize: 18, fontWeight: '800' }}>
                  {ws.teams.length}
                </ClubText>
                <ClubText variant="caption" muted style={{ fontSize: 11 }}>
                  Équipes
                </ClubText>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ClubText variant="title" style={{ color: tokens.accent, fontSize: 18, fontWeight: '800' }}>
                  {ws.events.length}
                </ClubText>
                <ClubText variant="caption" muted style={{ fontSize: 11 }}>
                  Événements
                </ClubText>
              </View>
            </View>

            {/* Fiscalité mécénat */}
            <View
              style={{
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                padding: 12,
                borderRadius: 10,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: 'rgba(52, 211, 153, 0.3)',
              }}
            >
              <ClubText variant="section" style={{ color: '#34D399', fontSize: 13, fontWeight: '800' }}>
                Avantage fiscal mécénat : 60% déductible
              </ClubText>
              <ClubText variant="caption" muted style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                Article 238 bis du Code Général des Impôts : les dons des entreprises ouvrent droit à une réduction d'impôt sur les sociétés de 60%.
              </ClubText>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: tokens.accent,
                paddingVertical: 13,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 8,
              }}
              onPress={() => {
                setDossierOpen(false);
                Alert.alert(
                  'Dossier Partenaire',
                  `Plaquette du club ${ws.club?.name || ''} prête. Transmettez ce récapitulatif avec vos packages (${packages.map((p) => p.title).join(', ')}) aux entreprises de votre bassin.`,
                );
              }}
            >
              <ClubText variant="section" style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>
                Télécharger / Partager le récapitulatif
              </ClubText>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
              onPress={() => setDossierOpen(false)}
            >
              <ClubText variant="section" style={{ fontSize: 13 }}>
                Fermer
              </ClubText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function ClubNotificationsScreen() {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const tabNav = useTabNavigation();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<StaffNotification[]>([]);

  const load = useCallback(async () => {
    if (!profile?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await staffNotificationsService.listForUser(profile.uid, 40);
      const filtered = ws.clubId
        ? list.filter((n) => !n.club_id || n.club_id === ws.clubId)
        : list;
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  }, [profile?.uid, ws.clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNotif = async (n: StaffNotification) => {
    try {
      if (!n.read_at) await staffNotificationsService.markRead(n.id);
    } catch {
      // best-effort
    }
    const route = staffNotificationRoute(n);
    if (route.kind === 'event') {
      tabNav.openMatchs({
        eventId: route.eventId,
        hubChapter: route.hubChapter,
      });
    } else if (route.kind === 'clubNav') {
      shellNav?.requestNav(route.nav);
    }
    void load();
  };

  const markAll = async () => {
    const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setBusy(true);
    try {
      await staffNotificationsService.markManyRead(unreadIds);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const unread = items.filter((n) => !n.read_at).length;
  const subtitle = staffNotifsSubtitle(unread, items.length);

  if (loading && items.length === 0) {
    return (
      <View style={styles.root}>
        <ClubLoading />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={loading || busy} onRefresh={() => void load()}>
        <ClubBrandHeader title="Notifications" subtitle={subtitle} />

        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('communication')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="chat" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Messages
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.requestNav('players')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="people" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Joueurs
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => void markAll()}
            disabled={unread === 0 || busy}
            scaleTo={0.97}
            haptic
            style={[styles.shortcut, unread === 0 ? styles.shortcutDisabled : null]}
          >
            <Icon name="checkmark-circle" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Tout lire
            </ClubText>
          </PressableSpring>
        </View>

        <ClubNotifDeliveryNote text={STAFF_NOTIF_DELIVERY_HINT} />

        {items.length === 0 ? (
          <ClubEmptyState
            title="Aucune alerte pour l’instant"
            body="Adhésions, invitations inter-clubs, absences et retards apparaîtront ici. Les rappels match restent locaux sur cet appareil."
            actionLabel="Ouvrir Communication"
            onAction={() => shellNav?.requestNav('communication')}
            icon="notifications"
          />
        ) : (
          <View style={styles.list}>
            <View style={styles.listHead}>
              <ClubText variant="label" muted style={styles.listLabel}>
                Inbox
              </ClubText>
              <ClubText variant="caption" muted>
                {items.length}
              </ClubText>
            </View>
            {items.map((n, index) => (
              <ClubNotifListCard
                key={n.id}
                item={n}
                index={index}
                onPress={() => void openNotif(n)}
              />
            ))}
          </View>
        )}
      </ClubChapterScroll>
    </View>
  );
}

const ROLE_ROWS: { id: ClubVisibilityRoleId; label: string; hint: string }[] = [
  { id: 'admin', label: 'Admin', hint: 'Tout le club' },
  { id: 'dirigeant', label: 'Dirigeant', hint: 'Pilotage & validation' },
  { id: 'ds', label: 'DS', hint: 'Direction sportive' },
  { id: 'coach', label: 'Coach', hint: 'Équipe(s) affectée(s)' },
  { id: 'assistant', label: 'Assistant', hint: 'Aide coach' },
];

export function ClubPermissionsScreen() {
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [prefs, setPrefs] = useState<ClubRoleVisibilityPrefs | null>(null);

  useEffect(() => {
    if (!ws.clubId) {
      setPrefs(null);
      return;
    }
    void clubRoleVisibilityService.load(ws.clubId).then(setPrefs);
  }, [ws.clubId]);

  const toggle = async (role: ClubVisibilityRoleId, value: boolean) => {
    if (!ws.clubId) {
      Alert.alert('Club requis', 'Liez un club pour enregistrer les permissions.');
      return;
    }
    const next = await clubRoleVisibilityService.setRole(ws.clubId, role, value);
    setPrefs(next);
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title="Permissions" subtitle="Visibilité documents par rôle" />
        <ClubSectionCard>
          {ROLE_ROWS.map((r) => (
            <View key={r.id} style={styles.switchRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ClubText variant="body" style={{ fontWeight: '600' }}>
                  {r.label}
                </ClubText>
                <ClubText variant="caption" muted>
                  {r.hint}
                </ClubText>
              </View>
              <Switch
                value={prefs?.[r.id] ?? true}
                onValueChange={(v) => void toggle(r.id, v)}
                disabled={!ws.clubId || prefs == null}
              />
            </View>
          ))}
        </ClubSectionCard>
        <ClubText variant="caption" muted>
          Préférences enregistrées localement pour ce club. Pas de dossier médical. Les données
          sensibles restent gated selon le rôle compte.
        </ClubText>
      </ClubChapterScroll>
    </View>
  );
}

export function renderClubSecondaryStub(id: ClubNavItemId): React.ReactNode | null {
  switch (id) {
    case 'events':
      return <ClubEventsScreen />;
    case 'licenses':
      return <ClubLicensesScreen />;
    case 'finances':
      return <ClubFinancesScreen />;
    case 'sponsoring':
      return <ClubSponsoringScreen />;
    case 'notifications':
      return <ClubNotificationsScreen />;
    case 'permissions':
      return <ClubPermissionsScreen />;
    case 'video':
      return <ClubVideoScreen />;
    default:
      return null;
  }
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 8,
    },
    shortcutRow: {
      flexDirection: 'row',
      gap: clubSpace.sm,
      marginBottom: clubSpace.sm,
    },
    shortcut: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
    shortcutDisabled: { opacity: 0.45 },
    shortcutLabel: {
      color: tokens.foreground,
      fontWeight: '800',
    },
    list: { gap: clubSpace.sm, marginTop: clubSpace.md },
    listHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    listLabel: {
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontSize: 11,
    },
  });

import { Platform, Alert } from 'react-native';

/** Ouvre le CV HTML (web : nouvel onglet + impression ; mobile : message). */
export function openPlayerCvHtml(html: string, displayName: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
    } else {
      Alert.alert(
        'CV joueur',
        'Autorisez les pop-ups pour afficher le CV, puis Imprimer → PDF.'
      );
    }
    return;
  }

  Alert.alert(
    'CV joueur',
    `Le CV de ${displayName} s’exporte en PDF depuis la version web (Profil → Exporter le CV → Imprimer → PDF).`
  );
}

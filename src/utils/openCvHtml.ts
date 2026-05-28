import { Platform, Alert } from 'react-native';

/** Ouvre du HTML imprimable (web : nouvel onglet). */
export function openPrintableHtml(html: string, title: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
    } else {
      Alert.alert(title, 'Autorisez les pop-ups, puis Imprimer → PDF.');
    }
    return;
  }
  Alert.alert(title, 'Export PDF disponible depuis la version web (Imprimer → PDF).');
}

/** Ouvre le CV HTML (web : nouvel onglet + impression ; mobile : message). */
export function openPlayerCvHtml(html: string, displayName: string): void {
  openPrintableHtml(html, `CV — ${displayName}`);
}

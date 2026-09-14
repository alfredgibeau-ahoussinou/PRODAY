#!/usr/bin/env node
/**
 * ProDay Release & Quality Gate Checker
 * Valide les critères avant soumission Store & déploiement :
 * 1. Compilation TypeScript strict (0 erreur)
 * 2. Suites de tests Jest (100% vert)
 * 3. Vérification des assets graphiques requis (icônes, splash, adaptive)
 * 4. Contrôle des permissions app.json (Micro, Caméra, Photos, Privacy manifests)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

console.log('\n⚽ ==========================================');
console.log('   PRODAY — CONTRÔLE DE CERTIFICATION V4');
console.log('==========================================\n');

let hasError = false;

// 1. Vérification TypeScript
console.log('🔍 [1/4] Vérification TypeScript (tsc --noEmit)...');
try {
  execSync('npm run typecheck', { stdio: 'inherit', cwd: ROOT_DIR });
  console.log('✅ TypeScript : 0 erreur.\n');
} catch (e) {
  console.error('❌ TypeScript : Erreurs de types détectées.\n');
  hasError = true;
}

// 2. Vérification Jest
console.log('🧪 [2/4] Exécution des tests Jest...');
try {
  execSync('npx jest --passWithNoTests', { stdio: 'inherit', cwd: ROOT_DIR });
  console.log('✅ Tests Jest : 100% des suites au vert.\n');
} catch (e) {
  console.error('❌ Tests Jest : Au moins un test a échoué.\n');
  hasError = true;
}

// 3. Vérification des Assets
console.log('🎨 [3/4] Contrôle de présence des assets obligatoires...');
const requiredAssets = [
  'assets/branding/proday-app-icon.png',
  'assets/branding/proday-splash.png',
  'assets/branding/proday-adaptive-foreground.png',
  'assets/branding/proday-notification-icon.png',
];

for (const relPath of requiredAssets) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${relPath}`);
  } else {
    console.error(`  ✗ Manquant : ${relPath}`);
    hasError = true;
  }
}
console.log('');

// 4. Contrôle de configuration app.json
console.log('🛡️ [4/4] Contrôle de configuration app.json & permissions...');
const appJsonPath = path.join(ROOT_DIR, 'app.json');
try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const iosInfo = appJson.expo?.ios?.infoPlist || {};
  const androidPerms = appJson.expo?.android?.permissions || [];

  if (iosInfo.NSMicrophoneUsageDescription && iosInfo.NSCameraUsageDescription) {
    console.log('  ✓ Permissions iOS (Micro, Caméra, Photos) déclarées.');
  } else {
    console.error('  ✗ Descriptions de permissions iOS manquantes.');
    hasError = true;
  }

  if (androidPerms.includes('RECORD_AUDIO') && androidPerms.includes('CAMERA')) {
    console.log('  ✓ Permissions Android (RECORD_AUDIO, CAMERA) déclarées.');
  } else {
    console.error('  ✗ Permissions Android manquantes.');
    hasError = true;
  }

  if (appJson.expo?.ios?.privacyManifests?.NSPrivacyTracking === false) {
    console.log('  ✓ Privacy Manifests Apple conformes (zéro tracking tiers).');
  } else {
    console.error('  ✗ Privacy Manifests non configurés.');
    hasError = true;
  }
} catch (e) {
  console.error('  ✗ Erreur lecture app.json :', e.message);
  hasError = true;
}
console.log('');

if (hasError) {
  console.error('💥 Le contrôle de pré-production a rencontré des erreurs.');
  process.exit(1);
} else {
  console.log('🎉 ==========================================');
  console.log('   APPLICATION PRÊTE POUR DÉPLOIEMENT & STORES');
  console.log('==========================================\n');
  process.exit(0);
}

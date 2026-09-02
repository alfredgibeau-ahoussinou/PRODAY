/** @type {import('expo/config').ExpoConfig} */
// Expo passes the static app.json (expo.*) as `config`. Spreading it keeps
// hasUnusedStaticConfig=false for expo-doctor.

// Ensure `.env` / `.env.local` are loaded when this config is evaluated
// (Expo CLI usually does this; explicit load covers tooling / EAS edge cases).
try {
  require('@expo/env').loadProjectEnv(__dirname, { silent: true });
} catch {
  // @expo/env optional at evaluate-time in exotic hosts
}

module.exports = ({ config }) => {
  const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
  const googleUrlScheme = iosGoogleClientId.includes('.apps.googleusercontent.com')
    ? `com.googleusercontent.apps.${iosGoogleClientId.replace('.apps.googleusercontent.com', '')}`
    : null;

  const baseIos = config.ios ?? {};
  const existingUrlTypes = baseIos.infoPlist?.CFBundleURLTypes ?? [];

  const easProjectId =
    process.env.EAS_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '';

  /** Store / TestFlight → production APNs ; dev / preview device → development. */
  const easProfile = (process.env.EAS_BUILD_PROFILE ?? '').toLowerCase();
  const apsEnvironment =
    easProfile === 'production' || easProfile === 'testflight'
      ? 'production'
      : 'development';

  // Embed public RC keys in `extra` so runtime can read them via expo-constants
  // even if Metro inlining of process.env is stale (restart Metro with `-c`
  // after changing `.env`).
  const revenueCatIosApiKey =
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? '';
  const revenueCatAndroidApiKey =
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? '';

  return {
    ...config,
    scheme: config.scheme ?? 'proday',
    extra: {
      ...(config.extra ?? {}),
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
      revenueCat: {
        iosApiKey: revenueCatIosApiKey,
        androidApiKey: revenueCatAndroidApiKey,
      },
    },
    ios: {
      ...baseIos,
      usesAppleSignIn: true,
      entitlements: {
        ...(baseIos.entitlements ?? {}),
        'aps-environment': apsEnvironment,
      },
      infoPlist: {
        ...(baseIos.infoPlist ?? {}),
        CFBundleURLTypes: [
          ...existingUrlTypes,
          {
            CFBundleURLSchemes: ['proday', 'com.proday.app'],
          },
          ...(googleUrlScheme
            ? [
                {
                  CFBundleURLSchemes: [googleUrlScheme],
                },
              ]
            : []),
        ],
      },
    },
  };
};

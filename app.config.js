/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const googleUrlScheme = iosGoogleClientId.includes('.apps.googleusercontent.com')
  ? `com.googleusercontent.apps.${iosGoogleClientId.replace('.apps.googleusercontent.com', '')}`
  : null;

const baseIos = appJson.expo.ios ?? {};
const existingUrlTypes = baseIos.infoPlist?.CFBundleURLTypes ?? [];

const easProjectId =
  process.env.EAS_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '';

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    scheme: appJson.expo.scheme ?? 'proday',
    extra: {
      ...(appJson.expo.extra ?? {}),
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
    ios: {
      ...baseIos,
      usesAppleSignIn: true,
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
  },
});

describe('oauth config', () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  it('utilise le client Web en secours sur iOS', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-client.apps.googleusercontent.com';
    delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;

    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { executionEnvironment: 'standalone' },
      ExecutionEnvironment: { StoreClient: 'storeClient' },
    }));

    const { getGoogleAuthRequestConfig, isGoogleAuthConfigured } =
      require('../config/oauth') as typeof import('../config/oauth');

    expect(getGoogleAuthRequestConfig()).toEqual({
      webClientId: 'web-client.apps.googleusercontent.com',
      iosClientId: 'web-client.apps.googleusercontent.com',
      androidClientId: 'web-client.apps.googleusercontent.com',
    });
    expect(isGoogleAuthConfigured()).toBe(true);
  });
});

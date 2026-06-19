import { resolveAuthGreetingClip } from '../content/authGreetingVideos';

describe('resolveAuthGreetingClip', () => {
  const welcomeUrl = process.env.EXPO_PUBLIC_AUTH_GREETING_WELCOME_VIDEO_URL;
  const goodbyeUrl = process.env.EXPO_PUBLIC_AUTH_GREETING_GOODBYE_VIDEO_URL;

  afterEach(() => {
    if (welcomeUrl) process.env.EXPO_PUBLIC_AUTH_GREETING_WELCOME_VIDEO_URL = welcomeUrl;
    else delete process.env.EXPO_PUBLIC_AUTH_GREETING_WELCOME_VIDEO_URL;
    if (goodbyeUrl) process.env.EXPO_PUBLIC_AUTH_GREETING_GOODBYE_VIDEO_URL = goodbyeUrl;
    else delete process.env.EXPO_PUBLIC_AUTH_GREETING_GOODBYE_VIDEO_URL;
  });

  it('fournit des clips foot intégrés par défaut', () => {
    delete process.env.EXPO_PUBLIC_AUTH_GREETING_WELCOME_VIDEO_URL;
    delete process.env.EXPO_PUBLIC_AUTH_GREETING_GOODBYE_VIDEO_URL;

    const welcome = resolveAuthGreetingClip('welcome');
    const goodbye = resolveAuthGreetingClip('goodbye');

    expect(welcome.video).toEqual(expect.any(Number));
    expect(goodbye.video).toEqual(expect.any(Number));
    expect(welcome.poster).toEqual(expect.any(Number));
    expect(goodbye.poster).toEqual(expect.any(Number));
    expect(welcome.credit).toBe('Mixkit');
  });

  it('priorise une URL vidéo personnalisée', () => {
    process.env.EXPO_PUBLIC_AUTH_GREETING_WELCOME_VIDEO_URL = 'https://cdn.example.com/welcome-ai.mp4';

    const welcome = resolveAuthGreetingClip('welcome');

    expect(welcome.video).toBe('https://cdn.example.com/welcome-ai.mp4');
    expect(welcome.credit).toBe('ProDay');
  });
});

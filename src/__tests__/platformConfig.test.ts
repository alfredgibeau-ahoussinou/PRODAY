import { mapPlatformConfig } from '../utils/platformConfigMap';

describe('platformConfig mapPlatformConfig', () => {
  it('lit maintenance_mode et sante_visio (opt-in)', () => {
    const config = mapPlatformConfig({
      maintenance_mode: true,
      maintenance_message: 'Coupure planifiée',
      feature_flags: { sante_visio: true, mercato: false },
    });
    expect(config.maintenance_mode).toBe(true);
    expect(config.maintenance_message).toBe('Coupure planifiée');
    expect(config.feature_flags.sante_visio).toBe(true);
    expect(config.feature_flags.mercato).toBe(false);
    expect(config.feature_flags.shop).toBe(true);
  });

  it('défaut maintenance off et sante_visio off si absent', () => {
    const config = mapPlatformConfig({});
    expect(config.maintenance_mode).toBe(false);
    expect(config.feature_flags.sante_visio).toBe(false);
  });
});

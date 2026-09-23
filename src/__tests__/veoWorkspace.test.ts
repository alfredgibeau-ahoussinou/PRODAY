import {
  INTEGRATION_LABEL,
  VEO_API,
  VEO_CAPABILITIES,
  VEO_PRODUCTS,
  VIDEO_SECTIONS,
  VEO_CONNECTION_METHODS,
  canManageVideoConnections,
  capabilityBadgeLabel,
  capabilityBadgeTone,
  describeConnectionMethod,
  resolveCameraState,
  resolveStreamState,
  describeVeoConnection,
  libraryVisibilityNote,
  resolveVideoSections,
  toVideoAudienceRole,
} from '../features/video/veoWorkspace';

/**
 * Le modèle encode l'audit Veo (docs/proday-veo-feature-inventory.md). Ces tests
 * verrouillent les faits qui interdisent de présenter une intégration qui n'existe pas.
 */
describe('veoWorkspace — produits distincts, capacités distinctes', () => {
  it('décrit les trois produits Veo sans les confondre', () => {
    const ids = VEO_PRODUCTS.map((p) => p.id);
    expect(ids).toEqual(['veo_go', 'veo_cam', 'veo_platform']);
    // Seuls Go et Cam filment ; la plateforme n'est pas un dispositif de captation.
    expect(VEO_PRODUCTS.find((p) => p.id === 'veo_go')?.captures).toBe(true);
    expect(VEO_PRODUCTS.find((p) => p.id === 'veo_cam')?.captures).toBe(true);
    expect(VEO_PRODUCTS.find((p) => p.id === 'veo_platform')?.captures).toBe(false);
  });

  it('retient que Veo Go ne supporte ni le direct ni les analyses', () => {
    const go = VEO_PRODUCTS.find((p) => p.id === 'veo_go')!;
    expect(go.live).toBe('no');
    expect(go.analytics).toBe('no');
    // …alors que Veo Cam les expose en add-on : la distinction doit rester visible.
    const cam = VEO_PRODUCTS.find((p) => p.id === 'veo_cam')!;
    expect(cam.live).toBe('yes_addon');
    expect(cam.analytics).toBe('yes_addon');
  });

  it('exige un iPhone compatible et iOS 18 pour Veo Go', () => {
    const go = VEO_PRODUCTS.find((p) => p.id === 'veo_go')!;
    expect(go.requirement).toContain('Deux iPhones');
    expect(go.requirement).toContain('iOS 18');
  });
});

describe('veoWorkspace — classement d’intégration', () => {
  const byId = (id: string) => VEO_CAPABILITIES.find((c) => c.id === id)!;

  it('classe le direct en renvoi externe, jamais en intégration', () => {
    // Aucun endpoint de live n'est documenté : un lecteur intégré serait un faux direct.
    expect(byId('live').integration).toBe('handoff');
  });

  it('classe la captation hors de ProDay', () => {
    expect(byId('capture').integration).toBe('handoff');
  });

  it('classe la connexion de compte en dépendance partenaire', () => {
    const connection = byId('account_connection');
    expect(connection.integration).toBe('partner');
    // Le flux documenté demande le mot de passe : cela doit rester écrit.
    expect(connection.requires).toContain('accord produit explicite');
  });

  it('ne classe en `direct` que des capacités réellement documentées par l’API', () => {
    const direct = VEO_CAPABILITIES.filter((c) => c.integration === 'direct').map((c) => c.id);
    expect(direct).toEqual(
      expect.arrayContaining([
        'list_videos',
        'play_video',
        'associate_match',
        'upload_video',
        'processing_state',
        'comments_tags',
      ]),
    );
    // Aucune capacité non documentée ne doit se retrouver en intégration directe.
    expect(direct).not.toContain('live');
    expect(direct).not.toContain('analytics');
  });

  it('expose un libellé pour chaque classe d’intégration', () => {
    for (const capability of VEO_CAPABILITIES) {
      expect(INTEGRATION_LABEL[capability.integration]).toBeTruthy();
    }
  });

  /**
   * « Intégré » est la formulation la plus dangereuse de cet écran : elle se lit comme
   * « ça fonctionne aujourd'hui ». Le libellé doit donc dire l'accès manquant tant que
   * la connexion n'est pas vérifiée.
   */
  describe('libellé honnête des capacités', () => {
    const noAccess = { clientConfigured: false, accountVerified: false };
    const verified = { clientConfigured: true, accountVerified: true };

    it('n’affiche « Intégré » que pour ce qui ne demande aucun accès Veo', () => {
      const prodayOnly = VEO_CAPABILITIES.filter(
        (c) => c.integration === 'direct' && !c.requiresVeoAccess,
      );
      expect(prodayOnly.map((c) => c.id)).toEqual(['associate_match']);
      expect(capabilityBadgeLabel(prodayOnly[0], noAccess)).toBe('Intégré');
    });

    it('écrit l’accès manquant pour une capacité directe non connectée', () => {
      const listVideos = VEO_CAPABILITIES.find((c) => c.id === 'list_videos')!;
      expect(capabilityBadgeLabel(listVideos, noAccess)).toBe('Prêt · accès Veo requis');
      expect(capabilityBadgeTone(listVideos, noAccess)).toBe('warning');
      // Une fois la connexion vérifiée, le même code devient réellement intégré.
      expect(capabilityBadgeLabel(listVideos, verified)).toBe('Intégré');
      expect(capabilityBadgeTone(listVideos, verified)).toBe('success');
    });

    it('ne marque jamais « success » une capacité non connectée', () => {
      for (const capability of VEO_CAPABILITIES) {
        if (capability.requiresVeoAccess && capability.integration === 'direct') {
          expect(capabilityBadgeTone(capability, noAccess)).not.toBe('success');
        }
      }
    });
  });

  /**
   * Le QR existe réellement chez Veo — mais il n’appartient pas à ProDay. Ces tests
   * verrouillent la distinction, pour qu’une prochaine session ne transforme pas cette
   * description en faux scanner.
   */
  describe('connexion : compte, QR Veo Go et caméra en Bluetooth', () => {
    const noClient = { clientConfigured: false, accountVerified: false };
    const verified = { clientConfigured: true, accountVerified: true };

    it('expose exactement trois méthodes distinctes', () => {
      expect(VEO_CONNECTION_METHODS.map((m) => m.id)).toEqual([
        'account',
        'phone_rig_qr',
        'camera_bluetooth',
      ]);
    });

    it('réserve à ProDay la seule méthode qui rattache des captations', () => {
      const prodayMethods = VEO_CONNECTION_METHODS.filter((m) => m.surface === 'proday');
      expect(prodayMethods.map((m) => m.id)).toEqual(['account']);
      expect(prodayMethods[0].connects).toMatch(/Clubhouse/);
    });

    it('décrit le QR Veo Go comme un échange entre les deux iPhones, pas avec ProDay', () => {
      const qr = VEO_CONNECTION_METHODS.find((m) => m.id === 'phone_rig_qr')!;
      expect(qr.surface).toBe('external');
      expect(qr.blockedReason).toMatch(/affiché par le premier iPhone/i);
      expect(qr.blockedReason).toMatch(/scanné par le second/i);
      // Le parcours réel : le QR apparaît après « Start Recording », et « Join Recording » lie les appareils.
      expect(qr.steps.join(' ')).toMatch(/Start Recording/);
      expect(qr.steps.join(' ')).toMatch(/Join Recording/);
      expect(qr.documentation).toContain('support.veo.com');
    });

    it('n’attribue aucun QR à l’association d’une caméra Veo Cam', () => {
      const cam = VEO_CONNECTION_METHODS.find((m) => m.id === 'camera_bluetooth')!;
      expect(cam.surface).toBe('external');
      expect(cam.steps.join(' ')).toMatch(/Bluetooth/);
      expect(cam.steps.join(' ')).not.toMatch(/QR|scanner/i);
      expect(cam.steps.join(' ')).toMatch(/numéro d’identification/);
    });

    it('ne rend jamais exécutable une méthode externe, même avec un compte vérifié', () => {
      for (const method of VEO_CONNECTION_METHODS) {
        if (method.surface !== 'external') continue;
        expect(describeConnectionMethod(method, verified).executable).toBe(false);
        expect(describeConnectionMethod(method, noClient).executable).toBe(false);
      }
    });

    it('n’autorise la connexion du compte qu’avec un client Veo présent', () => {
      const account = VEO_CONNECTION_METHODS.find((m) => m.id === 'account')!;
      expect(describeConnectionMethod(account, noClient)).toMatchObject({
        executable: false,
        tone: 'warning',
      });
      expect(describeConnectionMethod(account, { clientConfigured: true, accountVerified: false }))
        .toMatchObject({ executable: true, tone: 'warning' });
      expect(describeConnectionMethod(account, verified)).toMatchObject({
        executable: true,
        tone: 'success',
      });
    });
  });

  describe('états distincts : compte, caméra, flux', () => {
    it('ne déduit jamais un direct d’un simple enregistrement', () => {
      // Un document `live` encore en cours de téléversement n’est pas un direct.
      expect(resolveStreamState({ kind: 'live', status: 'uploading' })).toBe('starting');
      expect(resolveStreamState({ kind: 'live', status: 'recording' })).toBe('live');
      expect(resolveStreamState({ kind: 'imported', status: 'recording' })).toBe('starting');
      expect(resolveStreamState({ kind: 'replay', status: 'ready' })).toBe('ended');
      expect(resolveStreamState({ status: 'failed' })).toBe('interrupted');
      expect(resolveStreamState(null)).toBe('unavailable');
    });

    it('ne suppose aucune caméra non enregistrée au club', () => {
      expect(resolveCameraState(null)).toBe('unpaired');
      expect(resolveCameraState(undefined)).toBe('unpaired');
      expect(resolveCameraState({ status: 'connected', sync_status: 'ok' })).toBe('paired_available');
      expect(resolveCameraState({ status: 'connected', sync_status: 'idle' })).toBe('paired_offline');
      expect(resolveCameraState({ status: 'error' })).toBe('error');
    });
  });

  it('conserve les faits d’API vérifiés, sans secret', () => {
    expect(VEO_API.grantType).toBe('password');
    expect(VEO_API.tokenEndpoint).toBe('https://tokenapi.veo.co.uk/oauth2/token');
    expect(VEO_API.tokenEndpointUat).toBe('https://tokenapiuat.veo.co.uk/oauth2/token');
    expect(VEO_API.tokenLifetimeSeconds).toBe(1209599);
    expect(VEO_API.provisioning).toContain('représentant Veo');
    expect(VEO_API.documentedResources).toContain('videos');
    // Aucune clé ou secret ne doit être présent dans le modèle.
    const serialized = JSON.stringify(VEO_API);
    expect(serialized).not.toMatch(/secret["']?\s*[:=]\s*["'][A-Za-z0-9]/);
  });
});

describe('veoWorkspace — sections par rôle', () => {
  it('donne au club toutes les sections', () => {
    expect(resolveVideoSections('club').map((s) => s.id)).toEqual([
      'overview',
      'library',
      'clips',
      'live',
      'connections',
    ]);
  });

  it('retire les clips et les connexions au joueur et au parent', () => {
    for (const role of ['player', 'parent']) {
      const ids = resolveVideoSections(role).map((s) => s.id);
      expect(ids).not.toContain('clips');
      expect(ids).not.toContain('connections');
      expect(ids).toContain('library');
    }
  });

  it('laisse le coach voir l’état de connexion sans le gérer', () => {
    expect(resolveVideoSections('coach').map((s) => s.id)).toContain('connections');
    expect(canManageVideoConnections('coach')).toBe(false);
    expect(canManageVideoConnections('club')).toBe(true);
  });

  it('porte une limite explicite sur les sections non intégrées', () => {
    const live = VIDEO_SECTIONS.find((s) => s.id === 'live')!;
    expect(live.mode).toBe('handoff');
    expect(live.limit).toContain('Veo Live');
    const connections = VIDEO_SECTIONS.find((s) => s.id === 'connections')!;
    expect(connections.limit).toContain('mot de passe Veo');
  });

  it('normalise les rôles applicatifs vers une audience vidéo', () => {
    expect(toVideoAudienceRole('president')).toBe('club');
    expect(toVideoAudienceRole('joueur')).toBe('player');
    expect(toVideoAudienceRole('INCONNU')).toBe('player');
    expect(toVideoAudienceRole(null)).toBe('player');
  });

  it('rappelle la règle de partage aux audiences restreintes', () => {
    expect(libraryVisibilityNote('player')).toContain('explicitement partagées');
    expect(libraryVisibilityNote('parent')).toContain('explicitement partagées');
    expect(libraryVisibilityNote('club')).toContain('même source que le pôle Club');
  });
});

describe('veoWorkspace — aucun « Connecté » non vérifié', () => {
  it('ne déclare connecté que sur vérification réelle', () => {
    const connected = describeVeoConnection({ clientConfigured: true, accountVerified: true });
    expect(connected.state).toBe('connected');
  });

  it('ne déclare PAS connecté quand seul le client est présent', () => {
    const clientOnly = describeVeoConnection({ clientConfigured: true, accountVerified: false });
    expect(clientOnly.state).toBe('client_only');
    expect(clientOnly.label).not.toBe('Connecté');
    expect(clientOnly.title).toContain('aucun compte connecté');
  });

  it('reste non configuré sans identifiants, et propose d’en demander', () => {
    const none = describeVeoConnection({ clientConfigured: false, accountVerified: false });
    expect(none.state).toBe('not_configured');
    expect(none.action).toBe('request_access');
    expect(none.body).toContain('représentant Veo');
  });

  it('signale un échec réel plutôt qu’un état neutre', () => {
    const failed = describeVeoConnection({
      clientConfigured: true,
      accountVerified: false,
      lastAttemptFailed: true,
    });
    expect(failed.state).toBe('failed');
    expect(failed.tone).toBe('danger');
    expect(failed.action).toBe('retry');
  });

  it('donne un ton et un libellé distincts à chaque état', () => {
    const states = [
      describeVeoConnection({ clientConfigured: false, accountVerified: false }),
      describeVeoConnection({ clientConfigured: true, accountVerified: false }),
      describeVeoConnection({ clientConfigured: true, accountVerified: false, lastAttemptFailed: true }),
      describeVeoConnection({ clientConfigured: true, accountVerified: true }),
    ];
    expect(new Set(states.map((s) => s.label)).size).toBe(4);
    expect(new Set(states.map((s) => s.tone)).size).toBe(4);
  });
});

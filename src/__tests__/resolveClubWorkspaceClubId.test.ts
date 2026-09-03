import { resolveClubWorkspaceClubId } from '../features/club/hooks/resolveClubWorkspaceClubId';

describe('resolveClubWorkspaceClubId', () => {
  it('priorise profile.club_id', async () => {
    const getByOwner = jest.fn();
    await expect(
      resolveClubWorkspaceClubId({
        profileClubId: 'club-from-profile',
        role: 'club',
        uid: 'u1',
        getByOwner,
      }),
    ).resolves.toEqual({ clubId: 'club-from-profile', shouldBackfill: false });
    expect(getByOwner).not.toHaveBeenCalled();
  });

  it('fallback owner_uid pour rôle club sans club_id (prod)', async () => {
    const getByOwner = jest.fn().mockResolvedValue({ id: 'owned-club' });
    await expect(
      resolveClubWorkspaceClubId({
        profileClubId: null,
        role: 'club',
        uid: 'owner-1',
        getByOwner,
      }),
    ).resolves.toEqual({ clubId: 'owned-club', shouldBackfill: true });
    expect(getByOwner).toHaveBeenCalledWith('owner-1');
  });

  it('ne cherche pas owner hors rôle club', async () => {
    const getByOwner = jest.fn();
    await expect(
      resolveClubWorkspaceClubId({
        profileClubId: null,
        role: 'player',
        uid: 'p1',
        getByOwner,
      }),
    ).resolves.toEqual({ clubId: null, shouldBackfill: false });
    expect(getByOwner).not.toHaveBeenCalled();
  });

  it('reste vide si aucun club propriétaire', async () => {
    const getByOwner = jest.fn().mockResolvedValue(null);
    await expect(
      resolveClubWorkspaceClubId({
        profileClubId: '',
        role: 'club',
        uid: 'owner-2',
        getByOwner,
      }),
    ).resolves.toEqual({ clubId: null, shouldBackfill: false });
  });
});

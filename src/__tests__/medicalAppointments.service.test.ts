jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => null) }));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(),
}));

import { isFirebaseConfigured } from '../config/firebase';
import { medicalAppointmentsService } from '../services/medicalAppointments.service';

const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;

describe('medicalAppointmentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(false);
  });

  it('retourne des listes vides sans Firebase', async () => {
    const from = new Date();
    const to = new Date();
    await expect(medicalAppointmentsService.listForPhysio('physio-1', from, to)).resolves.toEqual(
      []
    );
    await expect(medicalAppointmentsService.listForPatient('patient-1')).resolves.toEqual([]);
  });

  it('rejette les mutations sans Firebase', async () => {
    const physio = {
      uid: 'physio-1',
      display_name: 'Kiné',
      city: 'Lyon',
      profile: {},
    } as Parameters<typeof medicalAppointmentsService.bookAppointment>[0]['physio'];
    const patient = {
      uid: 'patient-1',
      display_name: 'Joueur',
      profile: {},
    } as Parameters<typeof medicalAppointmentsService.bookAppointment>[0]['patient'];

    await expect(
      medicalAppointmentsService.bookAppointment({
        physio,
        patient,
        startAt: new Date(),
      })
    ).rejects.toThrow('Firebase non configuré');

    await expect(
      medicalAppointmentsService.updateStatus('appt-1', 'confirmed')
    ).rejects.toThrow('Firebase non configuré');
  });
});

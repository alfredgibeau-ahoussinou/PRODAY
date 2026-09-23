jest.mock('firebase/firestore', () => ({
  Timestamp: class Timestamp {
    value: Date;
    constructor(value?: Date) {
      this.value = value ?? new Date(0);
    }
    toDate() {
      return this.value;
    }
  },
  GeoPoint: class GeoPoint {},
  doc: jest.fn((_db: unknown, name: string, id: string) => ({ __collection: name, __id: id })),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({ __fake: true })),
}));

jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: {
    getById: jest.fn(),
  },
}));

import { updateDoc } from 'firebase/firestore';
import { transportLogisticsService } from '../services/transportLogistics.service';
import { teamEventsService } from '../services/teamEvents.service';
import type { TeamEvent } from '../models/TeamEvent';
import type { ClubBusPlan } from '../models/TransportLogistics';

const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockGetById = teamEventsService.getById as jest.MockedFunction<typeof teamEventsService.getById>;

function createMockEvent(overrides: Partial<TeamEvent> = {}): TeamEvent {
  return {
    id: 'event-test-1',
    title: 'Match Championnat R1 vs FC Lyon',
    event_type: 'friendly',
    organizer_uid: 'coach-1',
    organizer_name: 'Coach Thomas',
    starts_at: new Date('2026-10-15T14:00:00Z'),
    city: 'Lyon',
    location_label: 'Stade de Gerland',
    invitee_uids: ['player-1', 'player-2', 'player-3', 'player-4'],
    rsvps: {
      'player-1': 'yes',
      'player-2': 'yes',
      'player-3': 'yes',
      'player-4': 'yes',
    },
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function createSampleBus(overrides: Partial<ClubBusPlan> = {}): ClubBusPlan {
  return {
    id: 'bus-101',
    name: 'Bus U17 R1',
    vehicle_type: 'bus',
    capacity: 2, // Petite capacité pour tester la liste d'attente
    staff_in_charge_uid: 'coach-1',
    staff_in_charge_name: 'Coach Thomas',
    staff_in_charge_phone: '0612345678',
    allows_parents: false,
    allows_supporters: false,
    outbound: {
      departure_place: 'Stade Municipal',
      departure_time: '08:00',
      arrival_place: 'Stade de Gerland',
      arrival_time_scheduled: '11:00',
      status: 'scheduled',
      stops: [
        {
          id: 'stop-1',
          name: 'Aire de Mâcon',
          scheduled_time: '09:30',
          order: 1,
        },
      ],
    },
    passengers: [],
    waiting_list: [],
    ...overrides,
  };
}

describe('Transport & Logistics Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Plan Resolution & Fallback (Backward Compatibility)', () => {
    it('initializes default carpool plan if no transport_plan exists', () => {
      const event = createMockEvent({
        carpool_slots: [
          {
            driver_uid: 'driver-1',
            driver_name: 'Lucas Parent',
            seats: 3,
            passengers: [],
          },
        ],
      });

      const plan = transportLogisticsService.resolveTransportPlan(event);
      expect(plan.mode).toBe('carpool_only');
      expect(plan.carpool_slots).toHaveLength(1);
      expect(plan.buses).toEqual([]);
      expect(plan.independent_traveler_uids).toEqual([]);
    });

    it('faithfully preserves structured transport_plan when present', () => {
      const bus = createSampleBus();
      const event = createMockEvent({
        transport_plan: {
          mode: 'mixed',
          buses: [bus],
          independent_traveler_uids: ['player-4'],
          carpool_slots: [],
        },
      });

      const plan = transportLogisticsService.resolveTransportPlan(event);
      expect(plan.mode).toBe('mixed');
      expect(plan.buses).toHaveLength(1);
      expect(plan.buses[0].name).toBe('Bus U17 R1');
      expect(plan.independent_traveler_uids).toContain('player-4');
    });
  });

  describe('2. Mode Configuration', () => {
    it('sets transport mode to bus_only and records audit update', async () => {
      const event = createMockEvent();
      mockGetById.mockResolvedValueOnce(event);

      const updated = await transportLogisticsService.setTransportMode(
        'event-test-1',
        'bus_only',
        'Déplacement groupé en autocar',
        'coach-1'
      );

      expect(updated.transport_plan?.mode).toBe('bus_only');
      expect(updated.transport_plan?.notes).toBe('Déplacement groupé en autocar');
      expect(updated.transport_plan?.updated_by_uid).toBe('coach-1');
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Bus Management (Upsert, Stops & Removal)', () => {
    it('adds a new bus with pickup stops and capacity', async () => {
      const event = createMockEvent();
      mockGetById.mockResolvedValueOnce(event);

      const bus = createSampleBus({ capacity: 45 });
      const updated = await transportLogisticsService.upsertBusPlan(
        'event-test-1',
        bus,
        'coach-1'
      );

      expect(updated.transport_plan?.buses).toHaveLength(1);
      expect(updated.transport_plan?.buses[0].capacity).toBe(45);
      expect(updated.transport_plan?.buses[0].outbound.stops).toHaveLength(1);
      expect(updated.transport_plan?.buses[0].outbound.stops[0].name).toBe('Aire de Mâcon');
    });

    it('removes a bus plan correctly', async () => {
      const bus = createSampleBus();
      const event = createMockEvent({
        transport_plan: {
          mode: 'bus_only',
          buses: [bus],
          independent_traveler_uids: [],
        },
      });
      mockGetById.mockResolvedValueOnce(event);

      const updated = await transportLogisticsService.removeBusPlan(
        'event-test-1',
        'bus-101',
        'coach-1'
      );

      expect(updated.transport_plan?.buses).toHaveLength(0);
    });
  });

  describe('4. Seat Booking & Waiting List', () => {
    it('allows confirmed booking when capacity is available', async () => {
      const bus = createSampleBus({ capacity: 2, passengers: [] });
      const event = createMockEvent({
        transport_plan: {
          mode: 'bus_only',
          buses: [bus],
          independent_traveler_uids: [],
        },
      });
      mockGetById.mockResolvedValueOnce(event);

      const result = await transportLogisticsService.bookBusSeat(
        'event-test-1',
        'bus-101',
        {
          uid: 'player-1',
          name: 'Kylian M.',
          role: 'player',
          booked_at: new Date().toISOString(),
        }
      );

      expect(result.success).toBe(true);
      expect(result.waitlisted).toBe(false);
      expect(result.event.transport_plan?.buses[0].passengers).toHaveLength(1);
      expect(result.event.transport_plan?.buses[0].passengers[0].uid).toBe('player-1');
    });

    it('automatically places passenger on waiting list when bus is full', async () => {
      const bus = createSampleBus({
        capacity: 1,
        passengers: [
          {
            uid: 'player-1',
            name: 'Kylian M.',
            role: 'player',
            booked_at: new Date().toISOString(),
          },
        ],
      });
      const event = createMockEvent({
        transport_plan: {
          mode: 'bus_only',
          buses: [bus],
          independent_traveler_uids: [],
        },
      });
      mockGetById.mockResolvedValueOnce(event);

      const result = await transportLogisticsService.bookBusSeat(
        'event-test-1',
        'bus-101',
        {
          uid: 'player-2',
          name: 'Antoine G.',
          role: 'player',
          booked_at: new Date().toISOString(),
        }
      );

      expect(result.success).toBe(true);
      expect(result.waitlisted).toBe(true);
      expect(result.event.transport_plan?.buses[0].passengers).toHaveLength(1);
      expect(result.event.transport_plan?.buses[0].waiting_list).toHaveLength(1);
      expect(result.event.transport_plan?.buses[0].waiting_list[0].uid).toBe('player-2');
    });

    it('promotes passenger from waiting list when a seat becomes free', async () => {
      const bus = createSampleBus({
        capacity: 2,
        passengers: [
          {
            uid: 'player-1',
            name: 'Kylian M.',
            role: 'player',
            booked_at: new Date().toISOString(),
          },
        ],
        waiting_list: [
          {
            uid: 'player-2',
            name: 'Antoine G.',
            role: 'player',
            requested_at: new Date().toISOString(),
          },
        ],
      });
      const event = createMockEvent({
        transport_plan: {
          mode: 'bus_only',
          buses: [bus],
          independent_traveler_uids: [],
        },
      });
      mockGetById.mockResolvedValueOnce(event);

      const updated = await transportLogisticsService.promoteFromWaitingList(
        'event-test-1',
        'bus-101',
        'player-2'
      );

      const updatedBus = updated.transport_plan?.buses[0];
      expect(updatedBus?.passengers).toHaveLength(2);
      expect(updatedBus?.passengers.some((p) => p.uid === 'player-2')).toBe(true);
      expect(updatedBus?.waiting_list).toHaveLength(0);
    });

    it('blocks unauthorized parents or supporters without staff approval', async () => {
      const bus = createSampleBus({ allows_parents: false });
      const event = createMockEvent({
        transport_plan: {
          mode: 'bus_only',
          buses: [bus],
          independent_traveler_uids: [],
        },
      });
      mockGetById.mockResolvedValueOnce(event);

      await expect(
        transportLogisticsService.bookBusSeat('event-test-1', 'bus-101', {
          uid: 'parent-1',
          name: 'Parent Dubreuil',
          role: 'parent',
          booked_at: new Date().toISOString(),
        })
      ).rejects.toThrow("Ce trajet en bus n'est pas ouvert aux parents sans accord explicite");
    });
  });

  describe('5. Boarding Check-In (Embarquement)', () => {
    it('records outbound and return check-in for passengers', async () => {
      const bus = createSampleBus({
        passengers: [
          {
            uid: 'player-1',
            name: 'Kylian M.',
            role: 'player',
            booked_at: new Date().toISOString(),
            checked_in_outbound: false,
            checked_in_return: false,
          },
        ],
        return_journey: {
          departure_place: 'Stade de Gerland',
          departure_time: '18:00',
          arrival_place: 'Stade Municipal',
          arrival_time_scheduled: '21:00',
          status: 'scheduled',
          stops: [],
        },
      });
      const event = createMockEvent({
        transport_plan: {
          mode: 'bus_only',
          buses: [bus],
          independent_traveler_uids: [],
        },
      });
      mockGetById.mockResolvedValueOnce(event);

      // Check-in outbound
      const updatedOutbound = await transportLogisticsService.checkInPassenger(
        'event-test-1',
        'bus-101',
        'player-1',
        'outbound',
        true
      );
      expect(updatedOutbound.transport_plan?.buses[0].passengers[0].checked_in_outbound).toBe(true);

      mockGetById.mockResolvedValueOnce(updatedOutbound);

      // Check-in return
      const updatedReturn = await transportLogisticsService.checkInPassenger(
        'event-test-1',
        'bus-101',
        'player-1',
        'return',
        true
      );
      expect(updatedReturn.transport_plan?.buses[0].passengers[0].checked_in_return).toBe(true);
    });
  });

  describe('6. Honest Trip Status Tracking (No Fake GPS)', () => {
    it('updates journey status with revised ETA and delay notes without faking GPS', async () => {
      const bus = createSampleBus();
      const event = createMockEvent({
        transport_plan: {
          mode: 'bus_only',
          buses: [bus],
          independent_traveler_uids: [],
        },
      });
      mockGetById.mockResolvedValueOnce(event);

      const updated = await transportLogisticsService.updateTripStatus(
        'event-test-1',
        'bus-101',
        'outbound',
        'delayed',
        'Ralentissements sur autoroute A6',
        '11:45'
      );

      const outbound = updated.transport_plan?.buses[0].outbound;
      expect(outbound?.status).toBe('delayed');
      expect(outbound?.status_note).toBe('Ralentissements sur autoroute A6');
      expect(outbound?.arrival_time_revised).toBe('11:45');
      expect(outbound?.status_updated_at).toBeDefined();
    });
  });

  describe('7. Independent Travel Declaration', () => {
    it('registers player for independent travel', async () => {
      const event = createMockEvent();
      mockGetById.mockResolvedValueOnce(event);

      const updated = await transportLogisticsService.setIndependentTravel(
        'event-test-1',
        'player-3',
        true
      );

      expect(updated.transport_plan?.independent_traveler_uids).toContain('player-3');
    });
  });

  describe('8. Passenger Transport Summary Resolution', () => {
    it('correctly attributes bus, carpool, and independent travel to different participants', () => {
      const bus = createSampleBus({
        passengers: [
          {
            uid: 'player-1',
            name: 'Kylian M.',
            role: 'player',
            pickup_stop_id: 'stop-1',
            seat_number: 14,
            booked_at: new Date().toISOString(),
          },
        ],
      });

      const event = createMockEvent({
        transport_plan: {
          mode: 'mixed',
          buses: [bus],
          independent_traveler_uids: ['player-2'],
        },
        carpool_slots: [
          {
            driver_uid: 'driver-9',
            driver_name: 'Paul Pogba',
            seats: 4,
            passengers: [
              {
                uid: 'player-3',
                name: 'Antoine G.',
                pickup_place: 'Gare Part-Dieu',
                status: 'confirmed',
              },
            ],
          },
        ],
      });

      // Player 1 in bus
      const summary1 = transportLogisticsService.getPassengerTransportSummary(event, 'player-1');
      expect(summary1.type).toBe('bus');
      expect(summary1.bus?.bus_name).toBe('Bus U17 R1');
      expect(summary1.bus?.pickup_stop?.name).toBe('Aire de Mâcon');
      expect(summary1.bus?.seat_number).toBe(14);

      // Player 2 independent
      const summary2 = transportLogisticsService.getPassengerTransportSummary(event, 'player-2');
      expect(summary2.type).toBe('independent');
      expect(summary2.is_independent).toBe(true);

      // Player 3 in carpool
      const summary3 = transportLogisticsService.getPassengerTransportSummary(event, 'player-3');
      expect(summary3.type).toBe('carpool');
      expect(summary3.carpool?.driver_name).toBe('Paul Pogba');
      expect(summary3.carpool?.pickup_place).toBe('Gare Part-Dieu');

      // Player 4 unassigned
      const summary4 = transportLogisticsService.getPassengerTransportSummary(event, 'player-4');
      expect(summary4.type).toBe('none');
    });
  });

  describe('9. Strict Family Privacy in Parent View', () => {
    it('guarantees parent only sees their child info and never exposes other families roster', () => {
      const bus = createSampleBus({
        passengers: [
          {
            uid: 'child-123',
            name: 'Leo Dupont',
            role: 'player',
            pickup_stop_id: 'stop-1',
            seat_number: 7,
            booked_at: new Date().toISOString(),
          },
          {
            uid: 'other-child-999',
            name: 'Secret Kid 999',
            role: 'player',
            notes: 'Données médicales ou privées confidentielles',
            booked_at: new Date().toISOString(),
          },
        ],
      });

      const event = createMockEvent({
        transport_plan: {
          mode: 'bus_only',
          buses: [bus],
          independent_traveler_uids: [],
        },
      });

      const parentView = transportLogisticsService.getParentTransportView(event, 'child-123');

      // Check child info
      expect(parentView.childUid).toBe('child-123');
      expect(parentView.summary.type).toBe('bus');
      expect(parentView.summary.bus?.seat_number).toBe(7);

      // Crucial privacy guarantee: availableBuses does NOT contain passengers or waiting_list!
      expect((parentView.availableBuses[0] as any).passengers).toBeUndefined();
      expect((parentView.availableBuses[0] as any).waiting_list).toBeUndefined();

      // Ensure no leak of other-child-999
      const serialized = JSON.stringify(parentView);
      expect(serialized).not.toContain('other-child-999');
      expect(serialized).not.toContain('Secret Kid 999');
      expect(serialized).not.toContain('Données médicales ou privées confidentielles');
    });
  });
});

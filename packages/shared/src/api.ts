/**
 * Mock API client. In-memory, promise-based, with a tiny subscribe()
 * mechanism so screens can react to ride/location/alert changes. Swap the
 * bodies of these functions for real network calls when the backend exists;
 * the signatures are meant to stay stable.
 *
 * Ride status is tracked per (trip, student) because each child has a status
 * in both the morning and afternoon trips. Whenever a child is marked picked
 * up or dropped off, an alert is generated for their parent automatically.
 */

import { morningTrip, students, studentById, tripById, trips } from './data';
import type { Alert, AlertKind, RideState, RideStatus, Trip, VanLocation } from './types';

type Listener = () => void;

const key = (tripId: string, studentId: string) => `${tripId}:${studentId}`;

const rideStates = new Map<string, RideState>();
const alerts: Alert[] = [];
const listeners = new Set<Listener>();

let location: VanLocation = {
  tripId: morningTrip.id,
  lat: morningTrip.stops[0].lat,
  lng: morningTrip.stops[0].lng,
  headingDeg: 45,
  speedKmh: 0,
  updatedAt: new Date().toISOString(),
};

// Seed every student as "waiting" for every trip of the day.
for (const trip of trips) {
  for (const s of students) {
    rideStates.set(key(trip.id, s.id), {
      studentId: s.id,
      tripId: trip.id,
      status: 'waiting',
      updatedAt: new Date().toISOString(),
    });
  }
}

function emit() {
  for (const l of listeners) l();
}

function wait<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTrips(): Promise<Trip[]> {
  return wait(trips);
}

export function getTrip(tripId: string): Promise<Trip | undefined> {
  return wait(tripById(tripId));
}

export function getRideStates(tripId: string): Promise<RideState[]> {
  return wait(Array.from(rideStates.values()).filter((r) => r.tripId === tripId));
}

export function getRideStatus(tripId: string, studentId: string): RideStatus {
  return rideStates.get(key(tripId, studentId))?.status ?? 'waiting';
}

export function setRideStatus(
  tripId: string,
  studentId: string,
  status: RideStatus,
): Promise<RideState> {
  const next: RideState = {
    studentId,
    tripId,
    status,
    updatedAt: new Date().toISOString(),
  };
  rideStates.set(key(tripId, studentId), next);

  // Notify the parent on every pickup / drop-off action.
  if (status === 'onboard' || status === 'dropped') {
    pushAlert(tripId, studentId, status);
  }
  emit();
  return wait(next);
}

/** Builds a contextual alert for a pickup/drop-off and prepends it. */
function pushAlert(tripId: string, studentId: string, status: 'onboard' | 'dropped') {
  const trip = tripById(tripId);
  const student = studentById(studentId);
  if (!trip || !student) return;

  const wantKind = status === 'onboard' ? 'pickup' : 'dropoff';
  const stop = trip.stops.find((s) => s.kind === wantKind && s.studentIds.includes(studentId));
  const place = stop?.label ?? (status === 'onboard' ? 'the stop' : 'the destination');

  let kind: AlertKind;
  let title: string;
  let body: string;

  if (status === 'onboard') {
    kind = 'picked_up';
    title = 'Picked up';
    body =
      trip.window === 'morning'
        ? `${student.name} was picked up from ${place}.`
        : `${student.name} has boarded the van at school for the ride home.`;
  } else {
    kind = 'dropped_off';
    title = trip.window === 'morning' ? 'Arrived at school' : 'Dropped off';
    body =
      trip.window === 'morning'
        ? `${student.name} was dropped off at school safely.`
        : `${student.name} was dropped off at ${place}.`;
  }

  alerts.unshift({
    id: `alert-${Date.now()}-${studentId}`,
    kind,
    studentId,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
  });
}

export function getVanLocation(): Promise<VanLocation> {
  return wait(location);
}

export function updateVanLocation(partial: Partial<Omit<VanLocation, 'tripId'>>): VanLocation {
  location = { ...location, ...partial, updatedAt: new Date().toISOString() };
  emit();
  return location;
}

// --- Shift lifecycle (driver goes online / offline) -----------------------

const shiftStartedAt = new Map<string, string>();

function tripStudentIds(trip: Trip): string[] {
  const set = new Set<string>();
  for (const stop of trip.stops) for (const id of stop.studentIds) set.add(id);
  return Array.from(set);
}

function homeStopFor(trip: Trip, studentId: string) {
  const kind = trip.window === 'morning' ? 'pickup' : 'dropoff';
  return trip.stops.find((s) => s.kind === kind && s.studentIds.includes(studentId));
}

export function isOnline(tripId: string): boolean {
  return tripById(tripId)?.status === 'in_progress';
}

export function getShiftStartedAt(tripId: string): string | undefined {
  return shiftStartedAt.get(tripId);
}

/** Driver goes online: starts the trip, shares location, notifies parents. */
export function startShift(tripId: string): Promise<void> {
  const trip = tripById(tripId);
  if (!trip || trip.status === 'in_progress') return wait(undefined);

  trip.status = 'in_progress';
  shiftStartedAt.set(tripId, new Date().toISOString());
  location = { ...location, tripId, speedKmh: 28, updatedAt: new Date().toISOString() };

  for (const studentId of tripStudentIds(trip)) {
    const student = studentById(studentId);
    if (!student) continue;
    const stop = homeStopFor(trip, studentId);
    const when = stop ? stop.scheduledAt.slice(11, 16) : '';
    alerts.unshift({
      id: `alert-${Date.now()}-start-${studentId}`,
      kind: 'trip_started',
      studentId,
      title: trip.window === 'morning' ? 'Van on the way' : 'Heading home',
      body:
        trip.window === 'morning'
          ? `The morning van has started. ${student.name} will be picked up${stop ? ` around ${when}` : ''}.`
          : `The van has left school. ${student.name} will be dropped off${stop ? ` around ${when}` : ''}.`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
  emit();
  return wait(undefined);
}

/** Driver ends the shift: stops the trip, stops sharing, notifies parents. */
export function endShift(tripId: string): Promise<void> {
  const trip = tripById(tripId);
  if (!trip) return wait(undefined);

  trip.status = 'completed';
  shiftStartedAt.delete(tripId);
  location = { ...location, speedKmh: 0, updatedAt: new Date().toISOString() };

  for (const studentId of tripStudentIds(trip)) {
    const student = studentById(studentId);
    if (!student) continue;
    alerts.unshift({
      id: `alert-${Date.now()}-end-${studentId}`,
      kind: 'trip_completed',
      studentId,
      title: 'Trip completed',
      body: `${student.name}'s ${trip.window} trip is complete.`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
  emit();
  return wait(undefined);
}

export function getAlerts(): Promise<Alert[]> {
  return wait(alerts);
}

/** Alerts for a specific parent's children. */
export function getAlertsForStudents(studentIds: string[]): Promise<Alert[]> {
  return wait(alerts.filter((a) => studentIds.includes(a.studentId)));
}

export function markAlertRead(id: string): Promise<void> {
  const a = alerts.find((x) => x.id === id);
  if (a) a.read = true;
  emit();
  return wait(undefined);
}

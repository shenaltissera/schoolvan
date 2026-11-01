/**
 * Mock API client. In-memory, promise-based, with a tiny subscribe()
 * mechanism so screens can react to ride/location changes. Swap the bodies
 * of these functions for real network calls when the backend exists; the
 * signatures are meant to stay stable.
 */

import { alerts as seedAlerts, morningTrip, students } from './data';
import type { Alert, RideState, RideStatus, Trip, VanLocation } from './types';

type Listener = () => void;

const rideStates = new Map<string, RideState>();
let location: VanLocation = {
  tripId: morningTrip.id,
  lat: morningTrip.stops[0].lat,
  lng: morningTrip.stops[0].lng,
  headingDeg: 45,
  speedKmh: 0,
  updatedAt: new Date().toISOString(),
};
const alerts: Alert[] = [...seedAlerts];
const listeners = new Set<Listener>();

// Seed every student as "waiting" for the current trip.
for (const s of students) {
  rideStates.set(s.id, {
    studentId: s.id,
    tripId: morningTrip.id,
    status: 'waiting',
    updatedAt: new Date().toISOString(),
  });
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

export function getTodayTrip(): Promise<Trip> {
  return wait(morningTrip);
}

export function getRideStates(): Promise<RideState[]> {
  return wait(Array.from(rideStates.values()));
}

export function getRideStatus(studentId: string): RideStatus {
  return rideStates.get(studentId)?.status ?? 'waiting';
}

export function setRideStatus(studentId: string, status: RideStatus): Promise<RideState> {
  const next: RideState = {
    studentId,
    tripId: morningTrip.id,
    status,
    updatedAt: new Date().toISOString(),
  };
  rideStates.set(studentId, next);
  emit();
  return wait(next);
}

export function getVanLocation(): Promise<VanLocation> {
  return wait(location);
}

export function updateVanLocation(partial: Partial<Omit<VanLocation, 'tripId'>>): VanLocation {
  location = { ...location, ...partial, updatedAt: new Date().toISOString() };
  emit();
  return location;
}

export function getAlerts(): Promise<Alert[]> {
  return wait(alerts);
}

export function markAlertRead(id: string): Promise<void> {
  const a = alerts.find((x) => x.id === id);
  if (a) a.read = true;
  emit();
  return wait(undefined);
}

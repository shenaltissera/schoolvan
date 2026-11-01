/**
 * Core domain models shared between the SchoolVan driver and parent apps.
 */

export type ID = string;

export type UserRole = 'driver' | 'parent';

export interface Driver {
  id: ID;
  name: string;
  phone: string;
  photoUrl?: string;
  vanId: ID;
  licenseNo: string;
}

export interface Parent {
  id: ID;
  name: string;
  phone: string;
  childIds: ID[];
}

export interface Van {
  id: ID;
  plateNo: string;
  model: string;
  capacity: number;
}

/** A child who rides the van. */
export interface Student {
  id: ID;
  name: string;
  grade: string;
  photoUrl?: string;
  parentId: ID;
  stopId: ID;
  /** Pickup/drop-off address shown to the driver. */
  address: string;
}

/** A physical pickup/drop-off point along a route. */
export interface Stop {
  id: ID;
  label: string;
  address: string;
  lat: number;
  lng: number;
  /** Planned arrival time at this stop, ISO 8601. */
  scheduledAt: string;
  studentIds: ID[];
}

export type TripDirection = 'to_school' | 'from_school';

export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/** A single run of a van along a route (e.g. this morning's pickup). */
export interface Trip {
  id: ID;
  routeName: string;
  direction: TripDirection;
  status: TripStatus;
  driverId: ID;
  vanId: ID;
  date: string; // YYYY-MM-DD
  stops: Stop[];
}

/** Per-student status within a trip. */
export type RideStatus =
  | 'waiting'
  | 'onboard'
  | 'dropped'
  | 'absent';

export interface RideState {
  studentId: ID;
  tripId: ID;
  status: RideStatus;
  updatedAt: string;
}

/** Live position of the van, pushed by the driver app. */
export interface VanLocation {
  tripId: ID;
  lat: number;
  lng: number;
  headingDeg: number;
  speedKmh: number;
  updatedAt: string;
}

export type AlertKind =
  | 'trip_started'
  | 'approaching_stop'
  | 'picked_up'
  | 'dropped_off'
  | 'trip_completed'
  | 'delay';

/** A notification surfaced to a parent. */
export interface Alert {
  id: ID;
  kind: AlertKind;
  studentId: ID;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

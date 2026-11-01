/**
 * Seed / mock data. Stands in for the backend until a real API is wired up.
 *
 * A school day has two trips (windows):
 *   - morning:   pick up each child from home, drop them all at school.
 *   - afternoon: pick up everyone from school, drop each child at home or a
 *                designated drop-off point (which may differ from their home).
 */

import type { Driver, Parent, Student, Trip, Van } from './types';

const today = new Date().toISOString().slice(0, 10);
const at = (time: string) => `${today}T${time}`;

export const vans: Van[] = [
  { id: 'van-1', plateNo: 'WP CAB-4471', model: 'Toyota HiAce', capacity: 15 },
];

export const drivers: Driver[] = [
  {
    id: 'driver-1',
    name: 'Nuwan Perera',
    phone: '+94 77 123 4567',
    vanId: 'van-1',
    licenseNo: 'B1234567',
  },
];

export const parents: Parent[] = [
  { id: 'parent-1', name: 'Shenali Fernando', phone: '+94 71 987 6543', childIds: ['stu-1', 'stu-4'] },
  { id: 'parent-2', name: 'Kasun Silva', phone: '+94 76 222 1133', childIds: ['stu-2', 'stu-3'] },
];

export const students: Student[] = [
  {
    id: 'stu-1',
    name: 'Amaya Fernando',
    grade: 'Grade 4',
    parentId: 'parent-1',
    stopId: 'stop-1',
    address: '21 Lake Rd, Rajagiriya',
  },
  {
    id: 'stu-2',
    name: 'Dineth Silva',
    grade: 'Grade 6',
    parentId: 'parent-2',
    stopId: 'stop-2',
    address: '8 Temple Ln, Nugegoda',
  },
  {
    id: 'stu-3',
    name: 'Nethmi Silva',
    grade: 'Grade 2',
    parentId: 'parent-2',
    stopId: 'stop-2',
    address: '8 Temple Ln, Nugegoda',
  },
  {
    id: 'stu-4',
    name: 'Ravindu Fernando',
    grade: 'Grade 5',
    parentId: 'parent-1',
    stopId: 'stop-3',
    address: '45 Hill St, Kotte',
  },
];

const allStudentIds = students.map((s) => s.id);
const SCHOOL = { address: 'Royal College, Colombo 07', lat: 6.9061, lng: 79.8612 };

export const morningTrip: Trip = {
  id: 'trip-am',
  routeName: 'Route A',
  window: 'morning',
  direction: 'to_school',
  status: 'in_progress',
  driverId: 'driver-1',
  vanId: 'van-1',
  date: today,
  stops: [
    {
      id: 'stop-1',
      label: 'Lake Road',
      address: '21 Lake Rd, Rajagiriya',
      lat: 6.9108,
      lng: 79.8946,
      kind: 'pickup',
      scheduledAt: at('06:45:00'),
      studentIds: ['stu-1'],
    },
    {
      id: 'stop-2',
      label: 'Temple Lane',
      address: '8 Temple Ln, Nugegoda',
      lat: 6.8724,
      lng: 79.889,
      kind: 'pickup',
      scheduledAt: at('06:58:00'),
      studentIds: ['stu-2', 'stu-3'],
    },
    {
      id: 'stop-3',
      label: 'Hill Street',
      address: '45 Hill St, Kotte',
      lat: 6.8905,
      lng: 79.903,
      kind: 'pickup',
      scheduledAt: at('07:10:00'),
      studentIds: ['stu-4'],
    },
    {
      id: 'stop-school-am',
      label: 'School',
      address: SCHOOL.address,
      lat: SCHOOL.lat,
      lng: SCHOOL.lng,
      kind: 'dropoff',
      scheduledAt: at('07:30:00'),
      studentIds: allStudentIds,
    },
  ],
};

export const afternoonTrip: Trip = {
  id: 'trip-pm',
  routeName: 'Route A',
  window: 'afternoon',
  direction: 'from_school',
  status: 'scheduled',
  driverId: 'driver-1',
  vanId: 'van-1',
  date: today,
  stops: [
    {
      id: 'stop-school-pm',
      label: 'School',
      address: SCHOOL.address,
      lat: SCHOOL.lat,
      lng: SCHOOL.lng,
      kind: 'pickup',
      scheduledAt: at('13:30:00'),
      studentIds: allStudentIds,
    },
    {
      id: 'stop-4',
      label: 'Lake Road',
      address: '21 Lake Rd, Rajagiriya',
      lat: 6.9108,
      lng: 79.8946,
      kind: 'dropoff',
      scheduledAt: at('13:50:00'),
      studentIds: ['stu-1'],
    },
    {
      id: 'stop-5',
      label: 'Temple Lane',
      address: '8 Temple Ln, Nugegoda',
      lat: 6.8724,
      lng: 79.889,
      kind: 'dropoff',
      scheduledAt: at('14:05:00'),
      studentIds: ['stu-2', 'stu-3'],
    },
    {
      // Designated afternoon drop-off — grandparents', not the morning home.
      id: 'stop-6',
      label: "Grandparents' (designated)",
      address: '12 Flower Rd, Nugegoda',
      lat: 6.8698,
      lng: 79.8995,
      kind: 'dropoff',
      scheduledAt: at('14:18:00'),
      studentIds: ['stu-4'],
    },
  ],
};

/** Both of today's trips, in order. */
export const trips: Trip[] = [morningTrip, afternoonTrip];

export function tripById(id: string): Trip | undefined {
  return trips.find((t) => t.id === id);
}

export function studentById(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

export function studentsAtStop(studentIds: string[]): Student[] {
  return studentIds
    .map(studentById)
    .filter((s): s is Student => Boolean(s));
}

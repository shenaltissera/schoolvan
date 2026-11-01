/**
 * Seed / mock data. Stands in for the backend until a real API is wired up.
 */

import type { Alert, Driver, Parent, Student, Trip, Van } from './types';

const today = new Date().toISOString().slice(0, 10);

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
  { id: 'parent-1', name: 'Shenali Fernando', phone: '+94 71 987 6543', childIds: ['stu-1'] },
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
    name: 'Ravindu Jay',
    grade: 'Grade 5',
    parentId: 'parent-1',
    stopId: 'stop-3',
    address: '45 Hill St, Kotte',
  },
];

export const morningTrip: Trip = {
  id: 'trip-am',
  routeName: 'Route A — Morning',
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
      scheduledAt: `${today}T06:45:00`,
      studentIds: ['stu-1'],
    },
    {
      id: 'stop-2',
      label: 'Temple Lane',
      address: '8 Temple Ln, Nugegoda',
      lat: 6.8724,
      lng: 79.889,
      scheduledAt: `${today}T06:58:00`,
      studentIds: ['stu-2', 'stu-3'],
    },
    {
      id: 'stop-3',
      label: 'Hill Street',
      address: '45 Hill St, Kotte',
      lat: 6.8905,
      lng: 79.903,
      scheduledAt: `${today}T07:10:00`,
      studentIds: ['stu-4'],
    },
  ],
};

export const alerts: Alert[] = [
  {
    id: 'alert-1',
    kind: 'trip_started',
    studentId: 'stu-1',
    title: 'Van on the way',
    body: 'Route A has started. Amaya will be picked up at Lake Road around 6:45 AM.',
    createdAt: `${today}T06:30:00`,
    read: false,
  },
  {
    id: 'alert-2',
    kind: 'approaching_stop',
    studentId: 'stu-1',
    title: 'Arriving soon',
    body: 'The van is about 3 minutes from Lake Road.',
    createdAt: `${today}T06:42:00`,
    read: false,
  },
];

export function studentsForStop(stopId: string): Student[] {
  return students.filter((s) => s.stopId === stopId);
}

export function studentById(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

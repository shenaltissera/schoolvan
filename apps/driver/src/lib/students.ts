import { supabase } from '@/lib/supabase';

export interface Student {
  id: string;
  driverId: string;
  name: string;
  grade: string | null;
  homeAddress: string | null;
  pickupDays: string[];
  dropoffDays: string[];
  createdAt: string;
}

export interface Invite {
  id: string;
  token: string;
  studentId: string;
  status: string;
  acceptedBy: string | null;
}

export interface NewStudent {
  name: string;
  grade?: string;
  homeAddress?: string;
}

function toStudent(row: Record<string, any>): Student {
  return {
    id: row.id,
    driverId: row.driver_id,
    name: row.name,
    grade: row.grade ?? null,
    homeAddress: row.home_address ?? null,
    pickupDays: row.pickup_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
    dropoffDays: row.dropoff_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
    createdAt: row.created_at,
  };
}

/** Weekday code for a date (mon..sun). */
export function weekdayCode(d = new Date()): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
}

function toInvite(row: Record<string, any>): Invite {
  return {
    id: row.id,
    token: row.token,
    studentId: row.student_id,
    status: row.status,
    acceptedBy: row.accepted_by ?? null,
  };
}

export async function listStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toStudent);
}

export async function addStudent(driverId: string, input: NewStudent): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert({
      driver_id: driverId,
      name: input.name.trim(),
      grade: input.grade?.trim() || null,
      home_address: input.homeAddress?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return toStudent(data);
}

export async function listInvites(): Promise<Invite[]> {
  const { data, error } = await supabase.from('invites').select('*');
  if (error) throw error;
  return (data ?? []).map(toInvite);
}

/** Returns the student's existing pending invite, or creates a new one. */
export async function getOrCreateInvite(driverId: string, studentId: string): Promise<Invite> {
  const { data: existing } = await supabase
    .from('invites')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'pending')
    .maybeSingle();
  if (existing) return toInvite(existing);

  const { data, error } = await supabase
    .from('invites')
    .insert({ driver_id: driverId, student_id: studentId })
    .select()
    .single();
  if (error) throw error;
  return toInvite(data);
}

/** Deep link that opens the parent app and binds the parent to the student. */
export function inviteUrl(token: string): string {
  return `schoolvanparent://join?token=${token}`;
}

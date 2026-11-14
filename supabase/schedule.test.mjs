// Guard test: set_ride_schedule may only change the caller's own child.
// Needs the schema applied. Run with a test account:
//   TEST_EMAIL=you@example.com TEST_PASSWORD=... node supabase/schedule.test.mjs
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';

const URL = 'https://vebdnwggtknmgvkdlpss.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmRud2dndGtubWd2a2RscHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxMzc1MTcsImV4cCI6MjEwOTcxMzUxN30.ZXIbZqcNWq743uDRAIRxIfLPqqDMbHaKxwvHbzozkLs';
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;
assert(EMAIL && PASSWORD, 'set TEST_EMAIL and TEST_PASSWORD env vars');

const sb = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: auth, error: ae } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
assert(!ae, ae?.message);
const uid = auth.user.id;

// A driver profile is the FK target for students.
await sb.from('drivers').upsert({ id: uid, driver_name: 'Test', vehicle_number: 'T', association_reg_no: 'T' });

// mine: linked to me as parent. notMine: same driver, no parent linked.
const { data: mine } = await sb.from('students').insert({ driver_id: uid, parent_id: uid, name: 'Mine' }).select().single();
const { data: notMine } = await sb.from('students').insert({ driver_id: uid, name: 'NotMine' }).select().single();

await sb.rpc('set_ride_schedule', { p_student: mine.id, p_pickup: ['mon'], p_dropoff: ['tue'] });
await sb.rpc('set_ride_schedule', { p_student: notMine.id, p_pickup: ['mon'], p_dropoff: ['tue'] });

const { data: m } = await sb.from('students').select('pickup_days').eq('id', mine.id).single();
const { data: n } = await sb.from('students').select('pickup_days').eq('id', notMine.id).single();

try {
  assert.deepEqual(m.pickup_days, ['mon'], 'own child schedule should change');
  assert.deepEqual(n.pickup_days, ['mon', 'tue', 'wed', 'thu', 'fri'], 'non-child must stay at the default');
  console.log('PASS: a parent can only set their own child’s schedule');
} finally {
  await sb.from('students').delete().eq('id', mine.id);
  await sb.from('students').delete().eq('id', notMine.id);
  await sb.auth.signOut();
}

// Guard: a signed-out client can read none of a child's private data.
// Needs the schema applied. Run with a test account:
//   TEST_EMAIL=you@example.com TEST_PASSWORD=... node supabase/rls.test.mjs
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';

const URL = 'https://vebdnwggtknmgvkdlpss.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmRud2dndGtubWd2a2RscHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxMzc1MTcsImV4cCI6MjEwOTcxMzUxN30.ZXIbZqcNWq743uDRAIRxIfLPqqDMbHaKxwvHbzozkLs';
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;
assert(EMAIL && PASSWORD, 'set TEST_EMAIL and TEST_PASSWORD env vars');

const parent = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: auth, error: ae } = await parent.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
assert(!ae, ae?.message);
const uid = auth.user.id;

// Create a child and some private rows owned by this user.
await parent.from('drivers').upsert({ id: uid, driver_name: 'T', vehicle_number: 'T', association_reg_no: 'T' });
const { data: st } = await parent.from('students').insert({ driver_id: uid, parent_id: uid, name: 'Private Kid' }).select().single();
await parent.from('van_locations').upsert({ driver_id: uid, lat: 1, lng: 1, online: true, updated_at: new Date().toISOString() });
await parent.from('alerts').insert({ student_id: st.id, kind: 'picked_up', title: 't', body: 'b' });

const anon = createClient(URL, ANON, { auth: { persistSession: false } });
try {
  const [s, v, a] = await Promise.all([
    anon.from('students').select('id'),
    anon.from('van_locations').select('driver_id'),
    anon.from('alerts').select('id'),
  ]);
  assert.equal(s.data?.length ?? 0, 0, 'signed-out must not read students');
  assert.equal(v.data?.length ?? 0, 0, 'signed-out must not read van locations');
  assert.equal(a.data?.length ?? 0, 0, 'signed-out must not read alerts');
  console.log('PASS: signed-out clients can read no private child data');
} finally {
  await parent.from('alerts').delete().eq('student_id', st.id);
  await parent.from('van_locations').delete().eq('driver_id', uid);
  await parent.from('students').delete().eq('id', st.id);
  await parent.auth.signOut();
}

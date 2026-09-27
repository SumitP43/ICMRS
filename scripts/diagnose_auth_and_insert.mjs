import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vdvfjedjqmetxacwanqa.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log('=== STEP 1 & 2: Diagnostic signInWithPassword ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key Configured:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true }
});

async function runDiagnostic() {
  const email = 'citizen@icmrs.gov';
  const password = 'Citizen123!';

  // Step 2: Call signInWithPassword
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  console.log('\n--- signInWithPassword Result ---');
  console.log('data.user exists:', !!loginData?.user);
  console.log('data.session exists:', !!loginData?.session);
  if (loginData?.user) {
    console.log('user.id:', loginData.user.id);
    console.log('user.email:', loginData.user.email);
    console.log('user.email_confirmed_at:', loginData.user.email_confirmed_at);
  }
  if (loginError) {
    console.log('Authentication error message:', loginError.message);
    console.log('Authentication error status:', loginError.status);
    console.log('Authentication error code:', loginError.code);
  }

  // Step 3: Call getSession immediately after
  console.log('\n=== STEP 3: supabase.auth.getSession() ===');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('getSession session exists:', !!sessionData?.session);
  if (sessionData?.session) {
    console.log('session.user.id:', sessionData.session.user?.id);
    console.log('session.user.id matches logged-in user.id:', sessionData.session.user?.id === loginData?.user?.id);
  }
  if (sessionError) {
    console.log('getSession error:', sessionError.message);
  }

  // Step 4: Call getUser
  console.log('\n=== STEP 4: supabase.auth.getUser() ===');
  const { data: userData, error: getUserError } = await supabase.auth.getUser();
  console.log('getUser user exists:', !!userData?.user);
  if (userData?.user) {
    console.log('getUser user.id:', userData.user.id);
    console.log('getUser user.email:', userData.user.email);
  }
  if (getUserError) {
    console.log('getUser error:', getUserError.message);
  }

  // Step 8: Check if session exists before insert
  console.log('\n=== STEP 8: Session verification before INSERT ===');
  const currentSession = sessionData?.session;
  if (!currentSession) {
    console.log('STOP: NO ACTIVE SUPABASE SESSION');
    return;
  }

  // Step 7: Safe diagnostic version of exact insert payload
  const testId = `#ICMRS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();
  const insertPayload = {
    id: testId,
    complaint_number: testId,
    user_id: currentSession.user.id,
    citizen_name: 'Marcus Vance',
    citizen_email: currentSession.user.email || 'citizen@icmrs.gov',
    title: 'Fallen Tree Limb Test Diagnostic',
    description: 'Large oak tree branch blocking westbound bike lane and pedestrian sidewalk on Outer Circle.',
    category: 'Parks & Forestry',
    status: 'In Progress',
    priority: 'Medium',
    location: 'Outer Circle, Connaught Place (New Delhi 110001)',
    latitude: 28.6315,
    longitude: 77.2167,
    coordinates: { lat: 28.6315, lng: 77.2167 },
    date_time: now,
    department: 'Municipal Parks & Forestry Directorate',
    assigned_officer: 'Elena Vance',
    assigned_crew: 'Rapid Patch Unit',
    pipeline_step: 1,
    pipeline_step_name: 'Step 1 of 5: Telemetry Received & Dispatched',
    pipeline_percent: 20,
    sla_remaining: '24h 00m SLA remaining',
    sla_status: 'nominal',
    total_sla_hours: 24,
    resolution_details: '',
    image_url: null,
    before_image_url: null,
    after_image_url: null,
    attachments: [],
    status_history: [],
    officer_notes: [],
    citizen_token: 'Verified Resident',
  };

  console.log('\n=== STEP 7: Safe Insert Payload ===');
  console.log({
    id: insertPayload.id,
    complaint_number: insertPayload.complaint_number,
    user_id: insertPayload.user_id,
    title: insertPayload.title,
    category: insertPayload.category,
    status: insertPayload.status,
    priority: insertPayload.priority,
    department: insertPayload.department,
    location: insertPayload.location,
    coordinates: insertPayload.coordinates,
  });

  // Step 9 & 10: Perform INSERT using the same client
  console.log('\n=== STEP 9 & 10: Executing INSERT into public.complaints ===');
  const { data: insertResult, error: insertError } = await supabase
    .from('complaints')
    .insert(insertPayload)
    .select();

  console.log('--- INSERT RESPONSE ---');
  if (insertError) {
    console.log('error.code:', insertError.code);
    console.log('error.message:', insertError.message);
    console.log('error.details:', insertError.details);
    console.log('error.hint:', insertError.hint);
  } else {
    console.log('Insert SUCCESS!');
    console.log('Returned rows count:', insertResult?.length);
    console.log('Inserted record ID:', insertResult?.[0]?.id);
    console.log('Inserted record user_id:', insertResult?.[0]?.user_id);
  }

  // Query complaints as this authenticated user
  console.log('\n=== Querying public.complaints as authenticated citizen ===');
  const { data: myComplaints, error: queryError } = await supabase
    .from('complaints')
    .select('id, complaint_number, title, category, status, priority, user_id, created_at');

  if (queryError) {
    console.log('Query error:', queryError.message);
  } else {
    console.log('Complaints visible to this citizen:', myComplaints?.length);
    console.log('Records:', myComplaints);
  }

  // Query civic_heatmap_feed
  console.log('\n=== Querying public.civic_heatmap_feed ===');
  const { data: heatmapData, error: heatError } = await supabase
    .from('civic_heatmap_feed')
    .select('*');

  if (heatError) {
    console.log('Heatmap query error:', heatError.message);
  } else {
    console.log('Heatmap rows count:', heatmapData?.length);
    console.log('Sample heatmap row (redacted):', heatmapData?.[0]);
  }
}

runDiagnostic().catch(console.error);

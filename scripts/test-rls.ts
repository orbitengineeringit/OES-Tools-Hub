#!/usr/bin/env npx tsx
/**
 * scripts/test-rls.ts
 * ───────────────────
 * RLS Verification Script — Company AI Tools Hub
 *
 * Purpose: Programmatically confirm that Supabase Row Level Security
 * policies block cross-user data access as designed in DATABASE.md.
 *
 * Run: npx tsx scripts/test-rls.ts
 *
 * Prerequisites:
 *   1. Two real user accounts exist in your Supabase project (different emails).
 *      Create them via the app's /signup page, or via Supabase Dashboard → Auth.
 *   2. Set these env vars in your shell BEFORE running (never hard-code credentials):
 *
 *      TEST_USER_A_EMAIL=...
 *      TEST_USER_A_PASSWORD=...
 *      TEST_USER_B_EMAIL=...
 *      TEST_USER_B_PASSWORD=...
 *      TEST_UNASSIGNED_TOOL_ID=<UUID of a tool NOT assigned to User A>
 *
 *   All of these are test credentials only — never commit them.
 *
 * Expected results (all PASS means RLS is working correctly):
 *   ✅ User A cannot read User B's profile row
 *   ✅ User A cannot update User B's profile row
 *   ✅ User A cannot read a tool they haven't been granted access to
 *   ✅ User A cannot read any tool_access rows directly
 *   ✅ User A cannot read any audit_log rows directly
 *   ✅ User A cannot insert into tools directly
 *   ✅ User A cannot insert into tool_access directly
 */

import { createClient } from '@supabase/supabase-js'

// ─── Env validation ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const EMAIL_A = process.env.TEST_USER_A_EMAIL
const PASS_A  = process.env.TEST_USER_A_PASSWORD
const EMAIL_B = process.env.TEST_USER_B_EMAIL
const PASS_B  = process.env.TEST_USER_B_PASSWORD
const UNASSIGNED_TOOL_ID = process.env.TEST_UNASSIGNED_TOOL_ID

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env.')
  process.exit(1)
}

if (!EMAIL_A || !PASS_A || !EMAIL_B || !PASS_B || !UNASSIGNED_TOOL_ID) {
  console.error(`
❌ Missing required env vars. Set these before running:
   TEST_USER_A_EMAIL
   TEST_USER_A_PASSWORD
   TEST_USER_B_EMAIL
   TEST_USER_B_PASSWORD
   TEST_UNASSIGNED_TOOL_ID
  `)
  process.exit(1)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function pass(label: string) {
  console.log(`  ✅ PASS  ${label}`)
  passed++
}

function fail(label: string, detail?: unknown) {
  console.error(`  ❌ FAIL  ${label}`)
  if (detail !== undefined) {
    console.error(`         Detail:`, JSON.stringify(detail, null, 2))
  }
  failed++
}

async function loginAs(email: string, password: string) {
  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    console.error(`❌ Could not sign in as ${email}:`, error?.message)
    process.exit(1)
  }
  return client
}

// ─── Test runner ──────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n══════════════════════════════════════')
  console.log('  Company AI Tools Hub — RLS Test')
  console.log('══════════════════════════════════════\n')

  // Sign in as both users
  console.log('► Signing in as User A and User B...')
  const clientA = await loginAs(EMAIL_A!, PASS_A!)
  const clientB = await loginAs(EMAIL_B!, PASS_B!)

  const { data: { user: userA } } = await clientA.auth.getUser()
  const { data: { user: userB } } = await clientB.auth.getUser()

  if (!userA || !userB) {
    console.error('❌ Could not retrieve user objects after login.')
    process.exit(1)
  }

  console.log(`  User A: ${userA.email} (${userA.id.slice(0, 8)}...)`)
  console.log(`  User B: ${userB.email} (${userB.id.slice(0, 8)}...)\n`)

  // ── Section 1: profiles isolation ─────────────────────────────────────────
  console.log('► Section 1: profiles table isolation')

  // 1a. User A reads their OWN profile → must succeed
  {
    const { data, error } = await clientA.from('profiles').select('id, full_name').eq('id', userA.id).single()
    if (error || !data) {
      fail('User A can read their own profile', error)
    } else {
      pass('User A can read their own profile')
    }
  }

  // 1b. User A reads User B's profile → must return null/empty (RLS blocks it)
  {
    const { data, error } = await clientA.from('profiles').select('id, full_name').eq('id', userB.id).single()
    // .single() returns an error with code PGRST116 when RLS filters the row to nothing
    if (data === null && (error?.code === 'PGRST116' || error?.message?.includes('0 rows'))) {
      pass('User A cannot read User B\'s profile (RLS: no rows returned)')
    } else if (!data) {
      pass('User A cannot read User B\'s profile (no data returned)')
    } else {
      fail('User A CAN read User B\'s profile — RLS BREACH', { data, error })
    }
  }

  // 1c. User A tries to UPDATE User B's profile → must fail
  {
    await clientA
      .from('profiles')
      .update({ full_name: 'Hacked Name' })
      .eq('id', userB.id)
    // RLS silently blocks this as 0 rows affected, no Postgres error returned
    // The test is: if no actual DB error and no rows changed, it's a policy-level no-op → PASS
    // If there IS a real DB error (forbidden), also PASS
    // If somehow data got changed: FAIL (caught on re-read)
    const { data: check } = await clientB.from('profiles').select('full_name').eq('id', userB.id).single()
    if (check?.full_name === 'Hacked Name') {
      fail('User A UPDATED User B\'s profile — RLS BREACH', check)
    } else {
      pass('User A cannot update User B\'s profile (no-op or policy block)')
    }
  }

  // ── Section 2: tools isolation ─────────────────────────────────────────────
  console.log('\n► Section 2: tools table isolation')

  // 2a. User A tries to read an unassigned tool → must return null (RLS: no tool_access row)
  {
    const { data, error } = await clientA
      .from('tools')
      .select('id, title')
      .eq('id', UNASSIGNED_TOOL_ID)
      .single()

    if (data === null && (error?.code === 'PGRST116' || error?.message?.includes('0 rows'))) {
      pass('User A cannot read an unassigned tool (RLS: no tool_access row)')
    } else if (!data) {
      pass('User A cannot read an unassigned tool (no data returned)')
    } else {
      fail('User A CAN read an unassigned tool — RLS BREACH', { data, error })
    }
  }

  // 2b. User A tries to INSERT into tools directly → must fail (no insert policy)
  {
    const { error } = await clientA.from('tools').insert({
      title: 'Injected Tool',
      url: 'https://evil.example.com',
      is_active: true,
    })
    if (error) {
      pass('User A cannot insert into tools directly (policy block)')
    } else {
      fail('User A INSERTED into tools directly — RLS BREACH')
    }
  }

  // ── Section 3: tool_access isolation ──────────────────────────────────────
  console.log('\n► Section 3: tool_access table isolation')

  // 3a. User A tries to SELECT from tool_access directly → must return 0 rows (no SELECT policy)
  {
    const { data, error } = await clientA.from('tool_access').select('id').limit(10)
    if (error || !data || data.length === 0) {
      pass('User A cannot read tool_access rows directly (no SELECT policy)')
    } else {
      fail('User A CAN read tool_access rows directly — RLS BREACH', data)
    }
  }

  // 3b. User A tries to INSERT into tool_access → must fail
  {
    const { error } = await clientA.from('tool_access').insert({
      tool_id: UNASSIGNED_TOOL_ID,
      user_id: userA.id,
    })
    if (error) {
      pass('User A cannot insert into tool_access directly (policy block)')
    } else {
      fail('User A INSERTED into tool_access directly — RLS BREACH')
    }
  }

  // ── Section 4: audit_logs isolation ───────────────────────────────────────
  console.log('\n► Section 4: audit_logs table isolation')

  {
    const { data, error } = await clientA.from('audit_logs').select('id').limit(10)
    if (error || !data || data.length === 0) {
      pass('User A cannot read audit_logs directly (no SELECT policy)')
    } else {
      fail('User A CAN read audit_logs directly — RLS BREACH', data)
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════')
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log('══════════════════════════════════════\n')

  if (failed > 0) {
    console.error('🚨 RLS BREACHES DETECTED — review the failures above and fix the policies immediately.')
    console.error('   Log any breach in KNOWN_ISSUES.md with severity: critical.')
    process.exit(1)
  } else {
    console.log('🔒 All RLS policies verified — no cross-user data access possible via the anon client.')
    process.exit(0)
  }
}

runTests().catch((err) => {
  console.error('Unexpected error during RLS tests:', err)
  process.exit(1)
})

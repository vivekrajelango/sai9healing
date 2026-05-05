'use server'

import { revalidatePath } from 'next/cache'
import { createInsforgeServerClient } from '@/lib/insforge-server'
import type { SessionWithRelations } from '@/types/db'

export interface SessionFilters {
  month?: string      // 'YYYY-MM'
  clientId?: string
  paid?: 'paid' | 'unpaid' | 'all'
}

export async function getSessions(filters: SessionFilters = {}): Promise<SessionWithRelations[]> {
  const insforge = createInsforgeServerClient()
  let q = insforge.database
    .from('sessions')
    .select('*, clients(id, name, contact, email), session_types(id, name)')
    .order('session_date', { ascending: false })

  if (filters.month) {
    const [year, month] = filters.month.split('-').map(Number)
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    q = q.gte('session_date', from).lte('session_date', to)
  }
  if (filters.clientId) {
    q = q.eq('client_id', filters.clientId)
  }
  if (filters.paid === 'paid') {
    q = q.eq('balance', 0)
  } else if (filters.paid === 'unpaid') {
    q = q.gt('balance', 0)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as SessionWithRelations[]
}

export async function getRecentSessions(limit = 10): Promise<SessionWithRelations[]> {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('sessions')
    .select('*, clients(id, name, contact, email), session_types(id, name)')
    .order('session_date', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as SessionWithRelations[]
}

export async function createSession(input: {
  client_id: string
  session_type_id: string
  session_date: string
  session_time?: string
  hours: number
  rate: number
  amount_paid: number
  payment_note?: string
}) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('sessions')
    .insert([{
      client_id: input.client_id,
      session_type_id: input.session_type_id,
      session_date: input.session_date,
      session_time: input.session_time ?? null,
      hours: input.hours,
      rate: input.rate,
      amount_paid: input.amount_paid,
      payment_note: input.payment_note ?? null,
    }])
  if (error) throw new Error(error.message)
  revalidatePath('/sessions')
  revalidatePath('/')
}

export async function updateAmountPaid(id: string, amount_paid: number, payment_note?: string) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('sessions')
    .update({ amount_paid, payment_note: payment_note ?? null })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/sessions')
  revalidatePath('/')
}

export async function updateSession(
  id: string,
  input: {
    client_id: string
    session_type_id: string
    session_date: string
    session_time?: string
    hours: number
    rate: number
    amount_paid: number
    payment_note?: string
  }
) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('sessions')
    .update({
      client_id: input.client_id,
      session_type_id: input.session_type_id,
      session_date: input.session_date,
      session_time: input.session_time ?? null,
      hours: input.hours,
      rate: input.rate,
      amount_paid: input.amount_paid,
      payment_note: input.payment_note ?? null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/sessions')
  revalidatePath('/')
  revalidatePath('/clients')
}

export async function deleteSession(id: string) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('sessions')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/sessions')
  revalidatePath('/')
}

export async function getDashboardStats() {
  const insforge = createInsforgeServerClient()

  const now = new Date()
  const monthFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  const [allRes, monthRes] = await Promise.all([
    insforge.database.from('sessions').select('balance, amount_paid, amount_due'),
    insforge.database
      .from('sessions')
      .select('balance, amount_paid, amount_due')
      .gte('session_date', monthFrom)
      .lte('session_date', monthTo),
  ])

  if (allRes.error) throw new Error(allRes.error.message)
  if (monthRes.error) throw new Error(monthRes.error.message)

  const allRows = (allRes.data ?? []) as { balance: string; amount_paid: string; amount_due: string }[]
  const monthRows = (monthRes.data ?? []) as { balance: string; amount_paid: string }[]

  return {
    totalOutstanding: allRows.reduce((s, r) => s + parseFloat(r.balance ?? '0'), 0),
    sessionsThisMonth: monthRows.length,
    collectedThisMonth: monthRows.reduce((s, r) => s + parseFloat(r.amount_paid ?? '0'), 0),
  }
}

export async function getOutstandingClients() {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('sessions')
    .select('client_id, balance, session_date, clients(id, name, contact, email)')
    .gt('balance', 0)
    .order('session_date', { ascending: false })
  if (error) throw new Error(error.message)

  type OutstandingRow = {
    client_id: string
    balance: string
    session_date: string
    clients: { id: string; name: string } | { id: string; name: string }[]
  }
  const rows = (data ?? []) as unknown as OutstandingRow[]

  const map = new Map<string, { id: string; name: string; balance: number; last_session_date: string }>()
  for (const row of rows) {
    const existing = map.get(row.client_id)
    const bal = parseFloat(row.balance ?? '0')
    if (!existing) {
      map.set(row.client_id, {
        id: row.client_id,
        name: (Array.isArray(row.clients) ? row.clients[0]?.name : row.clients?.name) ?? 'Unknown',
        balance: bal,
        last_session_date: row.session_date,
      })
    } else {
      existing.balance += bal
    }
  }

  return Array.from(map.values()).sort((a, b) => b.balance - a.balance)
}

import Link from 'next/link'
import { createInsforgeServerClient } from '@/lib/insforge-server'
import { formatCurrency } from '@/lib/format'
import { ClientRowActions } from '@/components/clients/client-row-actions'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import type { Client } from '@/types/db'

export const dynamic = 'force-dynamic'

interface ClientRow extends Client {
  total_billed: number
  total_paid: number
  balance: number
}

async function getClientsWithTotals(): Promise<ClientRow[]> {
  const insforge = createInsforgeServerClient()
  const { data: clients, error: clientErr } = await insforge.database
    .from('clients')
    .select('*')
    .order('name', { ascending: true })
  if (clientErr) throw new Error(clientErr.message)

  const { data: sessions, error: sessErr } = await insforge.database
    .from('sessions')
    .select('client_id, amount_due, amount_paid, balance')
  if (sessErr) throw new Error(sessErr.message)

  const totals = new Map<string, { total_billed: number; total_paid: number; balance: number }>()
  for (const s of sessions ?? []) {
    const existing = totals.get(s.client_id) ?? { total_billed: 0, total_paid: 0, balance: 0 }
    existing.total_billed += parseFloat(s.amount_due ?? '0')
    existing.total_paid += parseFloat(s.amount_paid ?? '0')
    existing.balance += parseFloat(s.balance ?? '0')
    totals.set(s.client_id, existing)
  }

  return (clients ?? []).map((c) => ({
    ...(c as Client),
    ...(totals.get(c.id) ?? { total_billed: 0, total_paid: 0, balance: 0 }),
  }))
}

export default async function ClientsPage() {
  const clients = await getClientsWithTotals()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <AddClientDialog />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No clients yet. Add a session with a new client to get started.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
                <th className="px-4 py-3 text-right font-medium">Total Billed</th>
                <th className="px-4 py-3 text-right font-medium">Total Paid</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.contact ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.total_billed)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{formatCurrency(c.total_paid)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${c.balance > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {formatCurrency(c.balance)}
                  </td>
                  <td className="px-4 py-3">
                    <ClientRowActions client={c} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

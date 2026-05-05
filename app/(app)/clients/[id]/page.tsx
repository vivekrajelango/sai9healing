import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createInsforgeServerClient } from '@/lib/insforge-server'
import { formatCurrency, formatDate } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientDetailActions } from '@/components/clients/client-detail-actions'
import type { Client, SessionWithRelations } from '@/types/db'

export const dynamic = 'force-dynamic'

async function getClientData(id: string) {
  const insforge = createInsforgeServerClient()

  const [clientRes, sessionsRes] = await Promise.all([
    insforge.database.from('clients').select('*').eq('id', id).maybeSingle(),
    insforge.database
      .from('sessions')
      .select('*, clients(id, name), session_types(id, name)')
      .eq('client_id', id)
      .order('session_date', { ascending: false }),
  ])

  if (clientRes.error) throw new Error(clientRes.error.message)
  if (sessionsRes.error) throw new Error(sessionsRes.error.message)

  return {
    client: clientRes.data as Client | null,
    sessions: (sessionsRes.data ?? []) as SessionWithRelations[],
  }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { client, sessions } = await getClientData(id)

  if (!client) notFound()

  const totalBilled = sessions.reduce((s, r) => s + parseFloat(r.amount_due ?? '0'), 0)
  const totalPaid = sessions.reduce((s, r) => s + parseFloat(r.amount_paid ?? '0'), 0)
  const balance = totalBilled - totalPaid

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/clients"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Clients
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          {client.contact && (
            <p className="text-sm text-muted-foreground mt-0.5">{client.contact}</p>
          )}
        </div>
        <ClientDetailActions client={client} />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalBilled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session History ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No sessions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Hours</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Rate</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Due</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Paid</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Balance</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const bal = parseFloat(s.balance ?? '0')
                    const isPaid = bal <= 0
                    return (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 whitespace-nowrap">{formatDate(s.session_date)}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{s.session_types?.name ?? '—'}</td>
                        <td className="py-2.5 pr-4 text-right">{parseFloat(s.hours).toFixed(2)}</td>
                        <td className="py-2.5 pr-4 text-right">{formatCurrency(s.rate)}</td>
                        <td className="py-2.5 pr-4 text-right">{formatCurrency(s.amount_due)}</td>
                        <td className="py-2.5 pr-4 text-right">{formatCurrency(s.amount_paid)}</td>
                        <td className="py-2.5 pr-4 text-right font-medium">{formatCurrency(s.balance)}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={isPaid ? 'success' : 'warning'}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-muted-foreground text-xs max-w-40 truncate">
                          {s.payment_note ?? ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

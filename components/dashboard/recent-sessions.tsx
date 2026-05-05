import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail } from 'lucide-react'
import { WhatsAppButton } from './whatsapp-button'
import { TeamsLinkButton } from './teams-link-button'
import { formatCurrency, formatDate } from '@/lib/format'
import type { SessionWithRelations } from '@/types/db'

interface Props {
  sessions: SessionWithRelations[]
}

export function RecentSessions({ sessions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No sessions yet. Add your first session.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Due</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Paid</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Message</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const balance = parseFloat(s.balance ?? '0')
                  const isPaid = balance <= 0
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(s.session_date)}</td>
                      <td className="px-3 py-2.5 font-medium">{s.clients?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.session_types?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(s.amount_due)}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(s.amount_paid)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant={isPaid ? 'success' : 'warning'}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!isPaid && s.clients?.email && (
                            <a
                              href={`mailto:${s.clients.email}`}
                              title="Send email"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                          <WhatsAppButton session={s} isPaid={isPaid} />
                          <TeamsLinkButton session={s} />
                        </div>
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
  )
}

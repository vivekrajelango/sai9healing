import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'

interface OutstandingClient {
  id: string
  name: string
  balance: number
  last_session_date: string | null
}

interface Props {
  clients: OutstandingClient[]
}

export function OutstandingClients({ clients }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Clients with Outstanding Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            All balances are settled.
          </p>
        ) : (
          <div className="divide-y">
            {clients.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/clients/${c.id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Last session: {formatDate(c.last_session_date)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-destructive">
                  {formatCurrency(c.balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

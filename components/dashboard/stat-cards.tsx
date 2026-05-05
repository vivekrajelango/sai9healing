import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PoundSterling, Calendar, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface Props {
  totalOutstanding: number
  sessionsThisMonth: number
  collectedThisMonth: number
}

export function StatCards({ totalOutstanding, sessionsThisMonth, collectedThisMonth }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Outstanding Balance
          </CardTitle>
          <PoundSterling className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all clients</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sessions This Month
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{sessionsThisMonth}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Collected This Month
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(collectedThisMonth)}</p>
          <p className="text-xs text-muted-foreground mt-1">Amount paid in</p>
        </CardContent>
      </Card>
    </div>
  )
}

import { StatCards } from '@/components/dashboard/stat-cards'
import { RecentSessions } from '@/components/dashboard/recent-sessions'
import { getDashboardStats, getRecentSessions } from '@/actions/sessions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    getRecentSessions(10),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <StatCards
        totalOutstanding={stats.totalOutstanding}
        sessionsThisMonth={stats.sessionsThisMonth}
        collectedThisMonth={stats.collectedThisMonth}
      />

      <RecentSessions sessions={recent} />
    </div>
  )
}

import { StatCards } from '@/components/dashboard/stat-cards'
import { RecentSessions } from '@/components/dashboard/recent-sessions'
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings'
import { getDashboardStats, getRecentSessions, getSessionsWithMeetings } from '@/actions/sessions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [stats, recent, meetings] = await Promise.all([
    getDashboardStats(),
    getRecentSessions(10),
    getSessionsWithMeetings(),
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

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <RecentSessions sessions={recent} />
        <UpcomingMeetings sessions={meetings} />
      </div>
    </div>
  )
}

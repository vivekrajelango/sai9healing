import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import type { SessionWithRelations } from '@/types/db'

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M20.625 6.75h-6.375V5.625A2.625 2.625 0 0 0 11.625 3h-3.75A2.625 2.625 0 0 0 5.25 5.625v1.125H3.375A.375.375 0 0 0 3 7.125v9.75c0 .207.168.375.375.375h17.25A.375.375 0 0 0 21 16.875V7.125a.375.375 0 0 0-.375-.375zM6.75 5.625A1.125 1.125 0 0 1 7.875 4.5h3.75a1.125 1.125 0 0 1 1.125 1.125V6.75H6.75V5.625zM19.5 16.5h-15V8.25h15V16.5zm-8.25-1.5v-4.5l3.75 2.25-3.75 2.25z"/>
    </svg>
  )
}

function formatTime(time: string | null) {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

interface Props {
  sessions: SessionWithRelations[]
}

export function UpcomingMeetings({ sessions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TeamsIcon className="h-4 w-4 text-[#6264A7]" />
          Teams Meetings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No meetings scheduled yet.
          </p>
        ) : (
          <div className="divide-y">
            {sessions.map((s) => {
              const time = formatTime(s.session_time)
              const today = new Date().toISOString().split('T')[0]
              const isToday = s.session_date === today
              const isPast = s.session_date < today
              return (
                <div key={s.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.clients?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.session_types?.name ?? '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-medium ${isToday ? 'text-green-600' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {isToday ? 'Today' : formatDate(s.session_date)}
                    </p>
                    {time && <p className="text-xs text-muted-foreground">{time}</p>}
                  </div>
                  <a
                    href={s.teams_meeting_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 shrink-0 rounded-md px-3 py-1.5 text-xs font-medium bg-[#6264A7] text-white hover:bg-[#4f5194] transition-colors"
                  >
                    <TeamsIcon className="h-3 w-3" />
                    Join
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import type { SessionWithRelations } from '@/types/db'

export function buildOutlookLink(session: SessionWithRelations): string {
  const date = session.session_date
  const time = session.session_time ?? '10:00:00'
  const hours = parseFloat(String(session.hours))

  const startdt = `${date}T${time}`
  const endMs = new Date(startdt).getTime() + hours * 3_600_000
  const enddt = new Date(endMs).toISOString().slice(0, 19)

  const clientName = session.clients?.name ?? ''
  const sessionType = session.session_types?.name ?? 'Session'

  const subject = encodeURIComponent(`${sessionType} — ${clientName}`)
  const body = encodeURIComponent(
    `Dear ${clientName},\n\nPlease find your session details below.\n\nSession: ${sessionType}\nDate: ${date}${session.session_time ? `\nTime: ${session.session_time}` : ''}\nDuration: ${hours}h\n\nWith blessings,\nSai9 Healing`
  )
  const to = encodeURIComponent(session.clients?.email ?? '')

  return (
    `https://outlook.office.com/calendar/0/deeplink/compose` +
    `?subject=${subject}&startdt=${startdt}&enddt=${enddt}&body=${body}&to=${to}`
  )
}

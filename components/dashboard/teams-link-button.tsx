'use client'

import * as React from 'react'
import { CalendarPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildOutlookLink } from '@/lib/outlook-link'
import { saveTeamsMeetingUrl } from '@/actions/sessions'
import type { SessionWithRelations } from '@/types/db'

interface Props {
  session: SessionWithRelations
}

export function TeamsLinkButton({ session }: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (session.teams_meeting_url) {
    return (
      <a
        href={session.teams_meeting_url}
        target="_blank"
        rel="noopener noreferrer"
        title="Join Teams meeting"
        className="inline-flex items-center gap-1 text-xs font-medium text-[#6264A7] hover:underline whitespace-nowrap"
      >
        <TeamsIcon className="h-3.5 w-3.5 shrink-0" />
        Join
      </a>
    )
  }

  function handleCalendarClick() {
    window.open(buildOutlookLink(session), '_blank', 'noopener,noreferrer')
    setOpen(true)
  }

  async function handleSave() {
    const trimmed = url.trim()
    if (!trimmed.startsWith('http')) {
      setError('Please paste a valid Teams meeting link')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveTeamsMeetingUrl(session.id, trimmed)
      setOpen(false)
      router.refresh()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        title="Schedule in Outlook / Teams"
        onClick={handleCalendarClick}
        className="text-muted-foreground hover:text-[#0078D4] transition-colors"
      >
        <CalendarPlus className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Teams Meeting Link</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Outlook has opened in a new tab. Once you have sent the invite, copy
            the Teams join link from the event and paste it below.
          </p>
          <div className="grid gap-2">
            <Label>Teams Join Link</Label>
            <Input
              placeholder="https://teams.microsoft.com/l/meetup-join/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Skip
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !url.trim()}
              className="bg-[#6264A7] hover:bg-[#4f5194] text-white"
            >
              {saving ? 'Saving...' : 'Save Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M20.625 6.75h-6.375V5.625A2.625 2.625 0 0 0 11.625 3h-3.75A2.625 2.625 0 0 0 5.25 5.625v1.125H3.375A.375.375 0 0 0 3 7.125v9.75c0 .207.168.375.375.375h17.25A.375.375 0 0 0 21 16.875V7.125a.375.375 0 0 0-.375-.375zM6.75 5.625A1.125 1.125 0 0 1 7.875 4.5h3.75a1.125 1.125 0 0 1 1.125 1.125V6.75H6.75V5.625zM19.5 16.5h-15V8.25h15V16.5zm-8.25-1.5v-4.5l3.75 2.25-3.75 2.25z"/>
    </svg>
  )
}

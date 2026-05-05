'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/format'
import type { SessionWithRelations } from '@/types/db'

type Tab = 'quotation' | 'followup' | 'thankyou'

const TABS: { id: Tab; label: string }[] = [
  { id: 'quotation', label: 'Quotation' },
  { id: 'followup', label: 'Follow-up' },
  { id: 'thankyou', label: 'Thank You' },
]

function buildMessage(tab: Tab, session: SessionWithRelations): string {
  const name = session.clients?.name ?? 'there'
  const type = session.session_types?.name ?? 'Healing Session'
  const date = formatDate(session.session_date)
  const hours = parseFloat(String(session.hours)).toFixed(1)
  const rate = formatCurrency(session.rate)
  const due = formatCurrency(session.amount_due)
  const paid = formatCurrency(session.amount_paid)
  const balance = formatCurrency(session.balance)

  switch (tab) {
    case 'quotation':
      return (
        `Dear ${name},\n\n` +
        `Thank you for your interest in our healing services.\n\n` +
        `Here are the details for your upcoming session:\n\n` +
        `Session: ${type}\n` +
        `Date: ${date}\n` +
        `Duration: ${hours} hour(s)\n` +
        `Rate: ${rate} per session\n` +
        `Total Amount: ${due}\n\n` +
        `This is a sacred Navarathri healing session where we invoke the divine blessings of the Goddess for your wellbeing, clarity, and spiritual upliftment.\n\n` +
        `Please feel free to reach out if you have any questions. We look forward to welcoming you.\n\n` +
        `With blessings,\nSai9 Healing`
      )

    case 'followup':
      return (
        `Dear ${name},\n\n` +
        `Hope you are well.\n\n` +
        `This is a gentle reminder that your payment for the following session is still outstanding:\n\n` +
        `Session: ${type}\n` +
        `Date: ${date}\n` +
        `Balance Due: ${balance}\n\n` +
        `Kindly arrange the payment at your earliest convenience. Please do let us know if you have any questions or need any assistance.\n\n` +
        `With blessings,\nSai9 Healing`
      )

    case 'thankyou':
      return (
        `Dear ${name},\n\n` +
        `Thank you so much for your payment!\n\n` +
        `We have received ${paid} for your session:\n\n` +
        `Session: ${type}\n` +
        `Date: ${date}\n\n` +
        `Your trust, love, and support means the world to us. We are truly grateful for the opportunity to be a part of your healing journey.\n\n` +
        `May the divine blessings continue to guide and protect you always.\n\n` +
        `With love and blessings,\nSai9 Healing`
      )
  }
}

interface Props {
  session: SessionWithRelations
  defaultTab?: Tab
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsAppMessageDialog({ session, defaultTab = 'followup', open, onOpenChange }: Props) {
  const [tab, setTab] = React.useState<Tab>(defaultTab)
  const [message, setMessage] = React.useState(() => buildMessage(defaultTab, session))

  React.useEffect(() => {
    if (open) {
      setTab(defaultTab)
      setMessage(buildMessage(defaultTab, session))
    }
  }, [open, defaultTab, session])

  function handleTabChange(t: Tab) {
    setTab(t)
    setMessage(buildMessage(t, session))
  }

  function handleSend() {
    const contact = session.clients?.contact ?? ''
    const phone = contact.replace(/\D/g, '')
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>WhatsApp Message — {session.clients?.name}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Editable message */}
        <textarea
          rows={12}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            className="bg-[#25D366] hover:bg-[#1ebe5d] text-white"
          >
            Send via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createForm, deleteForm } from '@/actions/forms'
import type { Form } from '@/types/db'
import { formatDateTime } from '@/lib/format'

interface Props {
  forms: Form[]
}

export function FormListClient({ forms: initialForms }: Props) {
  const router = useRouter()
  const [forms, setForms] = React.useState(initialForms)
  const [creating, setCreating] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  async function handleCreate() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const form = await createForm({ title: title.trim(), description: description.trim() || undefined })
      router.push(`/create-form/${form.id}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this form and all its responses?')) return
    await deleteForm(id)
    setForms((prev) => prev.filter((f) => f.id !== id))
  }

  function copyLink(slug: string, id: string) {
    navigator.clipboard.writeText(`${origin}/f/${slug}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Forms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage forms to share with clients</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Form
        </Button>
      </div>

      {creating && (
        <div className="rounded-lg border bg-card p-4 flex flex-col gap-3 max-w-lg">
          <p className="text-sm font-medium">New Form</p>
          <Input
            placeholder="Form title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving || !title.trim()}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setTitle(''); setDescription('') }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {forms.length === 0 && !creating ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No forms yet. Click "New Form" to create one.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {forms.map((form) => (
            <div key={form.id} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{form.title}</p>
                {form.description && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{form.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Created {formatDateTime(form.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => copyLink(form.slug, form.id)}
                >
                  {copiedId === form.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === form.id ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" asChild>
                  <a href={`/f/${form.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview
                  </a>
                </Button>
                <Button size="sm" variant="default" className="h-8 text-xs" asChild>
                  <Link href={`/create-form/${form.id}`}>Edit</Link>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(form.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

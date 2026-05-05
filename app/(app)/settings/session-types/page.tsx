'use client'

import * as React from 'react'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import {
  getSessionTypes,
  createSessionType,
  updateSessionType,
  deleteSessionType,
} from '@/actions/session-types'
import type { SessionType } from '@/types/db'

export default function SessionTypesPage() {
  const [types, setTypes] = React.useState<SessionType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')
  const [editRate, setEditRate] = React.useState('')
  const [editHours, setEditHours] = React.useState('')
  const [adding, setAdding] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [newRate, setNewRate] = React.useState('0')
  const [newHours, setNewHours] = React.useState('1')
  const [saving, setSaving] = React.useState(false)

  async function load() {
    const data = await getSessionTypes(false)
    setTypes(data)
    setLoading(false)
  }

  React.useEffect(() => { load() }, [])

  function startEdit(t: SessionType) {
    setEditingId(t.id)
    setEditName(t.name)
    setEditRate(t.default_rate)
    setEditHours(t.default_hours)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      await updateSessionType(id, {
        name: editName,
        default_rate: parseFloat(editRate) || 0,
        default_hours: parseFloat(editHours) || 1,
      })
      await load()
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(t: SessionType) {
    await updateSessionType(t.id, { active: !t.active })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this session type? This cannot be undone.')) return
    await deleteSessionType(id)
    await load()
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createSessionType({
        name: newName.trim(),
        default_rate: parseFloat(newRate) || 0,
        default_hours: parseFloat(newHours) || 1,
      })
      setNewName('')
      setNewRate('0')
      setNewHours('1')
      setAdding(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Session Types</h1>
          <p className="text-sm text-muted-foreground">
            Manage session categories, default rates and hours
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4" />
          Add Type
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_6rem_6rem_7rem_auto] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>Name</span>
            <span className="text-right">Rate (£)</span>
            <span className="text-right">Hours</span>
            <span className="text-center">Status</span>
            <span />
          </div>

          <div className="divide-y">
            {adding && (
              <div className="grid grid-cols-[1fr_6rem_6rem_7rem_auto] items-center gap-2 px-3 py-2">
                <Input
                  className="h-8"
                  placeholder="Type name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                <Input
                  className="h-8 text-right"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                />
                <Input
                  className="h-8 text-right"
                  type="number"
                  step="0.25"
                  min="0.25"
                  placeholder="1"
                  value={newHours}
                  onChange={(e) => setNewHours(e.target.value)}
                />
                <span />
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleAdd} disabled={saving}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => { setAdding(false); setNewName(''); setNewRate('0'); setNewHours('1') }}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            )}

            {types.length === 0 && !adding ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No session types yet.
              </div>
            ) : (
              types.map((t) =>
                editingId === t.id ? (
                  <div
                    key={t.id}
                    className="grid grid-cols-[1fr_6rem_6rem_7rem_auto] items-center gap-2 px-3 py-2"
                  >
                    <Input
                      className="h-8"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <Input
                      className="h-8 text-right"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                    />
                    <Input
                      className="h-8 text-right"
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                    />
                    <span />
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => saveEdit(t.id)}
                        disabled={saving}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={t.id}
                    className="grid grid-cols-[1fr_6rem_6rem_7rem_auto] items-center gap-2 px-3 py-2"
                  >
                    <span className={`text-sm font-medium ${!t.active ? 'opacity-40 line-through' : ''}`}>
                      {t.name}
                    </span>
                    <span className="text-sm text-muted-foreground text-right">
                      {formatCurrency(t.default_rate)}
                    </span>
                    <span className="text-sm text-muted-foreground text-right">
                      {parseFloat(t.default_hours).toFixed(2)}h
                    </span>
                    <div className="flex justify-center">
                      <Badge
                        variant={t.active ? 'success' : 'secondary'}
                        className="cursor-pointer select-none text-xs"
                        onClick={() => toggleActive(t)}
                      >
                        {t.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => startEdit(t)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, GripVertical, Check, Copy, ExternalLink,
  ChevronDown, ChevronUp, Pencil, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  addQuestion, updateQuestion, deleteQuestion, reorderQuestions, updateForm,
} from '@/actions/forms'
import type { FormWithQuestions, FormQuestion, QuestionType } from '@/types/db'

const TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  number: 'Number',
}

const NEEDS_OPTIONS: QuestionType[] = ['single_choice', 'multiple_choice']

interface QuestionEditorProps {
  question: FormQuestion
  onSave: (q: FormQuestion) => void
  onCancel: () => void
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [text, setText] = React.useState(question.question_text)
  const [type, setType] = React.useState<QuestionType>(question.question_type)
  const [options, setOptions] = React.useState<string[]>(
    question.options.length > 0 ? question.options : ['', '']
  )
  const [required, setRequired] = React.useState(question.required)
  const [saving, setSaving] = React.useState(false)

  function addOption() { setOptions((prev) => [...prev, '']) }
  function removeOption(i: number) { setOptions((prev) => prev.filter((_, idx) => idx !== i)) }
  function setOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)))
  }

  async function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    const cleanOptions = NEEDS_OPTIONS.includes(type)
      ? options.filter((o) => o.trim())
      : []
    try {
      await updateQuestion(question.id, {
        question_text: text.trim(),
        question_type: type,
        options: cleanOptions,
        required,
      })
      onSave({ ...question, question_text: text.trim(), question_type: type, options: cleanOptions, required })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border bg-muted/30">
      <Input
        placeholder="Question text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
        >
          {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Required
        </label>
      </div>

      {NEEDS_OPTIONS.includes(type) && (
        <div className="flex flex-col gap-1.5 pl-1">
          <p className="text-xs text-muted-foreground font-medium">Options</p>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                className="h-8 text-sm"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
              />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <Button type="button" size="sm" variant="ghost" className="w-fit h-7 text-xs gap-1 mt-1" onClick={addOption}>
            <Plus className="h-3 w-3" /> Add option
          </Button>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving || !text.trim()}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

interface Props {
  form: FormWithQuestions
}

export function FormBuilderClient({ form: initialForm }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = React.useState<FormQuestion[]>(initialForm.form_questions)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [addingNew, setAddingNew] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(false)
  const [title, setTitle] = React.useState(initialForm.title)
  const [description, setDescription] = React.useState(initialForm.description ?? '')
  const [savingMeta, setSavingMeta] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/f/${initialForm.slug}`

  async function handleSaveMeta() {
    if (!title.trim()) return
    setSavingMeta(true)
    try {
      await updateForm(initialForm.id, { title: title.trim(), description: description.trim() || undefined })
      setEditTitle(false)
    } finally {
      setSavingMeta(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAddNew() {
    const newQ: FormQuestion = {
      id: `__new__${Date.now()}`,
      form_id: initialForm.id,
      question_text: '',
      question_type: 'short_text',
      options: [],
      required: false,
      sort_order: questions.length,
      created_at: new Date().toISOString(),
    }
    try {
      const saved = await addQuestion({
        form_id: initialForm.id,
        question_text: 'New question',
        question_type: 'short_text',
        options: [],
        required: false,
        sort_order: questions.length,
      })
      setQuestions((prev) => [...prev, saved])
      setEditingId(saved.id)
      setAddingNew(false)
    } catch {
      setAddingNew(false)
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return
    await deleteQuestion(id, initialForm.id)
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  function handleSaveQuestion(updated: FormQuestion) {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
    setEditingId(null)
  }

  async function move(index: number, direction: 'up' | 'down') {
    const newQs = [...questions]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= newQs.length) return
    ;[newQs[index], newQs[swapIdx]] = [newQs[swapIdx], newQs[index]]
    setQuestions(newQs)
    await reorderQuestions(initialForm.id, newQs.map((q) => q.id))
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back */}
      <button
        type="button"
        className="text-sm text-muted-foreground hover:text-foreground w-fit"
        onClick={() => router.push('/create-form')}
      >
        ← Back to forms
      </button>

      {/* Form metadata */}
      {editTitle ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Form title" autoFocus />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveMeta} disabled={savingMeta || !title.trim()}>
              {savingMeta ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditTitle(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setEditTitle(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      )}

      {/* Share link */}
      <div className="rounded-lg border bg-muted/30 p-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
          Share link: <span className="text-foreground font-mono">{shareUrl}</span>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" asChild>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Preview
            </a>
          </Button>
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Questions ({questions.length})</p>
          <Button size="sm" className="gap-1.5" onClick={handleAddNew} disabled={addingNew}>
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>

        {questions.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No questions yet. Click "Add Question" to start.
          </div>
        )}

        {questions.map((q, index) => (
          <div key={q.id} className="rounded-lg border bg-card overflow-hidden">
            {editingId === q.id ? (
              <QuestionEditor
                question={q}
                onSave={handleSaveQuestion}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start gap-3 p-4">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {index + 1}. {q.question_text}
                    {q.required && <span className="text-destructive ml-1">*</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{TYPE_LABELS[q.question_type]}</Badge>
                    {q.options.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {q.options.join(' / ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 'down')}
                    disabled={index === questions.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(q.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteQuestion(q.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

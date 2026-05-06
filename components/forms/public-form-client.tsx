'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitForm } from '@/actions/forms'
import type { FormWithQuestions, QuestionType } from '@/types/db'

interface Props {
  form: FormWithQuestions
}

export function PublicFormClient({ form }: Props) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function setAnswer(qId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
    setErrors((prev) => ({ ...prev, [qId]: '' }))
  }

  function toggleMulti(qId: string, option: string) {
    const current = (answers[qId] as string[]) ?? []
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option]
    setAnswer(qId, next)
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs['__name'] = 'Name is required'
    if (!email.trim()) errs['__email'] = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs['__email'] = 'Enter a valid email'

    for (const q of form.form_questions) {
      if (!q.required) continue
      const ans = answers[q.id]
      if (q.question_type === 'multiple_choice') {
        if (!ans || (ans as string[]).length === 0) errs[q.id] = 'This question is required'
      } else {
        if (!ans || !(ans as string).trim()) errs[q.id] = 'This question is required'
      }
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      await submitForm({
        form_id: form.id,
        respondent_name: name.trim(),
        respondent_email: email.trim(),
        respondent_phone: phone.trim() || undefined,
        answers: form.form_questions.map((q) => {
          const ans = answers[q.id]
          if (q.question_type === 'multiple_choice') {
            return { question_id: q.id, answer_options: (ans as string[]) ?? [] }
          }
          return { question_id: q.id, answer_text: (ans as string) ?? '' }
        }),
      })
      setSubmitted(true)
    } catch {
      setErrors({ __submit: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-xl bg-card rounded-xl border shadow-sm p-8 text-center">
        <div className="text-4xl mb-3">🙏</div>
        <h2 className="text-lg font-semibold mb-1">Thank you, {name}!</h2>
        <p className="text-sm text-muted-foreground">Your response has been recorded. We will get back to you soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-5">
      {/* Header */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <h1 className="text-xl font-semibold">{form.title}</h1>
        {form.description && (
          <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
        )}
      </div>

      {/* Respondent info */}
      <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Details</p>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, __name: '' })) }}
            placeholder="Enter your full name"
          />
          {errors.__name && <p className="text-xs text-destructive">{errors.__name}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Email Address <span className="text-destructive">*</span></label>
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, __email: '' })) }}
            placeholder="Enter your email"
          />
          {errors.__email && <p className="text-xs text-destructive">{errors.__email}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Mobile Number</label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 7700 900000"
          />
        </div>
      </div>

      {/* Questions */}
      {form.form_questions.map((q, idx) => (
        <div key={q.id} className="bg-card rounded-xl border shadow-sm p-6 flex flex-col gap-3">
          <p className="text-sm font-medium">
            {idx + 1}. {q.question_text}
            {q.required && <span className="text-destructive ml-1">*</span>}
          </p>

          {q.question_type === 'short_text' && (
            <Input
              placeholder="Your answer"
              value={(answers[q.id] as string) ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            />
          )}

          {q.question_type === 'long_text' && (
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your answer"
              value={(answers[q.id] as string) ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            />
          )}

          {q.question_type === 'number' && (
            <Input
              type="number"
              placeholder="0"
              value={(answers[q.id] as string) ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            />
          )}

          {q.question_type === 'true_false' && (
            <div className="flex gap-4">
              {['True', 'False'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={(answers[q.id] as string) === opt}
                    onChange={() => setAnswer(q.id, opt)}
                    className="h-4 w-4"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.question_type === 'single_choice' && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={(answers[q.id] as string) === opt}
                    onChange={() => setAnswer(q.id, opt)}
                    className="h-4 w-4"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.question_type === 'multiple_choice' && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => {
                const selected = ((answers[q.id] as string[]) ?? []).includes(opt)
                return (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleMulti(q.id, opt)}
                      className="h-4 w-4 rounded"
                    />
                    {opt}
                  </label>
                )
              })}
            </div>
          )}

          {errors[q.id] && <p className="text-xs text-destructive">{errors[q.id]}</p>}
        </div>
      ))}

      {errors.__submit && (
        <p className="text-sm text-destructive text-center">{errors.__submit}</p>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Submitting...' : 'Submit'}
      </Button>

      <p className="text-xs text-center text-muted-foreground pb-4">Sai9 Healing</p>
    </form>
  )
}

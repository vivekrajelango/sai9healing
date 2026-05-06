'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import type { FormWithQuestions, FormSubmissionWithAnswers, QuestionType } from '@/types/db'

const TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  number: 'Number',
}

interface Props {
  forms: FormWithQuestions[]
  submissionsByForm: Record<string, FormSubmissionWithAnswers[]>
}

export function FormStatusClient({ forms, submissionsByForm }: Props) {
  const [expandedForm, setExpandedForm] = React.useState<string | null>(forms[0]?.id ?? null)
  const [expandedSub, setExpandedSub] = React.useState<string | null>(null)

  if (forms.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Form Status</h1>
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No forms created yet. Go to "Create Form" to get started.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Form Status</h1>

      {forms.map((form) => {
        const subs = submissionsByForm[form.id] ?? []
        const isFormExpanded = expandedForm === form.id

        return (
          <div key={form.id} className="rounded-lg border bg-card overflow-hidden">
            {/* Form header */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
              onClick={() => setExpandedForm((prev) => (prev === form.id ? null : form.id))}
            >
              <div className="flex items-center gap-3">
                {isFormExpanded
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                <div>
                  <p className="font-medium text-sm">{form.title}</p>
                  {form.description && (
                    <p className="text-xs text-muted-foreground">{form.description}</p>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2.5 py-0.5 shrink-0">
                {subs.length} {subs.length === 1 ? 'response' : 'responses'}
              </span>
            </button>

            {isFormExpanded && (
              <div className="border-t">
                {subs.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground text-center italic">
                    No responses yet for this form.
                  </p>
                ) : (
                  <div className="divide-y">
                    {subs.map((sub, idx) => {
                      const isSubExpanded = expandedSub === sub.id
                      return (
                        <div key={sub.id}>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors text-left"
                            onClick={() => setExpandedSub((prev) => (prev === sub.id ? null : sub.id))}
                          >
                            <div className="flex items-center gap-3">
                              {isSubExpanded
                                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                              <div>
                                <p className="text-sm font-medium">{sub.respondent_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sub.respondent_email}
                                  {sub.respondent_phone ? ` · ${sub.respondent_phone}` : ''}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              #{idx + 1} · {formatDateTime(sub.submitted_at)}
                            </span>
                          </button>

                          {isSubExpanded && (
                            <div className="px-10 pb-4 pt-1 bg-muted/20">
                              <div className="flex flex-col gap-3">
                                {form.form_questions.map((q) => {
                                  const ans = sub.form_answers.find((a) => a.question_id === q.id)
                                  const displayAnswer = () => {
                                    if (!ans) return <span className="italic text-muted-foreground">No answer</span>
                                    if (q.question_type === 'multiple_choice') {
                                      return ans.answer_options.length > 0
                                        ? ans.answer_options.join(', ')
                                        : <span className="italic text-muted-foreground">No answer</span>
                                    }
                                    if (q.question_type === 'true_false' || q.question_type === 'single_choice') {
                                      return ans.answer_text ?? <span className="italic text-muted-foreground">No answer</span>
                                    }
                                    return ans.answer_text ?? <span className="italic text-muted-foreground">No answer</span>
                                  }
                                  return (
                                    <div key={q.id} className="flex flex-col gap-0.5">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Q{q.sort_order + 1}. {q.question_text}
                                        {q.required && <span className="text-destructive ml-1">*</span>}
                                        <span className="ml-1.5 normal-case font-normal">({TYPE_LABELS[q.question_type]})</span>
                                      </p>
                                      <p className="text-sm pl-1">{displayAnswer()}</p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

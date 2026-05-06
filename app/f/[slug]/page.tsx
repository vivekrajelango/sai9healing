import { notFound } from 'next/navigation'
import { getFormBySlug } from '@/actions/forms'
import { PublicFormClient } from '@/components/forms/public-form-client'

export const dynamic = 'force-dynamic'

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const form = await getFormBySlug(slug)
  if (!form) notFound()
  return <PublicFormClient form={form} />
}

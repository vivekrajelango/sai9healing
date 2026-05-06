export default function PublicFormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40 flex items-start justify-center py-10 px-4">
      {children}
    </div>
  )
}

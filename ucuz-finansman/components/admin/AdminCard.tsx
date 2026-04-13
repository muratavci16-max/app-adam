import { cn } from '@/lib/utils'

export function AdminCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-neutral-100 shadow-card p-6', className)}>
      {children}
    </div>
  )
}

export function AdminSectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-lg font-extrabold text-neutral-900">{title}</h1>
      {desc && <p className="text-sm text-neutral-500 mt-0.5">{desc}</p>}
    </div>
  )
}

export const inputCls = "w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"
export const labelCls = "block text-xs font-semibold text-neutral-600 mb-1.5"
export const btnPrimary = "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
export const btnDanger = "inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-all"
export const btnSecondary = "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 font-semibold text-sm hover:bg-neutral-200 transition-all"

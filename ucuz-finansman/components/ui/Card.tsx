import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6 sm:p-8',
  }
  return (
    <div className={cn('bg-white rounded-xl2 shadow-card border border-neutral-100', paddings[padding], className)}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'indigo' | 'amber' | 'red'
  className?: string
}

const colorMap = {
  blue:   'bg-primary-50  text-primary-700',
  green:  'bg-success-50  text-success-700',
  indigo: 'bg-accent-50   text-accent-700',
  amber:  'bg-amber-50    text-amber-700',
  red:    'bg-red-50      text-red-700',
}

export function StatCard({ label, value, sub, color = 'blue', className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl p-4 border', colorMap[color], 'border-transparent', className)}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

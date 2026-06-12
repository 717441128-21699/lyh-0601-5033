import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  color?: string
}

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600' },
  gold: { bg: 'bg-gold-50', icon: 'text-gold-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
}

const trendConfig = {
  up: { icon: TrendingUp, text: 'text-green-600', bg: 'bg-green-50' },
  down: { icon: TrendingDown, text: 'text-red-600', bg: 'bg-red-50' },
  flat: { icon: Minus, text: 'text-gray-500', bg: 'bg-gray-50' },
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
}: StatCardProps) {
  const colors = colorMap[color] ?? colorMap.blue
  const trendInfo = trend ? trendConfig[trend] : null

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
        {trendInfo && trendValue && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trendInfo.bg,
              trendInfo.text
            )}
          >
            <trendInfo.icon className="h-3 w-3" />
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-sm text-gray-500">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

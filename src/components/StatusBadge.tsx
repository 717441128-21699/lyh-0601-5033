import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; pulse?: boolean }> = {
  '待开标': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  '开标中': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '评标中': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', pulse: true },
  '结果公示': { bg: 'bg-gold-50', text: 'text-gold-700', dot: 'bg-gold-500' },
  '空闲': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  '占用': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '维护': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  '待审批': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  '已通过': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  '已驳回': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  '进行中': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '已完成': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  '已取消': { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  '可用': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  '已抽取': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '已确认': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  '已回避': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  '迟到': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  '待审核': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  '已结束': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
}

const defaultConfig: { bg: string; text: string; dot: string; pulse?: boolean } = { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? defaultConfig

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              config.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', config.dot)} />
      </span>
      {status}
    </span>
  )
}

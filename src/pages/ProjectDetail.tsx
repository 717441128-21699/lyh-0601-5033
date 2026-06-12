import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Building2, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import type { Project } from '@/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h >= 24) {
    const d = Math.floor(h / 24)
    const rh = h % 24
    return `${d}天${rh > 0 ? rh + '小时' : ''}`
  }
  if (h > 0) return `${h}小时${m > 0 ? m + '分钟' : ''}`
  return `${m}分钟`
}

const statusTransitions: Record<string, { next: Project['status']; label: string; icon: typeof Clock }> = {
  '待开标': { next: '开标中', label: '开始开标', icon: Clock },
  '开标中': { next: '评标中', label: '开始评标', icon: FileCheck },
  '评标中': { next: '结果公示', label: '公示结果', icon: Building2 },
}

const infoLabels: Array<{ key: string; label: string; format?: (v: string | number) => string }> = [
  { key: 'projectCode', label: '项目编号' },
  { key: 'budgetAmount', label: '预算金额', format: (v) => '¥' + Number(v).toLocaleString('zh-CN') },
  { key: 'procurementMethod', label: '采购方式' },
  { key: 'industry', label: '行业' },
  { key: 'openBidTime', label: '开标时间', format: (v) => formatDate(String(v)) },
  { key: 'createdAt', label: '创建时间', format: (v) => formatDate(String(v)) },
  { key: 'evaluationRoom', label: '评标室' },
  { key: 'enterprisesCount', label: '投标企业数' },
]

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, evaluationRooms, extractionRecords, updateProjectStatus } = useStore()

  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-gray-400">项目不存在</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-primary-500 hover:text-primary-600 font-medium"
        >
          返回项目列表
        </button>
      </div>
    )
  }

  const room = evaluationRooms.find((r) => r.id === project.evaluationRoomId)
  const projectExtractions = extractionRecords.filter((r) => r.projectId === project.id)
  const transition = statusTransitions[project.status]

  const infoData: Record<string, string | number> = {
    projectCode: project.projectCode,
    budgetAmount: project.budgetAmount,
    procurementMethod: project.procurementMethod,
    industry: project.industry,
    openBidTime: project.openBidTime,
    createdAt: project.createdAt,
    evaluationRoom: room?.name ?? '-',
    enterprisesCount: project.biddingEnterprises.length,
  }

  const handleStatusTransition = () => {
    if (transition) {
      updateProjectStatus(project.id, transition.next)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.projectCode}</h1>
              <StatusBadge status={project.status} />
            </div>
          </div>
        </div>
        {transition && (
          <button
            onClick={handleStatusTransition}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-600 transition-colors"
          >
            <transition.icon className="h-4 w-4" />
            {transition.label}
          </button>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">项目信息</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          {infoLabels.map((item) => (
            <div key={item.key}>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900">
                {item.format ? item.format(infoData[item.key]) : infoData[item.key]}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">阶段时间线</h2>
        <div className="relative ml-2">
          {project.stageTimings.map((timing, i) => (
            <div key={i} className="relative pb-6 last:pb-0">
              <div className="absolute left-[5px] top-2 h-full w-0.5 bg-gray-200 last:bg-transparent" />
              <div
                className={cn(
                  'absolute left-0 top-1.5 h-3 w-3 rounded-full border-2',
                  i === project.stageTimings.length - 1 ? 'border-primary-500 bg-primary-100' : 'border-green-500 bg-green-100'
                )}
              />
              <div className="ml-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{timing.stage}</span>
                  <span className="text-xs text-gray-400">
                    {formatDate(timing.startTime)}
                    {timing.endTime && ` — ${formatDate(timing.endTime)}`}
                  </span>
                </div>
                {timing.duration != null && (
                  <p className="mt-0.5 text-xs text-gray-500">耗时 {formatDuration(timing.duration)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">投标企业</h2>
        {project.biddingEnterprises.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2 text-left font-medium text-gray-500">企业名称</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">资质等级</th>
              </tr>
            </thead>
            <tbody>
              {project.biddingEnterprises.map((ent) => (
                <tr key={ent.id} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-900">{ent.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{ent.qualification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">暂无投标企业</p>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">抽取记录</h2>
        {projectExtractions.length > 0 ? (
          <div className="space-y-4">
            {projectExtractions.map((record) => (
              <div key={record.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{record.id}</span>
                  <StatusBadge status={record.approvalStatus} size="sm" />
                </div>
                <p className="mt-1 text-xs text-gray-400">创建时间：{formatDate(record.createdAt)}</p>
                {record.approvedBy && (
                  <p className="mt-0.5 text-xs text-gray-400">审批人：{record.approvedBy}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {record.experts.map((e) => (
                    <span
                      key={e.expertId}
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        e.response === '已确认' ? 'bg-green-50 text-green-700' :
                        e.response === '已回避' ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-600'
                      )}
                    >
                      {e.expertId} ({e.response})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">暂无抽取记录</p>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import type { Project } from '@/types'

const statusOptions = ['全部', '待开标', '开标中', '评标中', '结果公示']

function formatBudget(amount: number): string {
  return '¥' + amount.toLocaleString('zh-CN')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ProjectList() {
  const { projects } = useStore()
  const [statusFilter, setStatusFilter] = useState('全部')
  const [industryFilter, setIndustryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filtered = projects.filter((p: Project) => {
    if (statusFilter !== '全部' && p.status !== statusFilter) return false
    if (industryFilter && !p.industry.includes(industryFilter)) return false
    if (dateFrom && new Date(p.openBidTime) < new Date(dateFrom)) return false
    if (dateTo && new Date(p.openBidTime) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新建项目
        </Link>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">状态</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">行业</label>
            <input
              type="text"
              placeholder="输入行业关键词"
              value={industryFilter}
              onChange={(e) => { setIndustryFilter(e.target.value); setCurrentPage(1) }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">开标开始</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">开标结束</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <button
            onClick={() => { setStatusFilter('全部'); setIndustryFilter(''); setDateFrom(''); setDateTo(''); setCurrentPage(1) }}
            className="h-9 rounded-lg border border-gray-200 px-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">项目编号</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">行业</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">采购方式</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">预算金额</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">开标时间</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((p: Project) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.projectCode}</td>
                  <td className="px-4 py-3 text-gray-600">{p.industry}</td>
                  <td className="px-4 py-3 text-gray-600">{p.procurementMethod}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatBudget(p.budgetAmount)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.openBidTime)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/projects/${p.id}`} className="text-primary-500 hover:text-primary-600 font-medium transition-colors">详情</Link>
                      <Link to="/scheduling" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">调度</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <span className="text-sm text-gray-500">
            共 {filtered.length} 条记录，第 {currentPage}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
                currentPage <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                  page === currentPage ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
                currentPage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

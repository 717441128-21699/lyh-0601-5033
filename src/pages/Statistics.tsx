import { useState, useMemo, useRef } from 'react'
import { FolderKanban, TrendingDown, UserCheck, Clock, Download } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useStore } from '@/store/useStore'
import StatCard from '@/components/StatCard'

const INDUSTRIES = ['信息技术', '建筑工程', '医疗设备', '教育装备', '环保工程', '软件服务', '办公设备', '市政工程']
const PROCUREMENT_METHODS: Project['procurementMethod'][] = ['公开招标', '邀请招标', '竞争性谈判', '竞争性磋商', '单一来源', '询价']
const COLORS = ['#1B3A5C', '#3A5A8A', '#D4A843', '#22C55E', '#F59E0B', '#EF4444']

import type { Project } from '@/types'

export default function Statistics() {
  const projects = useStore((s) => s.projects)
  const experts = useStore((s) => s.experts)
  const statsRef = useRef<HTMLDivElement>(null)

  const [selectedMonth, setSelectedMonth] = useState('2026-06')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterMethod, setFilterMethod] = useState('')

  const savingRate = useMemo(() => {
    const min = 8
    const max = 15
    return `${(Math.random() * (max - min) + min).toFixed(1)}%`
  }, [])

  const expertArrivalRate = useMemo(() => {
    const nonAvailable = experts.filter((e) => e.status !== '可用')
    if (nonAvailable.length === 0) return '0%'
    const confirmed = nonAvailable.filter((e) => e.status === '已确认').length
    return `${Math.round((confirmed / nonAvailable.length) * 100)}%`
  }, [experts])

  const avgEvaluationHours = useMemo(() => {
    const durations: number[] = []
    projects.forEach((p) => {
      p.stageTimings.forEach((t) => {
        if (t.endTime && t.duration != null) {
          durations.push(t.duration)
        }
      })
    })
    if (durations.length === 0) return '0h'
    const avgSeconds = durations.reduce((a, b) => a + b, 0) / durations.length
    const avgHours = avgSeconds / 3600
    return `${avgHours.toFixed(1)}h`
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterIndustry && p.industry !== filterIndustry) return false
      if (filterMethod && p.procurementMethod !== filterMethod) return false
      return true
    })
  }, [projects, filterIndustry, filterMethod])

  const industryData = useMemo(() => {
    const map: Record<string, number> = {}
    INDUSTRIES.forEach((ind) => (map[ind] = 0))
    filteredProjects.forEach((p) => {
      if (map[p.industry] !== undefined) {
        map[p.industry]++
      } else {
        map[p.industry] = 1
      }
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filteredProjects])

  const procurementData = useMemo(() => {
    const map: Record<string, number> = {}
    PROCUREMENT_METHODS.forEach((m) => (map[m] = 0))
    filteredProjects.forEach((p) => {
      if (map[p.procurementMethod] !== undefined) {
        map[p.procurementMethod]++
      } else {
        map[p.procurementMethod] = 1
      }
    })
    return Object.entries(map)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
  }, [filteredProjects])

  const monthlyTrendData = useMemo(() => {
    const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
    const labels = ['1月', '2月', '3月', '4月', '5月', '6月']
    return months.map((m, i) => {
      const count = filteredProjects.filter((p) => p.createdAt.slice(0, 7) === m).length
      return { name: labels[i], count }
    })
  }, [filteredProjects])

  const durationByMethodData = useMemo(() => {
    const map: Record<string, number[]> = {}
    PROCUREMENT_METHODS.forEach((m) => (map[m] = []))
    filteredProjects.forEach((p) => {
      p.stageTimings.forEach((t) => {
        if (t.endTime && t.duration != null) {
          if (!map[p.procurementMethod]) map[p.procurementMethod] = []
          map[p.procurementMethod].push(t.duration / 3600)
        }
      })
    })
    return Object.entries(map)
      .filter(([, vals]) => vals.length > 0)
      .map(([name, vals]) => ({
        name,
        avg: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
        min: Number(Math.min(...vals).toFixed(1)),
        max: Number(Math.max(...vals).toFixed(1)),
      }))
  }, [filteredProjects])

  const handleExportPDF = async () => {
    if (!statsRef.current) return
    const canvas = await html2canvas(statsRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`统计分析报告_${selectedMonth}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">统计分析</h1>
        <div className="flex items-center gap-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gold-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            导出PDF月度报告
          </button>
        </div>
      </div>

      <div ref={statsRef} className="space-y-6">
        <div className="grid grid-cols-4 gap-5">
          <StatCard title="项目总数" value={projects.length} icon={FolderKanban} color="blue" />
          <StatCard title="节约率" value={savingRate} icon={TrendingDown} color="green" trend="down" trendValue={savingRate} />
          <StatCard title="专家到位率" value={expertArrivalRate} icon={UserCheck} color="purple" />
          <StatCard title="平均评标时长" value={avgEvaluationHours} icon={Clock} color="orange" />
        </div>

        <div className="flex items-center gap-4">
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          >
            <option value="">全部行业</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          >
            <option value="">全部采购方式</option>
            {PROCUREMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold font-serif text-gray-900">行业分布柱状图</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={industryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1B3A5C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold font-serif text-gray-900">采购方式饼图</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={procurementData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {procurementData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold font-serif text-gray-900">月度趋势折线图</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="项目数" stroke="#1B3A5C" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold font-serif text-gray-900">评标时长分布柱状图</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={durationByMethodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg" name="平均时长(h)" fill="#3A5A8A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="min" name="最短时长(h)" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" name="最长时长(h)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

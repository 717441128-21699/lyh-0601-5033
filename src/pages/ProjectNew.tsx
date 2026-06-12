import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import type { Enterprise, Project } from '@/types'

const procurementMethods = ['公开招标', '邀请招标', '竞争性谈判', '竞争性磋商', '单一来源', '询价']
const qualifications = ['特级', '甲级', '乙级']

const stepLabels = ['基本信息', '投标企业', '时间安排']

export default function ProjectNew() {
  const navigate = useNavigate()
  const { addProject } = useStore()
  const [step, setStep] = useState(0)

  const [projectCode, setProjectCode] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [procurementMethod, setProcurementMethod] = useState<Project['procurementMethod']>('公开招标')
  const [industry, setIndustry] = useState('')
  const [enterprises, setEnterprises] = useState<Array<{ name: string; qualification: string }>>([
    { name: '', qualification: '甲级' },
  ])
  const [openBidTime, setOpenBidTime] = useState('')
  const [notes, setNotes] = useState('')

  const addEnterprise = () => {
    setEnterprises([...enterprises, { name: '', qualification: '甲级' }])
  }

  const removeEnterprise = (index: number) => {
    setEnterprises(enterprises.filter((_, i) => i !== index))
  }

  const updateEnterprise = (index: number, field: 'name' | 'qualification', value: string) => {
    setEnterprises(enterprises.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }

  const handleSubmit = () => {
    const biddingEnterprises: Enterprise[] = enterprises
      .filter((e) => e.name.trim())
      .map((e, i) => ({
        id: `ent-new-${Date.now()}-${i}`,
        name: e.name,
        qualification: e.qualification,
      }))

    const project: Project = {
      id: `proj-${Date.now()}`,
      projectCode,
      budgetAmount: Number(budgetAmount) || 0,
      procurementMethod,
      biddingEnterprises,
      openBidTime: openBidTime ? new Date(openBidTime).toISOString() : new Date().toISOString(),
      status: '待开标',
      industry,
      createdAt: new Date().toISOString(),
      stageTimings: [{ stage: '待开标', startTime: new Date().toISOString() }],
    }

    addProject(project)
    navigate('/projects')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">新建项目</h1>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    i < step ? 'bg-primary-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    i <= step ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className={cn(
                    'mx-4 h-0.5 w-20',
                    i < step ? 'bg-primary-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">项目编号</label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="例：ZJCG-2026-009"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">预算金额（元）</label>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="请输入预算金额"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">采购方式</label>
              <select
                value={procurementMethod}
                onChange={(e) => setProcurementMethod(e.target.value as Project['procurementMethod'])}
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              >
                {procurementMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">行业</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="请输入所属行业"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">投标企业列表</label>
              <button
                onClick={addEnterprise}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
                添加企业
              </button>
            </div>
            <div className="space-y-3">
              {enterprises.map((ent, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={ent.name}
                    onChange={(e) => updateEnterprise(i, 'name', e.target.value)}
                    placeholder="企业名称"
                    className="h-10 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  />
                  <select
                    value={ent.qualification}
                    onChange={(e) => updateEnterprise(i, 'qualification', e.target.value)}
                    className="h-10 w-28 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  >
                    {qualifications.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeEnterprise(i)}
                    disabled={enterprises.length <= 1}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      enterprises.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-400 hover:bg-red-50 hover:text-red-500'
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">开标时间</label>
              <input
                type="datetime-local"
                value={openBidTime}
                onChange={(e) => setOpenBidTime(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">备注</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="请输入备注信息"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 resize-none"
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
              step === 0 ? 'invisible' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            上一步
          </button>
          <div className="flex items-center gap-3">
            {step < 2 ? (
              <button
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                提交
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import type { Expert } from '@/types';
import {
  Users,
  UserCheck,
  Shield,
  ShieldAlert,
  MapPin,
  Building2,
  Clock,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ToggleLeft,
  ToggleRight,
  Award,
  Briefcase,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CREDIT_BADGE: Record<string, { bg: string; text: string; bar: string }> = {
  'A+': { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-400' },
  'A': { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-400' },
  'B+': { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-400' },
  'B': { bg: 'bg-gray-100', text: 'text-gray-600', bar: 'bg-gray-400' },
  'C': { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-400' },
};

const PROFESSION_TAG_COLORS = [
  'bg-blue-50 text-blue-700',
  'bg-purple-50 text-purple-700',
  'bg-teal-50 text-teal-700',
  'bg-indigo-50 text-indigo-700',
  'bg-pink-50 text-pink-700',
];

type TabKey = 'experts' | 'avoidance';

interface AvoidanceRule {
  id: string;
  label: string;
  description: string;
  icon: typeof Shield;
  enabled: boolean;
}

const DEFAULT_RULES: AvoidanceRule[] = [
  { id: 'unit', label: '单位回避', description: '同一单位的专家不得评审本单位投标项目', icon: Building2, enabled: true },
  { id: 'region', label: '地域回避', description: '项目所在地专家回避', icon: MapPin, enabled: true },
  { id: 'history', label: '历史项目回避', description: '近3年内参与过同一企业项目的专家回避', icon: Clock, enabled: false },
  { id: 'credit', label: '信用等级过滤', description: '信用等级C级专家暂停抽取', icon: Award, enabled: true },
];

function maskPhone(phone: string): string {
  if (phone.length >= 11) {
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
  return phone;
}

export default function Experts() {
  const { experts, extractionRecords, projects } = useStore();

  const [activeTab, setActiveTab] = useState<TabKey>('experts');
  const [professionFilter, setProfessionFilter] = useState('全部');
  const [regionFilter, setRegionFilter] = useState('全部');
  const [creditFilter, setCreditFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [detailExpert, setDetailExpert] = useState<Expert | null>(null);
  const [avoidanceExpert, setAvoidanceExpert] = useState<Expert | null>(null);
  const [newAvoidanceUnit, setNewAvoidanceUnit] = useState('');

  const [rules, setRules] = useState<AvoidanceRule[]>(DEFAULT_RULES);
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [newCustomUnit, setNewCustomUnit] = useState('');

  const uniqueProfessions = useMemo(() => {
    const set = new Set<string>();
    experts.forEach((e) => e.profession.forEach((p) => set.add(p)));
    return ['全部', ...Array.from(set).sort()];
  }, [experts]);

  const uniqueRegions = useMemo(() => {
    return ['全部', ...Array.from(new Set(experts.map((e) => e.region))).sort()];
  }, [experts]);

  const filteredExperts = useMemo(() => {
    return experts.filter((e) => {
      if (professionFilter !== '全部' && !e.profession.includes(professionFilter)) return false;
      if (regionFilter !== '全部' && e.region !== regionFilter) return false;
      if (creditFilter !== '全部' && e.creditRating !== creditFilter) return false;
      if (statusFilter !== '全部' && e.status !== statusFilter) return false;
      if (searchName && !e.name.includes(searchName)) return false;
      return true;
    });
  }, [experts, professionFilter, regionFilter, creditFilter, statusFilter, searchName]);

  const totalPages = Math.max(1, Math.ceil(filteredExperts.length / pageSize));
  const pagedExperts = filteredExperts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalExperts = experts.length;
  const availableCount = experts.filter((e) => e.status === '可用').length;
  const creditDistribution = useMemo(() => {
    const dist: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0 };
    experts.forEach((e) => { dist[e.creditRating] = (dist[e.creditRating] || 0) + 1; });
    return dist;
  }, [experts]);

  const maxCreditCount = Math.max(...Object.values(creditDistribution), 1);

  const getExpertExtractions = (expertId: string) => {
    return extractionRecords.filter((r) => r.experts.some((ee) => ee.expertId === expertId));
  };

  const toggleRule = (ruleId: string) => {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)));
  };

  const addCustomRule = () => {
    const trimmed = newCustomUnit.trim();
    if (trimmed && !customRules.includes(trimmed)) {
      setCustomRules((prev) => [...prev, trimmed]);
      setNewCustomUnit('');
    }
  };

  const removeCustomRule = (rule: string) => {
    setCustomRules((prev) => prev.filter((r) => r !== rule));
  };

  const addAvoidanceUnit = () => {
    const trimmed = newAvoidanceUnit.trim();
    if (trimmed && avoidanceExpert && !avoidanceExpert.avoidanceUnits.includes(trimmed)) {
      avoidanceExpert.avoidanceUnits.push(trimmed);
      setNewAvoidanceUnit('');
      setAvoidanceExpert({ ...avoidanceExpert });
    }
  };

  const removeAvoidanceUnit = (unit: string) => {
    if (avoidanceExpert) {
      avoidanceExpert.avoidanceUnits = avoidanceExpert.avoidanceUnits.filter((u) => u !== unit);
      setAvoidanceExpert({ ...avoidanceExpert });
    }
  };

  const statusOptions = ['全部', '可用', '已抽取', '已确认', '已回避', '迟到'];
  const creditOptions = ['全部', 'A+', 'A', 'B+', 'B', 'C'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">专家管理</h1>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        {(['experts', 'avoidance'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-3 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab === 'experts' ? '专家库' : '回避规则'}
          </button>
        ))}
      </div>

      {activeTab === 'experts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalExperts}</p>
                  <p className="text-sm text-gray-500">专家总数</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
                  <p className="text-sm text-gray-500">可用专家</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-3">信用等级分布</p>
              <div className="space-y-1.5">
                {(['A+', 'A', 'B+', 'B', 'C'] as const).map((rating) => {
                  const count = creditDistribution[rating] || 0;
                  const credit = CREDIT_BADGE[rating];
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium w-6', credit.text)}>{rating}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', credit.bar)}
                          style={{ width: `${(count / maxCreditCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">筛选</span>
              </div>
              <select
                value={professionFilter}
                onChange={(e) => { setProfessionFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              >
                {uniqueProfessions.map((p) => <option key={p} value={p}>{p === '全部' ? '全部专业' : p}</option>)}
              </select>
              <select
                value={regionFilter}
                onChange={(e) => { setRegionFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              >
                {uniqueRegions.map((r) => <option key={r} value={r}>{r === '全部' ? '全部地区' : r}</option>)}
              </select>
              <select
                value={creditFilter}
                onChange={(e) => { setCreditFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              >
                {creditOptions.map((c) => <option key={c} value={c}>{c === '全部' ? '全部信用' : c}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              >
                {statusOptions.map((s) => <option key={s} value={s}>{s === '全部' ? '全部状态' : s}</option>)}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索姓名"
                  value={searchName}
                  onChange={(e) => { setSearchName(e.target.value); setCurrentPage(1); }}
                  className="h-9 w-48 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">姓名</th>
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">手机号</th>
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">专业</th>
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">地区</th>
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">单位</th>
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">信用等级</th>
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">当前状态</th>
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedExperts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                      暂无匹配的专家
                    </td>
                  </tr>
                )}
                {pagedExperts.map((expert) => {
                  const credit = CREDIT_BADGE[expert.creditRating];
                  return (
                    <tr key={expert.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{expert.name}</td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{maskPhone(expert.phone)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {expert.profession.map((p, i) => (
                            <span
                              key={p}
                              className={cn(
                                'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                                PROFESSION_TAG_COLORS[i % PROFESSION_TAG_COLORS.length]
                              )}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{expert.region}</td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">{expert.unit}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            credit.bg,
                            credit.text
                          )}
                        >
                          {expert.creditRating}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={expert.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailExpert(expert)}
                            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            查看详情
                          </button>
                          <button
                            onClick={() => { setAvoidanceExpert(expert); setNewAvoidanceUnit(''); }}
                            className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 text-xs font-medium transition-colors"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            设置回避
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                共 {filteredExperts.length} 条记录，第 {currentPage}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'avoidance' && (
        <div className="space-y-4">
          {rules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.id}
                className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      rule.enabled ? 'bg-blue-50' : 'bg-gray-100'
                    )}>
                      <Icon className={cn('h-5 w-5', rule.enabled ? 'text-blue-600' : 'text-gray-400')} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{rule.label}</span>
                        {rule.enabled && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                            规则生效中
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{rule.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className="transition-colors"
                  >
                    {rule.enabled ? (
                      <ToggleRight className="h-8 w-8 text-primary-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">自定义回避</span>
                <p className="mt-0.5 text-xs text-gray-500">添加需要回避的单位名称</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="输入单位名称"
                value={newCustomUnit}
                onChange={(e) => setNewCustomUnit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomRule()}
                className="h-9 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
              <button
                onClick={addCustomRule}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
            </div>
            {customRules.length > 0 && (
              <div className="space-y-2">
                {customRules.map((rule) => (
                  <div
                    key={rule}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5"
                  >
                    <span className="text-sm text-gray-700">{rule}</span>
                    <button
                      onClick={() => removeCustomRule(rule)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {customRules.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">暂无自定义回避规则</p>
            )}
          </div>
        </div>
      )}

      {detailExpert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailExpert(null)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 font-serif">专家详情</h3>
              <button
                onClick={() => setDetailExpert(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">姓名</p>
                  <p className="text-sm font-medium text-gray-900">{detailExpert.name}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">手机号</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{maskPhone(detailExpert.phone)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">单位</p>
                  <p className="text-sm font-medium text-gray-900">{detailExpert.unit}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">地区</p>
                  <p className="text-sm font-medium text-gray-900">{detailExpert.region}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">专业领域</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailExpert.profession.map((p, i) => (
                    <span
                      key={p}
                      className={cn(
                        'inline-flex items-center rounded px-2 py-1 text-xs font-medium',
                        PROFESSION_TAG_COLORS[i % PROFESSION_TAG_COLORS.length]
                      )}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">信用等级</p>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
                      CREDIT_BADGE[detailExpert.creditRating].bg,
                      CREDIT_BADGE[detailExpert.creditRating].text
                    )}
                  >
                    {detailExpert.creditRating}
                  </span>
                  <div className="flex-1">
                    <div className="flex gap-1">
                      {(['A+', 'A', 'B+', 'B', 'C'] as const).map((r) => (
                        <div
                          key={r}
                          className={cn(
                            'h-2 flex-1 rounded-full',
                            r === detailExpert.creditRating
                              ? CREDIT_BADGE[r].bar
                              : 'bg-gray-200'
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {(['A+', 'A', 'B+', 'B', 'C'] as const).map((r) => (
                        <span key={r} className={cn('text-[10px]', r === detailExpert.creditRating ? CREDIT_BADGE[r].text : 'text-gray-300')}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">回避单位</p>
                  {detailExpert.avoidanceUnits.length > 0 ? (
                    <div className="space-y-1">
                      {detailExpert.avoidanceUnits.map((u) => (
                        <span key={u} className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700 mr-1 mb-1">
                          <ShieldAlert className="h-3 w-3" />
                          {u}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300">无</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">回避地区</p>
                  {detailExpert.avoidanceRegions.length > 0 ? (
                    <div className="space-y-1">
                      {detailExpert.avoidanceRegions.map((r) => (
                        <span key={r} className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-1 text-xs text-orange-700 mr-1 mb-1">
                          <MapPin className="h-3 w-3" />
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300">无</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">近期抽取记录</p>
                {(() => {
                  const records = getExpertExtractions(detailExpert.id);
                  if (records.length === 0) return <p className="text-xs text-gray-300">暂无抽取记录</p>;
                  return (
                    <div className="space-y-2">
                      {records.map((rec) => {
                        const project = projects.find((p) => p.id === rec.projectId);
                        const ee = rec.experts.find((e) => e.expertId === detailExpert.id);
                        return (
                          <div key={rec.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">
                                {project?.projectCode ?? '--'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {project?.industry ?? ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={rec.approvalStatus} size="sm" />
                              <span className={cn(
                                'text-xs font-medium',
                                ee?.response === '已确认' ? 'text-green-600' :
                                ee?.response === '已回避' ? 'text-red-600' : 'text-gray-500'
                              )}>
                                {ee?.response ?? '--'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">状态记录</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div className="h-6 w-px bg-gray-200" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">当前状态：<StatusBadge status={detailExpert.status} size="sm" /></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">入册时间：{detailExpert.confirmedAt ? new Date(detailExpert.confirmedAt).toLocaleString('zh-CN') : '系统默认'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {avoidanceExpert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAvoidanceExpert(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 font-serif">设置回避 - {avoidanceExpert.name}</h3>
              <button
                onClick={() => setAvoidanceExpert(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">当前回避单位</p>
                {avoidanceExpert.avoidanceUnits.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {avoidanceExpert.avoidanceUnits.map((u) => (
                      <span key={u} className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                        {u}
                        <button onClick={() => removeAvoidanceUnit(u)} className="hover:text-red-900 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 mb-3">暂无回避单位</p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="添加回避单位"
                    value={newAvoidanceUnit}
                    onChange={(e) => setNewAvoidanceUnit(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAvoidanceUnit()}
                    className="h-9 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    onClick={addAvoidanceUnit}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    添加
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">回避地区</p>
                {avoidanceExpert.avoidanceRegions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {avoidanceExpert.avoidanceRegions.map((r) => (
                      <span key={r} className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-1 text-xs text-orange-700">
                        <MapPin className="h-3 w-3" />
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300">暂无回避地区</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setAvoidanceExpert(null)}
                className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

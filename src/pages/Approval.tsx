import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import { CheckCircle, XCircle, Clock, Eye, CheckCheck } from 'lucide-react';

const CREDIT_BADGE: Record<string, { bg: string; text: string }> = {
  'A+': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'A': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'B+': { bg: 'bg-green-100', text: 'text-green-700' },
  'B': { bg: 'bg-gray-100', text: 'text-gray-600' },
  'C': { bg: 'bg-red-100', text: 'text-red-700' },
};

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
];

export default function Approval() {
  const {
    extractionRecords,
    experts,
    projects,
    approveExtraction,
    rejectExtraction,
    addNotification,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);

  const pendingRecords = useMemo(
    () => extractionRecords.filter((r) => r.approvalStatus === '待审批'),
    [extractionRecords]
  );

  const completedRecords = useMemo(
    () => extractionRecords.filter((r) => r.approvalStatus !== '待审批'),
    [extractionRecords]
  );

  const getProject = (projectId: string) =>
    projects.find((p) => p.id === projectId);

  const getExpert = (expertId: string) =>
    experts.find((e) => e.id === expertId);

  const handleApprove = (recordId: string) => {
    approveExtraction(recordId, '交易中心主任');
    addNotification('抽取方案已审批通过', 'success');
  };

  const handleReject = (recordId: string) => {
    rejectExtraction(recordId);
    addNotification('抽取方案已驳回', 'danger');
  };

  const handleBatchApprove = () => {
    pendingRecords.forEach((r) => {
      approveExtraction(r.id, '交易中心主任');
    });
    addNotification(`已批量通过${pendingRecords.length}个抽取方案`, 'success');
  };

  const detailRecord = detailRecordId
    ? extractionRecords.find((r) => r.id === detailRecordId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">审批管理</h1>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`relative px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          待审批
          {pendingRecords.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {pendingRecords.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === 'completed'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          已审批
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRecords.length > 1 && (
            <div className="flex justify-end">
              <button
                onClick={handleBatchApprove}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors shadow-sm"
              >
                <CheckCheck className="h-4 w-4" />
                批量通过
              </button>
            </div>
          )}

          {pendingRecords.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <CheckCircle className="h-12 w-12 mb-3" />
              <p className="text-sm">暂无待审批记录</p>
            </div>
          )}

          {pendingRecords.map((record) => {
            const project = getProject(record.projectId);
            const recordExperts = record.experts
              .map((ee) => ({ ...ee, expert: getExpert(ee.expertId) }))
              .filter((e) => e.expert);

            return (
              <div
                key={record.id}
                className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-gray-900 font-serif">
                        {project?.projectCode ?? '--'}
                      </span>
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                        {project?.industry ?? '--'}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <StatusBadge status={record.approvalStatus} />
                </div>

                <div className="mb-4">
                  <div className="flex items-center -space-x-2 mb-3">
                    {recordExperts.slice(0, 5).map((ee, i) => (
                      <div
                        key={ee.expertId}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white ring-2 ring-white ${
                          AVATAR_COLORS[i % AVATAR_COLORS.length]
                        }`}
                        title={ee.expert!.name}
                      >
                        {ee.expert!.name.charAt(0)}
                      </div>
                    ))}
                    {recordExperts.length > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 ring-2 ring-white">
                        +{recordExperts.length - 5}
                      </div>
                    )}
                    <span className="ml-3 text-xs text-gray-400">
                      共 {recordExperts.length} 位专家
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-100 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">姓名</th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">专业</th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">地区</th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">信用等级</th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">权重值</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recordExperts.map((ee) => {
                        const credit = CREDIT_BADGE[ee.expert!.creditRating] ?? CREDIT_BADGE['B'];
                        return (
                          <tr key={ee.expertId} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-medium text-gray-900">
                              {ee.expert!.name}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">
                              {ee.expert!.profession.join('、')}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">{ee.expert!.region}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${credit.bg} ${credit.text}`}
                              >
                                {ee.expert!.creditRating}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">{ee.weight}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleReject(record.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    驳回
                  </button>
                  <button
                    onClick={() => handleApprove(record.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    通过
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3.5 text-left font-medium text-gray-500">项目编号</th>
                <th className="px-6 py-3.5 text-left font-medium text-gray-500">专家数量</th>
                <th className="px-6 py-3.5 text-left font-medium text-gray-500">审批状态</th>
                <th className="px-6 py-3.5 text-left font-medium text-gray-500">审批人</th>
                <th className="px-6 py-3.5 text-left font-medium text-gray-500">审批时间</th>
                <th className="px-6 py-3.5 text-left font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {completedRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    暂无已审批记录
                  </td>
                </tr>
              )}
              {completedRecords.map((record) => {
                const project = getProject(record.projectId);
                return (
                  <tr key={record.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {project?.projectCode ?? '--'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{record.experts.length}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.approvalStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-gray-600">{record.approvedBy ?? '--'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {record.approvedAt
                        ? new Date(record.approvedAt).toLocaleString('zh-CN')
                        : '--'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setDetailRecordId(record.id)}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDetailRecordId(null)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 font-serif">抽取详情</h3>
              <button
                onClick={() => setDetailRecordId(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                项目编号：
                <span className="font-medium text-gray-900">
                  {getProject(detailRecord.projectId)?.projectCode ?? '--'}
                </span>
              </span>
              <StatusBadge status={detailRecord.approvalStatus} size="sm" />
              <span className="text-gray-400">
                审批人：{detailRecord.approvedBy ?? '--'}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">姓名</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">专业</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">地区</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">信用等级</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">权重值</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detailRecord.experts.map((ee) => {
                    const expert = getExpert(ee.expertId);
                    if (!expert) return null;
                    const credit = CREDIT_BADGE[expert.creditRating] ?? CREDIT_BADGE['B'];
                    return (
                      <tr key={ee.expertId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{expert.name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{expert.profession.join('、')}</td>
                        <td className="px-4 py-2.5 text-gray-600">{expert.region}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${credit.bg} ${credit.text}`}
                          >
                            {expert.creditRating}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{ee.weight}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

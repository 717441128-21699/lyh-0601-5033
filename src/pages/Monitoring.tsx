import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, UserX, ChevronRight, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import type { Project } from '@/types';

const STATUS_COLUMNS: { status: Project['status']; label: string; headerBg: string; headerText: string; pulse?: boolean }[] = [
  { status: '待开标', label: '待开标', headerBg: 'bg-gray-500', headerText: 'text-white' },
  { status: '开标中', label: '开标中', headerBg: 'bg-blue-500', headerText: 'text-white' },
  { status: '评标中', label: '评标中', headerBg: 'bg-green-500', headerText: 'text-white', pulse: true },
  { status: '结果公示', label: '结果公示', headerBg: 'bg-amber-500', headerText: 'text-white' },
];

const NEXT_STATUS: Record<Project['status'], Project['status'] | null> = {
  '待开标': '开标中',
  '开标中': '评标中',
  '评标中': '结果公示',
  '结果公示': null,
};

function formatBudget(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`;
  }
  return `¥${amount.toLocaleString()}`;
}

function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getCurrentStageStartTime(project: Project): string | null {
  const currentTiming = project.stageTimings.find((t) => t.stage === project.status && !t.endTime);
  return currentTiming?.startTime ?? null;
}

export default function Monitoring() {
  const {
    projects,
    experts,
    evaluationRooms,
    extractionRecords,
    updateProjectStatus,
    updateExpertStatus,
    weightedRandomExtraction,
    addNotification,
  } = useStore();

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clockDisplay = useMemo(() => {
    const d = new Date(now);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }, [now]);

  const getRoomName = (roomId?: string) => {
    if (!roomId) return '未分配';
    const room = evaluationRooms.find((r) => r.id === roomId);
    return room ? room.name : '未知';
  };

  const getExpertStatusForProject = (projectId: string) => {
    const records = extractionRecords.filter((r) => r.projectId === projectId);
    let confirmed = 0;
    let total = 0;
    records.forEach((r) => {
      r.experts.forEach((e) => {
        if (e.isSelected) {
          total++;
          if (e.response === '已确认') confirmed++;
        }
      });
    });
    return { confirmed, total };
  };

  const handleMoveStatus = (projectId: string, currentStatus: Project['status']) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    updateProjectStatus(projectId, next);
  };

  const lateExperts = useMemo(() => {
    return experts.filter((e) => e.status === '迟到');
  }, [experts]);

  const handleSupplementaryExtract = (expertId: string, projectId: string) => {
    updateExpertStatus(expertId, '已回避');
    weightedRandomExtraction(projectId, 1);
    addNotification('专家迟到，已触发补抽并通知值班组长', 'danger');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const pendingProjects = projects.filter((p) => p.status === '待开标');
      if (pendingProjects.length > 0) {
        const randomIndex = Math.floor(Math.random() * pendingProjects.length);
        updateProjectStatus(pendingProjects[randomIndex].id, '开标中');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [projects, updateProjectStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      const evaluatingProjectIds = new Set(
        projects.filter((p) => p.status === '评标中').map((p) => p.id)
      );

      experts.forEach((expert) => {
        if (expert.status !== '已抽取') return;
        const relatedRecords = extractionRecords.filter(
          (r) => evaluatingProjectIds.has(r.projectId) &&
            r.experts.some((e) => e.expertId === expert.id)
        );
        relatedRecords.forEach((record) => {
          const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
          if (new Date(record.createdAt).getTime() < fifteenMinutesAgo) {
            updateExpertStatus(expert.id, '迟到');
          }
        });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [experts, extractionRecords, projects, updateExpertStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif text-gray-900">开评标监控</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm">
          <Clock className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-mono font-semibold text-gray-800">{clockDisplay}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.status);
          return (
            <div key={col.status} className="flex flex-col">
              <div
                className={`${col.headerBg} ${col.headerText} px-4 py-3 rounded-t-xl flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  {col.pulse && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                  )}
                  <span className="font-semibold font-serif">{col.label}</span>
                </div>
                <span className="text-sm opacity-90">{colProjects.length}</span>
              </div>

              <div className="bg-gray-50 rounded-b-xl p-2 space-y-3 min-h-[400px]">
                {colProjects.map((project) => {
                  const stageStart = getCurrentStageStartTime(project);
                  const elapsed = stageStart ? now - new Date(stageStart).getTime() : 0;
                  const { confirmed, total } = getExpertStatusForProject(project.id);
                  const nextStatus = NEXT_STATUS[project.status];

                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg shadow-sm p-3 cursor-grab hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {project.projectCode}
                        </span>
                        <StatusBadge status={project.status} size="sm" />
                      </div>

                      <div className="text-xs text-gray-500 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span>行业</span>
                          <span className="text-gray-700 font-medium">{project.industry}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>预算金额</span>
                          <span className="text-gray-700 font-medium">{formatBudget(project.budgetAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>开标时间</span>
                          <span className="text-gray-700 font-medium">
                            {new Date(project.openBidTime).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>评标室</span>
                          <span className="text-gray-700 font-medium">{getRoomName(project.evaluationRoomId)}</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">已用时</span>
                          <span className="font-mono text-blue-600 font-semibold">
                            {stageStart ? formatElapsedTime(elapsed) : '--:--:--'}
                          </span>
                        </div>
                      </div>

                      {project.status === '评标中' && total > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-gray-400">
                              <Users className="w-3.5 h-3.5" />
                              <span>专家确认</span>
                            </div>
                            <span className={`font-semibold ${confirmed === total ? 'text-green-600' : 'text-amber-600'}`}>
                              {confirmed}/{total}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${confirmed === total ? 'bg-green-500' : 'bg-amber-500'}`}
                              style={{ width: `${total > 0 ? (confirmed / total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {nextStatus && (
                        <button
                          onClick={() => handleMoveStatus(project.id, project.status)}
                          className="mt-2.5 w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <span>推进至{nextStatus}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {colProjects.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    暂无项目
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lateExperts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold font-serif text-gray-800">迟到专家预警</h2>
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              {lateExperts.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {lateExperts.map((expert) => {
              const relatedRecord = extractionRecords.find((r) =>
                r.experts.some((e) => e.expertId === expert.id)
              );
              const projectId = relatedRecord?.projectId;
              const project = projectId
                ? projects.find((p) => p.id === projectId)
                : null;

              return (
                <div
                  key={expert.id}
                  className="border-2 border-red-400 rounded-lg p-4 animate-pulse bg-red-50/30"
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UserX className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-gray-800">{expert.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>项目: {project?.projectCode ?? '未知'}</div>
                    <div>专业: {expert.profession.join('、')}</div>
                    <div>单位: {expert.unit}</div>
                  </div>
                  {projectId && (
                    <button
                      onClick={() => handleSupplementaryExtract(expert.id, projectId)}
                      className="mt-3 w-full py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                    >
                      补抽专家
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

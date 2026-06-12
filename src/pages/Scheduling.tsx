import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import { ArrowRight, RefreshCcw, CheckCircle, XCircle } from 'lucide-react';
import type { ExtractionRecord, Expert } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  '待开标': 'bg-gold-200',
  '开标中': 'bg-blue-200',
  '评标中': 'bg-green-200',
  '结果公示': 'bg-gray-200',
};

const CREDIT_BADGE: Record<string, { bg: string; text: string }> = {
  'A+': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'A': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'B+': { bg: 'bg-green-100', text: 'text-green-700' },
  'B': { bg: 'bg-gray-100', text: 'text-gray-600' },
  'C': { bg: 'bg-red-100', text: 'text-red-700' },
};

const RESPONSE_COLORS: Record<string, string> = {
  '待确认': 'bg-yellow-400',
  '已确认': 'bg-green-500',
  '已回避': 'bg-red-500',
};

function getWeekDates(referenceDate: Date): Date[] {
  const day = referenceDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface ExtractionResult {
  record: ExtractionRecord;
  selectedExperts: Expert[];
}

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_SLOTS = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function Scheduling() {
  const navigate = useNavigate();
  const {
    projects,
    experts,
    evaluationRooms,
    updateProject,
    updateRoomStatus,
    updateRoomScheduleSlot,
    weightedRandomExtraction,
    addExtractionRecord,
    addNotification,
    extractionRecords,
  } = useStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [expertCount, setExpertCount] = useState(3);
  const [professionFilter, setProfessionFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [extractedResult, setExtractedResult] = useState<ExtractionResult | null>(null);
  const [submittedProjectIds, setSubmittedProjectIds] = useState<Set<string>>(new Set());

  const referenceDate = new Date();
  referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
  const weekDates = useMemo(() => getWeekDates(referenceDate), [weekOffset]);

  const pendingProjects = useMemo(() => projects.filter((p) => p.status === '待开标'), [projects]);

  const pendingProjectsWithoutPendingExtraction = useMemo(() => {
    const projectIdsWithPendingExtraction = new Set(
      extractionRecords
        .filter((r) => r.approvalStatus === '待审批')
        .map((r) => r.projectId)
    );
    return pendingProjects.filter((p) => !projectIdsWithPendingExtraction.has(p.id));
  }, [pendingProjects, extractionRecords]);

  const uniqueProfessions = useMemo(() => {
    const set = new Set<string>();
    experts.forEach((e) => e.profession.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [experts]);

  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    experts.forEach((e) => set.add(e.region));
    return Array.from(set).sort();
  }, [experts]);

  const projectsWithoutRooms = useMemo(
    () => projects.filter((p) => p.status === '待开标' && !p.evaluationRoomId),
    [projects]
  );

  const roomScheduleMap = useMemo(() => {
    const map: Record<string, Record<string, string[]>> = {};
    evaluationRooms.forEach((room) => {
      map[room.id] = {};
      weekDates.forEach((d) => {
        const key = formatDateKey(d);
        map[room.id][key] = [];
      });
    });
    projects.forEach((project) => {
      if (!project.evaluationRoomId) return;
      const room = map[project.evaluationRoomId];
      if (!room) return;
      project.stageTimings.forEach((timing) => {
        const start = new Date(timing.startTime);
        const dateKey = formatDateKey(start);
        if (room[dateKey]) {
          room[dateKey].push(project.id);
        }
      });
    });
    evaluationRooms.forEach((room) => {
      room.scheduleSlots.forEach((slot) => {
        if (map[room.id] && map[room.id][slot.date]) {
          if (!map[room.id][slot.date].includes(slot.projectId)) {
            map[room.id][slot.date].push(slot.projectId);
          }
        }
      });
    });
    return map;
  }, [evaluationRooms, projects, weekDates]);

  const getBlockSpan = (project: typeof projects[0], dateKey: string) => {
    const relevant = project.stageTimings.filter((t) => {
      const d = formatDateKey(new Date(t.startTime));
      return d === dateKey;
    });
    if (relevant.length === 0) {
      const slot = evaluationRooms
        .flatMap((r) => r.scheduleSlots)
        .find((s) => s.projectId === project.id && s.date === dateKey);
      if (slot) {
        const startHour = parseInt(slot.startTime.split(':')[0]);
        const endHour = parseInt(slot.endTime.split(':')[0]);
        return Math.max(1, endHour - startHour);
      }
      return 1;
    }
    const first = relevant[0];
    const startHour = new Date(first.startTime).getHours();
    const endHour = first.endTime ? new Date(first.endTime).getHours() : startHour + 1;
    return Math.max(1, endHour - startHour);
  };

  const getBlockStartHour = (project: typeof projects[0], dateKey: string) => {
    const relevant = project.stageTimings.filter((t) => formatDateKey(new Date(t.startTime)) === dateKey);
    if (relevant.length === 0) {
      const slot = evaluationRooms
        .flatMap((r) => r.scheduleSlots)
        .find((s) => s.projectId === project.id && s.date === dateKey);
      if (slot) {
        return parseInt(slot.startTime.split(':')[0]);
      }
      return 8;
    }
    return new Date(relevant[0].startTime).getHours();
  };

  const handleGenerateSchedule = () => {
    const sorted = [...projectsWithoutRooms].sort(
      (a, b) => new Date(a.openBidTime).getTime() - new Date(b.openBidTime).getTime()
    );
    const freeRooms = evaluationRooms.filter((r) => r.status === '空闲');

    sorted.forEach((project) => {
      const projectDate = new Date(project.openBidTime);
      const dateKey = formatDateKey(projectDate);
      const startTime = formatTime(projectDate);
      const endTimeDate = new Date(projectDate.getTime() + 2 * 60 * 60 * 1000);
      const endTime = formatTime(endTimeDate);

      const room = freeRooms.find((r) => {
        const existing = r.scheduleSlots.filter((s) => s.date === dateKey);
        const projectStartHour = projectDate.getHours();
        return existing.every((s) => {
          const slotStart = parseInt(s.startTime.split(':')[0]);
          const slotEnd = parseInt(s.endTime.split(':')[0]);
          return projectStartHour >= slotEnd || projectStartHour < slotStart;
        });
      });

      if (room) {
        updateProject(project.id, { evaluationRoomId: room.id });
        updateRoomStatus(room.id, '占用', project.id);
        updateRoomScheduleSlot(room.id, {
          date: dateKey,
          startTime,
          endTime,
          projectId: project.id,
        });
        const idx = freeRooms.indexOf(room);
        if (idx > -1) freeRooms.splice(idx, 1);
        addNotification(`项目 ${project.projectCode} 已分配至 ${room.name}`, 'success');
      }
    });
  };

  const handleExtract = () => {
    if (!selectedProjectId) return;
    const result = weightedRandomExtraction(selectedProjectId, expertCount, professionFilter || undefined, regionFilter || undefined, false);
    if (result) {
      setExtractedResult(result);
    } else {
      addNotification('未找到符合条件的专家', 'warning');
    }
  };

  const handleSubmitApproval = () => {
    if (!extractedResult) return;
    const { record, selectedExperts } = extractedResult;
    addExtractionRecord(record, selectedExperts.map((e) => e.id));
    setSubmittedProjectIds((prev) => new Set(prev).add(record.projectId));
    setExtractedResult(null);
    setSelectedProjectId('');
    addNotification('抽取结果已提交审批', 'success');
  };

  const extractedExperts = useMemo(() => {
    if (!extractedResult) return [];
    return extractedResult.selectedExperts
      .map((expert) => {
        const ee = extractedResult.record.experts.find((e) => e.expertId === expert.id);
        if (!ee) return null;
        return { ...expert, weight: ee.weight, response: ee.response };
      })
      .filter(Boolean) as (typeof experts[0] & { weight: number; response: string })[];
  }, [extractedResult]);

  const maxWeight = 10;

  const selectedProjectHasPending = useMemo(() => {
    if (!selectedProjectId) return false;
    return extractionRecords.some(
      (r) => r.projectId === selectedProjectId && r.approvalStatus === '待审批'
    );
  }, [selectedProjectId, extractionRecords]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif text-gray-900">智能调度</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/approval')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            前往审批
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleGenerateSchedule}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            <RefreshCcw className="h-4 w-4" />
            生成调度方案
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-[60%] space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-serif text-gray-800">评标室日历视图</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  上一周
                </button>
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  今天
                </button>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  下一周
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-px bg-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-2 text-xs text-gray-500 font-medium flex items-center justify-center">
                    评标室
                  </div>
                  {weekDates.map((d, i) => (
                    <div key={i} className="bg-gray-50 p-2 text-center">
                      <div className="text-xs text-gray-500">{DAY_LABELS[i]}</div>
                      <div className="text-sm font-semibold text-gray-700">{d.getDate()}</div>
                    </div>
                  ))}

                  {evaluationRooms.map((room) => (
                    <div key={`room-row-${room.id}`} className="contents">
                      <div className="bg-white p-2 flex flex-col items-center justify-center text-xs">
                        <span className="font-medium text-gray-700">{room.name}</span>
                        <span className="text-gray-400 mt-0.5">{room.floor}F · {room.capacity}人</span>
                        <StatusBadge status={room.status} size="sm" />
                      </div>
                      {weekDates.map((d, di) => {
                        const dateKey = formatDateKey(d);
                        const roomProjects = projects.filter(
                          (p) => p.evaluationRoomId === room.id && (
                            p.stageTimings.some((t) => formatDateKey(new Date(t.startTime)) === dateKey) ||
                            room.scheduleSlots.some((s) => s.projectId === p.id && s.date === dateKey)
                          )
                        );
                        const slotProjects = room.scheduleSlots
                          .filter((s) => s.date === dateKey)
                          .map((s) => projects.find((p) => p.id === s.projectId))
                          .filter(Boolean) as typeof projects;
                        const allProjects = [...roomProjects];
                        slotProjects.forEach((p) => {
                          if (!allProjects.find((ap) => ap.id === p.id)) {
                            allProjects.push(p);
                          }
                        });
                        return (
                          <div key={`${room.id}-${di}`} className="bg-white p-1">
                            <div className="relative w-full" style={{ height: `${TIME_SLOTS.length * 20}px` }}>
                              {allProjects.map((project) => {
                                const span = getBlockSpan(project, dateKey);
                                const startHour = getBlockStartHour(project, dateKey);
                                const top = (startHour - 8) * 20;
                                const height = span * 20 - 2;
                                return (
                                  <div
                                    key={project.id}
                                    className={`absolute left-0.5 right-0.5 rounded px-1 flex items-center ${STATUS_COLORS[project.status] || 'bg-gray-200'}`}
                                    style={{ top: `${top}px`, height: `${height}px` }}
                                  >
                                    <span className="text-[10px] font-medium text-gray-700 truncate">
                                      {project.projectCode}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded ${color}`} />
                      <span>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[40%] space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold font-serif text-gray-800 mb-4">专家抽取</h2>

            {selectedProjectHasPending && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">该项目有待审批的抽取结果，请先处理</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">选择项目</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setExtractedResult(null);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={pendingProjectsWithoutPendingExtraction.length === 0}
                >
                  <option value="">请选择待开标项目</option>
                  {pendingProjectsWithoutPendingExtraction.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} - {p.industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">抽取人数</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={expertCount}
                  onChange={(e) => setExpertCount(Math.max(1, Math.min(7, Number(e.target.value))))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">专业筛选</label>
                <select
                  value={professionFilter}
                  onChange={(e) => setProfessionFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部专业</option>
                  {uniqueProfessions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">地区筛选</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部地区</option>
                  {uniqueRegions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExtract}
                disabled={!selectedProjectId || selectedProjectHasPending}
                className="w-full px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                开始抽取
              </button>
            </div>
          </div>

          {extractedExperts.length > 0 && extractedResult && (
            <div className="bg-white rounded-xl shadow-sm p-5 animate-slide-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold font-serif text-gray-800">抽取结果</h3>
                <button
                  onClick={() => {
                    setExtractedResult(null);
                    setExtractedResult(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  重新抽取
                </button>
              </div>
              <div className="space-y-3">
                {extractedExperts.map((expert) => {
                  const credit = CREDIT_BADGE[expert.creditRating] || CREDIT_BADGE['B'];
                  return (
                    <div key={expert.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{expert.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${credit.bg} ${credit.text}`}>
                            {expert.creditRating}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${RESPONSE_COLORS[expert.response]}`} />
                            <span className="text-xs text-gray-500">{expert.response}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {expert.profession.map((p) => (
                          <span key={p} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{p}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>{expert.region}</span>
                        <span>·</span>
                        <span>{expert.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-8">权重</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(expert.weight / maxWeight) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-4">{expert.weight}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setExtractedResult(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitApproval}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  提交审批
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

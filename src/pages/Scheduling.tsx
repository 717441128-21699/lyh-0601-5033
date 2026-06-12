import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';

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

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_SLOTS = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function Scheduling() {
  const { projects, experts, evaluationRooms, updateProject, updateRoomStatus, weightedRandomExtraction, addExtractionRecord } = useStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [expertCount, setExpertCount] = useState(3);
  const [professionFilter, setProfessionFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [extractedRecord, setExtractedRecord] = useState<ReturnType<typeof weightedRandomExtraction>>(null);

  const referenceDate = new Date();
  referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
  const weekDates = useMemo(() => getWeekDates(referenceDate), [weekOffset]);

  const pendingProjects = useMemo(() => projects.filter((p) => p.status === '待开标'), [projects]);

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
    return map;
  }, [evaluationRooms, projects, weekDates]);

  const getBlockSpan = (project: typeof projects[0], dateKey: string) => {
    const relevant = project.stageTimings.filter((t) => {
      const d = formatDateKey(new Date(t.startTime));
      return d === dateKey;
    });
    if (relevant.length === 0) return 1;
    const first = relevant[0];
    const startHour = new Date(first.startTime).getHours();
    const endHour = first.endTime ? new Date(first.endTime).getHours() : startHour + 1;
    return Math.max(1, endHour - startHour);
  };

  const getBlockStartHour = (project: typeof projects[0], dateKey: string) => {
    const relevant = project.stageTimings.filter((t) => formatDateKey(new Date(t.startTime)) === dateKey);
    if (relevant.length === 0) return 8;
    return new Date(relevant[0].startTime).getHours();
  };

  const handleGenerateSchedule = () => {
    const sorted = [...projectsWithoutRooms].sort(
      (a, b) => new Date(a.openBidTime).getTime() - new Date(b.openBidTime).getTime()
    );
    const freeRooms = evaluationRooms.filter((r) => r.status === '空闲');

    sorted.forEach((project) => {
      const room = freeRooms.find((r) => {
        const projectDate = formatDateKey(new Date(project.openBidTime));
        const existing = r.scheduleSlots.filter((s) => s.date === projectDate);
        const projectStart = new Date(project.openBidTime).getHours();
        return existing.every((s) => {
          const slotStart = parseInt(s.startTime.split(':')[0]);
          const slotEnd = parseInt(s.endTime.split(':')[0]);
          return projectStart >= slotEnd || projectStart < slotStart;
        });
      });

      if (room) {
        updateProject(project.id, { evaluationRoomId: room.id });
        updateRoomStatus(room.id, '占用', project.id);
        const idx = freeRooms.indexOf(room);
        if (idx > -1) freeRooms.splice(idx, 1);
      }
    });
  };

  const handleExtract = () => {
    if (!selectedProjectId) return;
    const record = weightedRandomExtraction(selectedProjectId, expertCount, professionFilter || undefined, regionFilter || undefined);
    setExtractedRecord(record);
  };

  const handleSubmitApproval = () => {
    if (!extractedRecord) return;
    addExtractionRecord({ ...extractedRecord, approvalStatus: '待审批' });
    setExtractedRecord(null);
  };

  const extractedExperts = useMemo(() => {
    if (!extractedRecord) return [];
    return extractedRecord.experts
      .map((ee) => {
        const expert = experts.find((e) => e.id === ee.expertId);
        if (!expert) return null;
        return { ...expert, weight: ee.weight, response: ee.response };
      })
      .filter(Boolean) as (typeof experts[0] & { weight: number; response: string })[];
  }, [extractedRecord, experts]);

  const maxWeight = 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif text-gray-900">智能调度</h1>
        <button
          onClick={handleGenerateSchedule}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          生成调度方案
        </button>
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
                    <>
                      <div
                        key={`room-${room.id}`}
                        className="bg-white p-2 flex flex-col items-center justify-center text-xs"
                      >
                        <span className="font-medium text-gray-700">{room.name}</span>
                        <span className="text-gray-400 mt-0.5">{room.floor}F · {room.capacity}人</span>
                      </div>
                      {weekDates.map((d, di) => {
                        const dateKey = formatDateKey(d);
                        const roomProjects = projects.filter(
                          (p) => p.evaluationRoomId === room.id && p.stageTimings.some((t) => formatDateKey(new Date(t.startTime)) === dateKey)
                        );
                        return (
                          <div key={`${room.id}-${di}`} className="bg-white p-1">
                            <div className="relative w-full" style={{ height: `${TIME_SLOTS.length * 20}px` }}>
                              {roomProjects.map((project) => {
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
                    </>
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

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">选择项目</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择待开标项目</option>
                  {pendingProjects.map((p) => (
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
                disabled={!selectedProjectId}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                开始抽取
              </button>
            </div>
          </div>

          {extractedExperts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-md font-semibold font-serif text-gray-800 mb-3">抽取结果</h3>
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
              <button
                onClick={handleSubmitApproval}
                className="w-full mt-4 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                提交审批
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

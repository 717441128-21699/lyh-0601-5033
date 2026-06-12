import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { EvaluationRoom } from '@/types';

const STATUS_COLORS: Record<EvaluationRoom['status'], { fill: string; opacity: number }> = {
  '空闲': { fill: '#22C55E', opacity: 0.3 },
  '占用': { fill: '#3B82F6', opacity: 0.6 },
  '维护': { fill: '#6B7280', opacity: 0.4 },
};

function getHeatColor(count: number, max: number): string {
  if (max === 0) return '#22C55E';
  const ratio = count / max;
  if (ratio < 0.33) return '#22C55E';
  if (ratio < 0.66) return '#EAB308';
  return '#EF4444';
}

function getHeatOpacity(count: number, max: number): number {
  if (max === 0 || count === 0) return 0.2;
  return 0.3 + (count / max) * 0.6;
}

interface TooltipData {
  room: EvaluationRoom;
  x: number;
  y: number;
}

export default function Floorplan() {
  const [mode, setMode] = useState<'status' | 'heatmap'>('status');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const evaluationRooms = useStore((s) => s.evaluationRooms);
  const projects = useStore((s) => s.projects);
  const experts = useStore((s) => s.experts);
  const extractionRecords = useStore((s) => s.extractionRecords);

  const floor1Rooms = useMemo(() => evaluationRooms.filter((r) => r.floor === 1), [evaluationRooms]);
  const floor2Rooms = useMemo(() => evaluationRooms.filter((r) => r.floor === 2), [evaluationRooms]);

  const expertCountByRoom = useMemo(() => {
    const map: Record<string, number> = {};
    const expertListByRoom: Record<string, string[]> = {};
    evaluationRooms.forEach((room) => {
      map[room.id] = 0;
      expertListByRoom[room.id] = [];
    });
    extractionRecords.forEach((record) => {
      const project = projects.find((p) => p.id === record.projectId);
      if (!project?.evaluationRoomId) return;
      const confirmed = record.experts.filter((e) => e.response === '已确认');
      confirmed.forEach((ee) => {
        const expert = experts.find((ex) => ex.id === ee.expertId);
        if (expert && expert.status !== '已回避') {
          map[project.evaluationRoomId] = (map[project.evaluationRoomId] || 0) + 1;
          if (!expertListByRoom[project.evaluationRoomId]?.includes(expert.name)) {
            expertListByRoom[project.evaluationRoomId].push(expert.name);
          }
        }
      });
    });
    return { counts: map, lists: expertListByRoom };
  }, [evaluationRooms, extractionRecords, projects, experts]);

  const maxExperts = useMemo(
    () => Math.max(...Object.values(expertCountByRoom.counts), 1),
    [expertCountByRoom]
  );

  const stats = useMemo(() => {
    const idle = evaluationRooms.filter((r) => r.status === '空闲').length;
    const occupied = evaluationRooms.filter((r) => r.status === '占用').length;
    const maintenance = evaluationRooms.filter((r) => r.status === '维护').length;
    const totalCheckedIn = experts.filter((e) => e.status === '已确认' || e.status === '已抽取').length;
    const activeProjects = projects.filter((p) => p.status === '开标中' || p.status === '评标中').length;
    return { idle, occupied, maintenance, totalCheckedIn, activeProjects };
  }, [evaluationRooms, experts, projects]);

  const ROOM_WIDTH = 220;
  const ROOM_HEIGHT = 140;
  const ROOM_GAP = 30;
  const FLOOR_GAP = 60;
  const SVG_PADDING = 40;
  const FLOOR_LABEL_HEIGHT = 30;
  const CORRIDOR_Y_OFFSET = 10;

  const floorWidth = 3 * ROOM_WIDTH + 2 * ROOM_GAP;
  const svgWidth = 2 * floorWidth + FLOOR_GAP + 2 * SVG_PADDING;
  const svgHeight = 2 * (FLOOR_LABEL_HEIGHT + ROOM_HEIGHT + 20) + 100 + 2 * SVG_PADDING;

  function getRoomX(floorIndex: number, roomIndex: number) {
    return SVG_PADDING + floorIndex * (floorWidth + FLOOR_GAP) + roomIndex * (ROOM_WIDTH + ROOM_GAP);
  }

  function getRoomY(floorIndex: number) {
    return SVG_PADDING + floorIndex * (FLOOR_LABEL_HEIGHT + ROOM_HEIGHT + 50) + FLOOR_LABEL_HEIGHT;
  }

  function getProjectForRoom(room: EvaluationRoom) {
    if (!room.currentProjectId) return null;
    return projects.find((p) => p.id === room.currentProjectId) || null;
  }

  function getTodayScheduleSlots(room: EvaluationRoom) {
    const today = new Date().toISOString().slice(0, 10);
    return room.scheduleSlots.filter((s) => s.date === today);
  }

  function renderRoom(room: EvaluationRoom, floorIndex: number, roomIndex: number) {
    const x = getRoomX(floorIndex, roomIndex);
    const y = getRoomY(floorIndex);
    const colorConfig = STATUS_COLORS[room.status];
    const project = getProjectForRoom(room);
    const expertCount = expertCountByRoom.counts[room.id] || 0;

    return (
      <g
        key={room.id}
        onMouseEnter={(e) => {
          const rect = (e.currentTarget as SVGGElement).closest('svg')?.getBoundingClientRect();
          if (rect) {
            setTooltip({
              room,
              x: e.clientX - rect.left + 16,
              y: e.clientY - rect.top - 10,
            });
          }
        }}
        onMouseLeave={() => setTooltip(null)}
        className="cursor-pointer"
      >
        <rect
          x={x}
          y={y}
          width={ROOM_WIDTH}
          height={ROOM_HEIGHT}
          rx={12}
          ry={12}
          fill={colorConfig.fill}
          fillOpacity={colorConfig.opacity}
          stroke={colorConfig.fill}
          strokeWidth={2}
        />
        <text
          x={x + ROOM_WIDTH / 2}
          y={y + 30}
          textAnchor="middle"
          fill="white"
          fontSize={14}
          fontWeight="bold"
        >
          {room.name}
        </text>
        <text
          x={x + ROOM_WIDTH / 2}
          y={y + 52}
          textAnchor="middle"
          fill="white"
          fillOpacity={0.7}
          fontSize={12}
        >
          {room.status}
        </text>
        <text
          x={x + ROOM_WIDTH / 2}
          y={y + 74}
          textAnchor="middle"
          fill="white"
          fillOpacity={0.6}
          fontSize={11}
        >
          容量: {room.capacity}人
        </text>
        {project && (
          <text
            x={x + ROOM_WIDTH / 2}
            y={y + 96}
            textAnchor="middle"
            fill="#FBBF24"
            fontSize={11}
            fontWeight="bold"
          >
            {project.projectCode}
          </text>
        )}
        {mode === 'heatmap' && (
          <>
            <circle
              cx={x + ROOM_WIDTH / 2}
              cy={y + ROOM_HEIGHT / 2}
              r={32}
              fill={getHeatColor(expertCount, maxExperts)}
              fillOpacity={getHeatOpacity(expertCount, maxExperts)}
            />
            <text
              x={x + ROOM_WIDTH / 2}
              y={y + ROOM_HEIGHT / 2 + 5}
              textAnchor="middle"
              fill="white"
              fontSize={16}
              fontWeight="bold"
            >
              {expertCount}
            </text>
          </>
        )}
      </g>
    );
  }

  function renderFloor(floorIndex: number, label: string, rooms: EvaluationRoom[]) {
    const startX = getRoomX(floorIndex, 0);
    const endX = getRoomX(floorIndex, 2) + ROOM_WIDTH;
    const roomY = getRoomY(floorIndex);
    const labelY = roomY - 10;

    const corridorY = roomY + ROOM_HEIGHT + CORRIDOR_Y_OFFSET;

    return (
      <g key={`floor-${floorIndex}`}>
        <text
          x={(startX + endX) / 2}
          y={labelY - FLOOR_LABEL_HEIGHT + 20}
          textAnchor="middle"
          fill="white"
          fillOpacity={0.8}
          fontSize={16}
          fontWeight="bold"
          fontFamily="serif"
        >
          {label}
        </text>
        {rooms.map((room, i) => renderRoom(room, floorIndex, i))}
        <path
          d={`M ${startX} ${corridorY} L ${endX} ${corridorY}`}
          stroke="#374151"
          strokeWidth={3}
          fill="none"
          strokeOpacity={0.6}
        />
        <text
          x={(startX + endX) / 2}
          y={corridorY + 16}
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize={10}
        >
          走廊
        </text>
      </g>
    );
  }

  const entranceX = SVG_PADDING + floorWidth + FLOOR_GAP / 2;
  const entranceY = svgHeight - SVG_PADDING - 30;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-serif">开评标区平面图</h1>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('status')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                mode === 'status' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              房间状态
            </button>
            <button
              onClick={() => setMode('heatmap')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                mode === 'heatmap' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              签到热力图
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 relative">
            <svg
              width="100%"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="rounded-xl"
              style={{ background: '#1a1f2e' }}
            >
              {renderFloor(0, '1F 评标区', floor1Rooms)}
              {renderFloor(1, '2F 评标区', floor2Rooms)}

              <g>
                <rect
                  x={entranceX - 60}
                  y={entranceY - 10}
                  width={120}
                  height={36}
                  rx={8}
                  ry={8}
                  fill="#374151"
                  fillOpacity={0.6}
                  stroke="#6B7280"
                  strokeWidth={1}
                />
                <text
                  x={entranceX}
                  y={entranceY + 14}
                  textAnchor="middle"
                  fill="white"
                  fillOpacity={0.8}
                  fontSize={13}
                  fontWeight="bold"
                >
                  主入口
                </text>
              </g>
            </svg>

            {tooltip && (
              <div
                className="absolute z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[220px] pointer-events-none"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translate(0, -100%)',
                }}
              >
                <div className="text-white font-bold text-sm mb-2">{tooltip.room.name}</div>
                <div className="space-y-1 text-xs text-gray-300">
                  <div>
                    状态：
                    <span
                      style={{
                        color: STATUS_COLORS[tooltip.room.status].fill,
                        fontWeight: 'bold',
                      }}
                    >
                      {tooltip.room.status}
                    </span>
                  </div>
                  <div>容量：{tooltip.room.capacity}人</div>
                  {(() => {
                    const proj = getProjectForRoom(tooltip.room);
                    if (!proj) return null;
                    return (
                      <>
                        <div className="border-t border-gray-700 my-1" />
                        <div className="text-yellow-400 font-medium">当前项目</div>
                        <div>编号：{proj.projectCode}</div>
                        <div>方式：{proj.procurementMethod}</div>
                        <div>状态：{proj.status}</div>
                      </>
                    );
                  })()}
                  {(() => {
                    const slots = getTodayScheduleSlots(tooltip.room);
                    if (slots.length === 0) return null;
                    return (
                      <>
                        <div className="border-t border-gray-700 my-1" />
                        <div className="text-blue-400 font-medium">今日安排</div>
                        {slots.map((slot, i) => {
                          const proj = projects.find((p) => p.id === slot.projectId);
                          return (
                            <div key={i}>
                              {slot.startTime}-{slot.endTime}{' '}
                              {proj?.projectCode || slot.projectId}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                  {(() => {
                    const expertNames = expertCountByRoom.lists[tooltip.room.id];
                    if (!expertNames || expertNames.length === 0) return null;
                    return (
                      <>
                        <div className="border-t border-gray-700 my-1" />
                        <div className="text-green-400 font-medium">已签到专家</div>
                        <div>{expertNames.join('、')}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="w-56 shrink-0 space-y-4">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">房间统计</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">空闲</span>
                  </div>
                  <span className="text-lg font-bold text-green-400">{stats.idle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">占用</span>
                  </div>
                  <span className="text-lg font-bold text-blue-400">{stats.occupied}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-500" />
                    <span className="text-sm">维护</span>
                  </div>
                  <span className="text-lg font-bold text-gray-400">{stats.maintenance}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">实时数据</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500">已签到专家</div>
                  <div className="text-2xl font-bold text-amber-400">{stats.totalCheckedIn}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">进行中项目</div>
                  <div className="text-2xl font-bold text-cyan-400">{stats.activeProjects}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ background: '#22C55E', opacity: 0.3 }} />
            <span>空闲</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ background: '#3B82F6', opacity: 0.6 }} />
            <span>占用</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ background: '#6B7280', opacity: 0.4 }} />
            <span>维护</span>
          </div>
        </div>
      </div>
    </div>
  );
}

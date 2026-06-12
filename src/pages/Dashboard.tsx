import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, Activity, UserCheck, ChevronRight, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';

const notificationDotColor: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  success: 'bg-green-500',
};

function formatBudget(amount: number) {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function formatChineseDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[date.getDay()];
  return `${year}年${month}月${day}日 星期${weekDay}`;
}

function timeAgo(isoString: string) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}小时前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}天前`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}个月前`;
}

export default function Dashboard() {
  const projects = useStore((s) => s.projects);
  const experts = useStore((s) => s.experts);
  const extractionRecords = useStore((s) => s.extractionRecords);
  const evaluationRooms = useStore((s) => s.evaluationRooms);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);

  const today = useMemo(() => new Date(), []);

  const todayProjectCount = useMemo(() => {
    const todayStr = today.toISOString().slice(0, 10);
    return projects.filter((p) => p.openBidTime.slice(0, 10) === todayStr).length;
  }, [projects, today]);

  const pendingApprovalCount = useMemo(() => {
    return extractionRecords.filter((r) => r.approvalStatus === '待审批').length;
  }, [extractionRecords]);

  const evaluatingCount = useMemo(() => {
    return projects.filter((p) => p.status === '评标中').length;
  }, [projects]);

  const expertArrivalRate = useMemo(() => {
    const nonAvailable = experts.filter((e) => e.status !== '可用');
    if (nonAvailable.length === 0) return '0%';
    const confirmed = nonAvailable.filter((e) => e.status === '已确认').length;
    return `${Math.round((confirmed / nonAvailable.length) * 100)}%`;
  }, [experts]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [projects]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">开评标管理控制台</h1>
          <p className="mt-1 text-sm text-gray-500">{formatChineseDate(today)}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-white">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">系统运行中</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="今日项目"
          value={todayProjectCount}
          icon={ClipboardList}
          color="blue"
          subtitle="开标日为今天"
        />
        <StatCard
          title="待审批"
          value={pendingApprovalCount}
          icon={Clock}
          color="gold"
          subtitle="抽取记录待审"
        />
        <StatCard
          title="评标中"
          value={evaluatingCount}
          icon={Activity}
          color="green"
          subtitle="进行中项目"
        />
        <StatCard
          title="专家到位率"
          value={expertArrivalRate}
          icon={UserCheck}
          color="purple"
          subtitle="已确认/已抽取"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-serif font-bold text-gray-900">项目动态</h2>
            <Link
              to="/projects"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-all hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="shrink-0 rounded-md bg-blue-900 px-2.5 py-1 text-xs font-semibold text-white">
                    {project.projectCode}
                  </span>
                  <span className="text-sm text-gray-600 truncate">{project.industry}</span>
                  <StatusBadge status={project.status} size="sm" />
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(project.openBidTime).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-sm font-semibold text-blue-900">
                    {formatBudget(project.budgetAmount)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-serif font-bold text-gray-900">通知中心</h2>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-sm">暂无通知</p>
              </div>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={cn(
                  'w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  n.read ? 'hover:bg-gray-50' : 'bg-blue-50/60 hover:bg-blue-50'
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    notificationDotColor[n.type]
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm leading-snug',
                      n.read ? 'text-gray-500' : 'text-gray-800 font-medium'
                    )}
                  >
                    {n.message}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-serif font-bold text-gray-900 mb-5">评标室状态</h2>
        <div className="grid grid-cols-6 gap-4">
          {evaluationRooms.map((room) => {
            const currentProject = room.currentProjectId
              ? projects.find((p) => p.id === room.currentProjectId)
              : null;
            return (
              <div
                key={room.id}
                className={cn(
                  'rounded-xl border p-4 transition-shadow hover:shadow-md',
                  room.status === '空闲'
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-white'
                    : room.status === '占用'
                    ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white'
                    : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">{room.name}</span>
                  <StatusBadge status={room.status} size="sm" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>容量 {room.capacity}人</span>
                </div>
                {currentProject && (
                  <div className="rounded-md bg-blue-900/5 px-2 py-1">
                    <p className="text-xs font-medium text-blue-800 truncate">
                      {currentProject.projectCode}
                    </p>
                  </div>
                )}
                {room.status === '空闲' && (
                  <div className="rounded-md bg-green-900/5 px-2 py-1">
                    <p className="text-xs text-green-700">可预约</p>
                  </div>
                )}
                {room.status === '维护' && (
                  <div className="rounded-md bg-gray-900/5 px-2 py-1">
                    <p className="text-xs text-gray-500">暂停使用</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

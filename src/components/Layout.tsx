import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  CalendarClock,
  CheckCircle,
  Monitor,
  FileText,
  BarChart3,
  Map,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const navItems = [
  { label: '首页', icon: LayoutDashboard, path: '/' },
  { label: '项目管理', icon: FolderKanban, path: '/projects' },
  { label: '智能调度', icon: CalendarClock, path: '/scheduling' },
  { label: '审批管理', icon: CheckCircle, path: '/approval' },
  { label: '开评标监控', icon: Monitor, path: '/monitoring' },
  { label: '文档管理', icon: FileText, path: '/documents' },
  { label: '统计分析', icon: BarChart3, path: '/statistics' },
  { label: '平面图', icon: Map, path: '/floorplan' },
  { label: '专家管理', icon: Users, path: '/experts' },
]

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, unreadCount } = useStore()
  const [searchValue, setSearchValue] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside
        className={cn(
          'flex flex-col bg-primary-500 text-white transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-primary-400/30 px-4">
          {sidebarCollapsed ? (
            <div className="text-xl font-bold text-gold-500">开</div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-gold-500 font-serif tracking-wider">
                开评标管理系统
              </span>
              <span className="text-[10px] text-primary-100 mt-0.5 tracking-widest">
                BID EVALUATION SYSTEM
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm',
                  sidebarCollapsed && 'justify-center px-0 mx-1',
                  isActive
                    ? 'bg-primary-400/40 border-l-[3px] border-gold-500 text-white font-medium'
                    : 'text-primary-100 hover:bg-primary-400/20 hover:text-white border-l-[3px] border-transparent'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-primary-400/30 p-3">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-primary-100 hover:bg-primary-400/20 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">收起菜单</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between bg-white px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目、专家、文档..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9 w-72 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-medium text-white">
                管
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">系统管理员</p>
                <p className="text-xs text-gray-400">admin@gov.cn</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  UserCheck,
  GraduationCap,
  CalendarCheck,
  Award,
  CreditCard,
  MessageSquare,
  FileBarChart,
  Terminal,
  Settings,
  ChevronRight
} from 'lucide-react';

export type NavItemKey =
  | 'overview'
  | 'students'
  | 'departments-courses'
  | 'subjects-semesters'
  | 'enrollments'
  | 'faculty'
  | 'attendance'
  | 'marks-results'
  | 'fees-payments'
  | 'student-feedback'
  | 'reports-analytics'
  | 'dbms-lab'
  | 'admin-settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const NAV_ITEMS: { key: NavItemKey; label: string; icon: React.ElementType; badge?: string; group?: string }[] = [
  { key: 'overview', label: '1. Overview', icon: LayoutDashboard, group: 'Core Management' },
  { key: 'students', label: '2. Students', icon: Users, group: 'Core Management' },
  { key: 'departments-courses', label: '3. Depts & Courses', icon: Building2, group: 'Academic Structure' },
  { key: 'subjects-semesters', label: '4. Subjects & Terms', icon: BookOpen, group: 'Academic Structure' },
  { key: 'enrollments', label: '5. Enrollments', icon: UserCheck, group: 'Academic Structure' },
  { key: 'faculty', label: '6. Faculty', icon: GraduationCap, group: 'Faculty & Classes' },
  { key: 'attendance', label: '7. Attendance', icon: CalendarCheck, group: 'Faculty & Classes' },
  { key: 'marks-results', label: '8. Marks & Results', icon: Award, group: 'Academic Progress' },
  { key: 'fees-payments', label: '9. Fees & Payments', icon: CreditCard, group: 'Financials' },
  { key: 'student-feedback', label: '10. Student Feedback', icon: MessageSquare, group: 'Governance' },
  { key: 'reports-analytics', label: '11. Reports & Analytics', icon: FileBarChart, group: 'Analytics' },
  { key: 'dbms-lab', label: '12. DBMS Lab & SQL', icon: Terminal, badge: 'Live SQL', group: 'DBMS PBL Project' },
  { key: 'admin-settings', label: '13. Admin & Settings', icon: Settings, group: 'System' }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4">
          Navigation Areas (13 Modules)
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-600/15 text-teal-400 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
          <div className="font-semibold text-slate-300">CampusCore PBL DBMS</div>
          <div className="text-slate-500 mt-0.5">BCA 3rd Sem • Relational 3NF</div>
        </div>
      </aside>
    </>
  );
};

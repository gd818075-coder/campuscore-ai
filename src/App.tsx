import React, { useEffect, useState } from 'react';
import { api } from './services/api.ts';
import { DatabaseStatus } from '../server/db/types.ts';
import { Navbar } from './components/Layout/Navbar.tsx';
import { Sidebar, NavItemKey } from './components/Layout/Sidebar.tsx';

// 13 Module Pages
import { OverviewPage } from './pages/OverviewPage.tsx';
import { StudentsPage } from './pages/StudentsPage.tsx';
import { DepartmentsCoursesPage } from './pages/DepartmentsCoursesPage.tsx';
import { SubjectsSemestersPage } from './pages/SubjectsSemestersPage.tsx';
import { EnrollmentsPage } from './pages/EnrollmentsPage.tsx';
import { FacultyPage } from './pages/FacultyPage.tsx';
import { AttendancePage } from './pages/AttendancePage.tsx';
import { MarksResultsPage } from './pages/MarksResultsPage.tsx';
import { FeesPaymentsPage } from './pages/FeesPaymentsPage.tsx';
import { FeedbackPage } from './pages/FeedbackPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { DbmsLabPage } from './pages/DbmsLabPage.tsx';
import { AdminSettingsPage } from './pages/AdminSettingsPage.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [currentRole, setCurrentRole] = useState<'Administrator' | 'Faculty' | 'Student'>('Administrator');
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await api.getDbStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to probe DB status:', err);
    }
  };

  const handleReseed = async () => {
    await api.reseedDatabase();
    await loadStatus();
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Application Bar */}
      <Navbar
        status={status}
        onRefreshStatus={loadStatus}
        onReseed={handleReseed}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Workspace with Fixed/Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'overview' && (
              <OverviewPage onNavigate={(tab) => setCurrentTab(tab)} />
            )}
            {currentTab === 'students' && (
              <StudentsPage currentRole={currentRole} />
            )}
            {currentTab === 'departments-courses' && (
              <DepartmentsCoursesPage currentRole={currentRole} />
            )}
            {currentTab === 'subjects-semesters' && (
              <SubjectsSemestersPage currentRole={currentRole} />
            )}
            {currentTab === 'enrollments' && (
              <EnrollmentsPage currentRole={currentRole} />
            )}
            {currentTab === 'faculty' && (
              <FacultyPage currentRole={currentRole} />
            )}
            {currentTab === 'attendance' && (
              <AttendancePage currentRole={currentRole} />
            )}
            {currentTab === 'marks-results' && (
              <MarksResultsPage currentRole={currentRole} />
            )}
            {currentTab === 'fees-payments' && (
              <FeesPaymentsPage currentRole={currentRole} />
            )}
            {currentTab === 'student-feedback' && (
              <FeedbackPage currentRole={currentRole} />
            )}
            {currentTab === 'reports-analytics' && (
              <ReportsPage />
            )}
            {currentTab === 'dbms-lab' && (
              <DbmsLabPage />
            )}
            {currentTab === 'admin-settings' && (
              <AdminSettingsPage
                status={status}
                onRefreshStatus={loadStatus}
                onReseed={handleReseed}
                currentRole={currentRole}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

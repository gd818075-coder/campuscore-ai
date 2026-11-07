import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { StatCard } from '../components/Common/StatCard.tsx';
import { Badge } from '../components/Common/Badge.tsx';
import {
  Users,
  BookOpen,
  CalendarCheck,
  AlertTriangle,
  CreditCard,
  Award,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  Database,
  Building2
} from 'lucide-react';
import { NavItemKey } from '../components/Layout/Sidebar.tsx';

interface OverviewPageProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOverviewStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mb-3" />
        <p className="text-sm">Querying relational database views and aggregations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-rose-950/20 border border-rose-800/40 text-rose-300">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>Error loading database statistics</span>
        </div>
        <p className="mt-2 text-xs text-rose-300/80">{error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-3 py-1.5 rounded bg-rose-800 hover:bg-rose-700 text-white text-xs font-medium"
        >
          Retry Database Query
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Overview Dashboard</h1>
            <Badge variant="teal">Live DBMS Sync</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated relational insights across academic programs, student attendance, assessments, and accounts.
          </p>
        </div>
        <button
          onClick={loadStats}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Students"
          value={stats?.totalStudents || 0}
          subtitle={`${stats?.activeStudents || 0} currently active`}
          icon={Users}
          variant="teal"
        />
        <StatCard
          title="Academic Programs & Subjects"
          value={`${stats?.totalCourses || 0} / ${stats?.totalSubjects || 0}`}
          subtitle={`${stats?.totalFaculty || 0} teaching faculty`}
          icon={BookOpen}
          variant="default"
        />
        <StatCard
          title="Attendance Risk Warnings"
          value={stats?.attendanceWarningsCount || 0}
          subtitle="Students below 75% attendance"
          icon={AlertTriangle}
          variant={stats?.attendanceWarningsCount > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Outstanding Fee Balance"
          value={`₹${(stats?.financials?.pendingFees || 0).toLocaleString('en-IN')}`}
          subtitle={`₹${(stats?.financials?.totalCollected || 0).toLocaleString('en-IN')} collected`}
          icon={CreditCard}
          variant="default"
        />
      </div>

      {/* Main Grid: Attendance Alerts & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Attendance Warnings Table */}
        <div className="lg:col-span-2 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Attendance Shortage Alerts (Threshold: &lt; 75%)</h2>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              Manage Attendance <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-0 overflow-x-auto">
            {stats?.attendanceWarningsList?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All enrolled students currently meet the required 75% attendance threshold.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Register No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Attended / Total</th>
                    <th className="p-3">Percentage</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats?.attendanceWarningsList?.map((w: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-300">{w.reg_number}</td>
                      <td className="p-3 font-medium text-slate-200">{w.student_name}</td>
                      <td className="p-3 text-slate-400">{w.subject_name}</td>
                      <td className="p-3 text-slate-300">
                        {w.attended_sessions} / {w.total_sessions}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-amber-400">{w.percentage}%</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="amber">Defaulter</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Academic & Financial Summary Card */}
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Academic Grading Benchmark</span>
              <Award className="w-4 h-4 text-teal-400" />
            </div>
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Recorded Assessments</span>
                <span className="font-semibold text-white">{stats?.academic?.totalGradedEntries || 0} entries</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Class Performance Average</span>
                <span className="font-semibold text-teal-400">{stats?.academic?.averageScore || 0} marks</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => onNavigate('marks-results')}
                  className="w-full text-center py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 font-medium transition-colors"
                >
                  View Marks & Results
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-900 border border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">DBMS Project Quick Links</span>
              <Database className="w-4 h-4 text-teal-400" />
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <button
                onClick={() => onNavigate('dbms-lab')}
                className="w-full text-left p-2 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-200 flex items-center justify-between group"
              >
                <span>Interactive DBMS Lab & SQL Queries</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('admin-settings')}
                className="w-full text-left p-2 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-200 flex items-center justify-between group"
              >
                <span>View 3NF ER Model & Normalization</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('reports-analytics')}
                className="w-full text-left p-2 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-200 flex items-center justify-between group"
              >
                <span>Academic Reports & CSV Export</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

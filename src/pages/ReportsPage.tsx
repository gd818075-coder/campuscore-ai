import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Badge } from '../components/Common/Badge.tsx';
import {
  FileBarChart,
  Download,
  RefreshCw,
  Search,
  Calendar,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

interface ReportConfig {
  key: string;
  name: string;
  description: string;
  category: string;
}

const REPORT_CATALOG: ReportConfig[] = [
  {
    key: 'student-directory',
    name: '1. Student Master Directory',
    description: 'Complete student roll with registration numbers, contact information, degree program, and status.',
    category: 'Student Records'
  },
  {
    key: 'low-attendance',
    name: '2. Low-Attendance Defaulters Report (< 75%)',
    description: 'Lists students below statutory minimum attendance threshold with required action flags.',
    category: 'Attendance'
  },
  {
    key: 'subject-attendance',
    name: '3. Subject-Wise Attendance Distribution',
    description: 'Aggregates sessions conducted, attendance rates, and present/absent ratios across syllabus units.',
    category: 'Attendance'
  },
  {
    key: 'marks-summary',
    name: '4. Internal & Final Examination Scores',
    description: 'Comprehensive scoresheet combining CIA and semester end assessments with evaluation classifications.',
    category: 'Academic Performance'
  },
  {
    key: 'pending-fees',
    name: '5. Outstanding Fees & Defaulters Ledger',
    description: 'Receivables summary displaying billed amount, collections, pending balances, and due dates.',
    category: 'Financials'
  },
  {
    key: 'faculty-allocation',
    name: '6. Faculty Workload & Subject Allocation',
    description: 'Relational mapping of teaching faculty to assigned subjects, credits, and academic sessions.',
    category: 'Faculty'
  },
  {
    key: 'feedback-analytics',
    name: '7. Student Feedback & Quality Analytics',
    description: 'Student evaluations across course delivery, lab facilities, and campus infrastructure.',
    category: 'Quality Assurance'
  }
];

export const ReportsPage: React.FC = () => {
  const [activeReportKey, setActiveReportKey] = useState<string>('student-directory');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadReport = async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReportData(key);
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(activeReportKey);
  }, [activeReportKey]);

  // Export CSV
  const exportToCsv = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) return;

    const rows = reportData.rows;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) =>
        headers
          .map(header => {
            const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CampusCore_${activeReportKey}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentConfig = REPORT_CATALOG.find(r => r.key === activeReportKey);
  const rows = reportData?.rows || [];
  const filteredRows = searchTerm
    ? rows.filter((r: any) =>
        Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : rows;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Database Reports & Analytics</h1>
            <Badge variant="teal">SQL Relational Views</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official academic audit reports with CSV data export and multi-table aggregate summaries.
          </p>
        </div>

        <button
          onClick={exportToCsv}
          disabled={filteredRows.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-medium cursor-pointer shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report (CSV)
        </button>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        {REPORT_CATALOG.map((rep) => (
          <button
            key={rep.key}
            onClick={() => setActiveReportKey(rep.key)}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeReportKey === rep.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {rep.name}
          </button>
        ))}
      </div>

      {/* Active Report Header & Search Filter */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{currentConfig?.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{currentConfig?.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search in report..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => loadReport(activeReportKey)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh Report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report Table Display */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Generated from Database: <strong className="text-slate-200 font-mono">{reportData?.generatedAt || new Date().toISOString()}</strong></span>
          <span>Showing <strong className="text-teal-400 font-mono">{filteredRows.length}</strong> tuples</span>
        </div>

        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
              Running database report query...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-400 text-xs">{error}</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No matching records found in this database report.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-300 border-b border-slate-800 sticky top-0 z-10 shadow-xs">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="p-3 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40">
                    {columns.map((col, cIdx) => {
                      const val = row[col];
                      const isAlert = String(val).includes('Defaulter') || String(val).includes('Shortage') || String(val).includes('Warning');
                      const isSuccess = String(val).includes('Settled') || String(val).includes('Distinction') || String(val).includes('Active');
                      return (
                        <td key={cIdx} className="p-3 text-slate-300 whitespace-nowrap">
                          {isAlert ? (
                            <span className="font-semibold text-amber-400">{val}</span>
                          ) : isSuccess ? (
                            <span className="font-medium text-emerald-400">{val}</span>
                          ) : (
                            val !== null && val !== undefined ? String(val) : '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

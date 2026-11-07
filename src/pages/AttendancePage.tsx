import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Subject, Student, AttendanceRecord } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  CalendarCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  SlidersHorizontal,
  Calendar,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

interface Props {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const AttendancePage: React.FC<Props> = ({ currentRole }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(1);
  const [threshold, setThreshold] = useState<number>(75);
  const [summary, setSummary] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Batch attendance recording sheet
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchRecords, setBatchRecords] = useState<{ student_id: number; status: 'Present' | 'Absent' | 'Late' | 'Excused'; remarks: string }[]>([]);

  const isRestricted = currentRole === 'Student';

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, stus] = await Promise.all([
        api.getSubjects(),
        api.getStudents()
      ]);
      setSubjects(subs);
      setStudents(stus);

      const subId = selectedSubjectId || (subs.length > 0 ? subs[0].subject_id : 1);
      const [sumData, logsData] = await Promise.all([
        api.getAttendanceSummary({ subject_id: subId, threshold }),
        api.getAttendance({ subject_id: subId })
      ]);
      setSummary(sumData);
      setRecentLogs(logsData);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load attendance records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubjectId, threshold]);

  const openBatchModal = () => {
    // Pre-populate with all active students
    setBatchRecords(
      students.map(s => ({
        student_id: s.student_id,
        status: 'Present',
        remarks: ''
      }))
    );
    setShowBatchModal(true);
  };

  const handleBatchStatusToggle = (index: number, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    const updated = [...batchRecords];
    updated[index].status = status;
    setBatchRecords(updated);
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    setBatchRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordBatchAttendance({
        subject_id: selectedSubjectId,
        attendance_date: batchDate,
        records: batchRecords,
        recorded_by_faculty_id: 1 // Prof. Anand Verma
      });
      setToast({ type: 'success', message: `Attendance for ${batchDate} successfully recorded into database!` });
      setShowBatchModal(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`p-3 rounded-md flex items-center justify-between text-xs font-medium border ${
            toast.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="hover:opacity-75 text-sm px-1">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Attendance & Attendance Percentages</h1>
            <Badge variant="teal">Aggregated via SQL</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calculated: (Attended Sessions / Total Recorded Sessions) × 100. Enforces duplicate session prevention.
          </p>
        </div>

        {!isRestricted && (
          <button
            onClick={openBatchModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer shadow-xs"
          >
            <CalendarCheck className="w-4 h-4" />
            Mark Class Attendance Sheet
          </button>
        )}
      </div>

      {/* Control Filters Bar */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-400 font-medium">Subject Syllabus:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer font-medium focus:border-teal-500 focus:outline-hidden"
            >
              {subjects.map((sub) => (
                <option key={sub.subject_id} value={sub.subject_id}>
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-400 font-medium">Warning Threshold:</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="50"
                max="90"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-16 p-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-center font-mono"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Percentages
        </button>
      </div>

      {/* Summary Table: Student Attendance % */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">
              Cumulative Student Attendance Percentage Table
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Threshold Alert: &lt; {threshold}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Register No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Total Sessions Conducted</th>
                <th className="p-3">Attended Sessions</th>
                <th className="p-3">Absent Sessions</th>
                <th className="p-3">Calculated Percentage</th>
                <th className="p-3">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No attendance sessions logged for this subject yet.
                  </td>
                </tr>
              ) : (
                summary.map((row) => (
                  <tr key={row.student_id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-teal-400 font-medium">{row.reg_number}</td>
                    <td className="p-3 text-slate-100 font-medium">{row.student_name}</td>
                    <td className="p-3 text-slate-400">{row.subject_code}</td>
                    <td className="p-3 text-slate-300 font-mono">{row.total_sessions}</td>
                    <td className="p-3 text-slate-300 font-mono">{row.attended_sessions}</td>
                    <td className="p-3 text-slate-400 font-mono">{row.absent_sessions}</td>
                    <td className="p-3">
                      {row.attendance_percentage === null ? (
                        <span className="text-slate-500 italic">No sessions</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-mono ${row.hasWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {row.attendance_percentage}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${row.hasWarning ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${Math.min(row.attendance_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {row.hasWarning ? (
                        <Badge variant="amber">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          Shortage (&lt;{threshold}%)
                        </Badge>
                      ) : (
                        <Badge variant="emerald">Eligible</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Session Logs */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Recent Attendance Tuple Entries (Raw Table: attendance)
          </h3>
          <span className="text-xs text-slate-500">{recentLogs.length} Entries</span>
        </div>

        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Student</th>
                <th className="p-2.5">Subject</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Faculty Recorder</th>
                <th className="p-2.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentLogs.map((log) => (
                <tr key={log.attendance_id} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-mono text-slate-300">{log.attendance_date}</td>
                  <td className="p-2.5 font-medium text-slate-200">{log.student_name} ({log.reg_number})</td>
                  <td className="p-2.5 text-slate-400">{log.subject_code}</td>
                  <td className="p-2.5">
                    <Badge variant={log.status === 'Present' ? 'emerald' : log.status === 'Absent' ? 'rose' : 'amber'}>
                      {log.status}
                    </Badge>
                  </td>
                  <td className="p-2.5 text-slate-400">{log.faculty_name || 'Dr. Anand Verma'}</td>
                  <td className="p-2.5 text-slate-500">{log.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BATCH ATTENDANCE MODAL */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Class Attendance Register"
        subtitle={`Subject: ${subjects.find(s => s.subject_id === selectedSubjectId)?.name || 'DBMS'}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <label className="text-slate-300 font-medium">Session Date:</label>
              <input
                type="date"
                required
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Quick Fill:</span>
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px]"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]"
              >
                All Absent
              </button>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded">
            {batchRecords.map((item, idx) => {
              const stu = students.find(s => s.student_id === item.student_id);
              return (
                <div key={item.student_id} className="p-3 flex items-center justify-between hover:bg-slate-950/40">
                  <div>
                    <div className="font-semibold text-slate-200">
                      {stu?.first_name} {stu?.last_name}
                    </div>
                    <div className="font-mono text-[11px] text-teal-400">{stu?.reg_number}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBatchStatusToggle(idx, 'Present')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        item.status === 'Present'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchStatusToggle(idx, 'Absent')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        item.status === 'Absent'
                          ? 'bg-rose-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchStatusToggle(idx, 'Late')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        item.status === 'Late'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Late
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBatchModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Save Class Attendance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

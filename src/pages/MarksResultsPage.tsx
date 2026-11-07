import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Assessment, MarkRecord, Subject, Student } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  Award,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Trophy,
  TrendingDown,
  Filter
} from 'lucide-react';

interface Props {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const MarksResultsPage: React.FC<Props> = ({ currentRole }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number>(1);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [showEnterMark, setShowEnterMark] = useState(false);

  const [assessmentForm, setAssessmentForm] = useState({
    subject_id: 1,
    semester_id: 3,
    name: 'CIA-2 (Continuous Assessment 2)',
    assessment_type: 'Internal',
    max_marks: 30,
    weightage_percent: 30,
    conduct_date: new Date().toISOString().split('T')[0]
  });

  const [markForm, setMarkForm] = useState({
    assessment_id: 1,
    student_id: 1,
    marks_obtained: 25,
    is_absent: false,
    remarks: 'Well formulated ER query'
  });

  const isRestricted = currentRole === 'Student';

  const loadData = async () => {
    try {
      setLoading(true);
      const [asmList, subList, stuList, perfList] = await Promise.all([
        api.getAssessments(),
        api.getSubjects(),
        api.getStudents(),
        api.getPerformanceSummary()
      ]);
      setAssessments(asmList);
      setSubjects(subList);
      setStudents(stuList);
      setPerformance(perfList);

      const targetAsmId = selectedAssessmentId || (asmList.length > 0 ? asmList[0].assessment_id : 1);
      const marksList = await api.getMarks({ assessment_id: targetAsmId });
      setMarks(marksList);

      if (asmList.length > 0) {
        setMarkForm(prev => ({ ...prev, assessment_id: targetAsmId }));
      }
      if (stuList.length > 0) {
        setMarkForm(prev => ({ ...prev, student_id: stuList[0].student_id }));
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch marks' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAssessmentId]);

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAssessment(assessmentForm as any);
      setToast({ type: 'success', message: 'New assessment created successfully!' });
      setShowAddAssessment(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleRecordMark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordMark(markForm);
      setToast({ type: 'success', message: 'Marks saved to database successfully!' });
      setShowEnterMark(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const currentAssessment = assessments.find(a => a.assessment_id === selectedAssessmentId);

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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Internal Assessment & Semester Exam Marks</h1>
            <Badge variant="teal">Integrity Validated</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Scores checked against configured maximum marks; calculates total percentiles and honors distinctions.
          </p>
        </div>

        {!isRestricted && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddAssessment(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Assessment Unit
            </button>
            <button
              onClick={() => setShowEnterMark(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer shadow-xs"
            >
              <Award className="w-3.5 h-3.5" />
              Enter Student Mark
            </button>
          </div>
        )}
      </div>

      {/* Control Selector Bar */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-medium">Select Assessment:</label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(Number(e.target.value))}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 cursor-pointer font-medium focus:border-teal-500 focus:outline-hidden"
          >
            {assessments.map((asm) => (
              <option key={asm.assessment_id} value={asm.assessment_id}>
                {asm.name} — {asm.subject_name} (Max: {asm.max_marks})
              </option>
            ))}
          </select>
        </div>

        {currentAssessment && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Type: <strong className="text-white">{currentAssessment.assessment_type}</strong></span>
            <span>•</span>
            <span>Max Score: <strong className="text-teal-400">{currentAssessment.max_marks}</strong></span>
            <span>•</span>
            <span>Date: <span className="font-mono text-slate-400">{currentAssessment.conduct_date}</span></span>
          </div>
        )}
      </div>

      {/* Grid: Marks roster & Performance Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessment Marks Table */}
        <div className="lg:col-span-2 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <h2 className="text-sm font-semibold text-white">
              Assessment Scoresheet: {currentAssessment?.name}
            </h2>
            <span className="text-xs text-slate-400 font-mono">{marks.length} Graded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Register No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Marks Obtained</th>
                  <th className="p-3">Max Marks</th>
                  <th className="p-3">Score %</th>
                  <th className="p-3">Remarks / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {marks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No marks recorded for this assessment yet.
                    </td>
                  </tr>
                ) : (
                  marks.map((m) => {
                    const maxM = Number(currentAssessment?.max_marks || m.max_marks || 100);
                    const pct = maxM > 0 ? Math.round((Number(m.marks_obtained) / maxM) * 1000) / 10 : 0;
                    return (
                      <tr key={m.mark_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-teal-400 font-medium">{m.reg_number}</td>
                        <td className="p-3 font-medium text-slate-100">{m.student_name}</td>
                        <td className="p-3 font-mono font-bold text-white text-sm">
                          {m.is_absent ? (
                            <span className="text-rose-400 text-xs font-semibold">ABSENT</span>
                          ) : (
                            m.marks_obtained
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-400">{maxM}</td>
                        <td className="p-3 font-mono">
                          {m.is_absent ? (
                            '0%'
                          ) : (
                            <span className={pct >= 75 ? 'text-emerald-400 font-semibold' : pct < 45 ? 'text-amber-400' : 'text-slate-300'}>
                              {pct}%
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">{m.remarks || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aggregate Performance Ranking */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Performance Hierarchy</h3>
            </div>
            <Badge variant="teal">Aggregated</Badge>
          </div>

          <div className="p-3 max-h-[480px] overflow-y-auto space-y-2">
            {performance.map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-200">{p.student_name}</div>
                  <span className="font-mono text-xs font-bold text-teal-400">
                    {p.total_obtained} / {p.total_max}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>{p.subject_code}: {p.subject_name}</span>
                  <span className="font-semibold text-slate-300">{p.percentage}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-mono">{p.reg_number}</span>
                  <Badge variant={p.performance_tier === 'High Performer' ? 'emerald' : p.performance_tier === 'Needs Remedial' ? 'amber' : 'slate'}>
                    {p.grade}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE ASSESSMENT MODAL */}
      <Modal
        isOpen={showAddAssessment}
        onClose={() => setShowAddAssessment(false)}
        title="Schedule Assessment Unit"
        subtitle="Defines internal or external examination parameters"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAssessment} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Subject</label>
            <select
              value={assessmentForm.subject_id}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, subject_id: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.subject_id} value={sub.subject_id}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Assessment Name *</label>
            <input
              type="text"
              required
              value={assessmentForm.name}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, name: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Assessment Type</label>
              <select
                value={assessmentForm.assessment_type}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, assessment_type: e.target.value as any })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="Internal">Continuous Internal (CIA)</option>
                <option value="Semester_Exam">Semester End Exam (SEE)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Max Marks *</label>
              <input
                type="number"
                min="10"
                max="100"
                required
                value={assessmentForm.max_marks}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, max_marks: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Date Conducted</label>
            <input
              type="date"
              required
              value={assessmentForm.conduct_date}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, conduct_date: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddAssessment(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Save Assessment
            </button>
          </div>
        </form>
      </Modal>

      {/* ENTER MARKS MODAL */}
      <Modal
        isOpen={showEnterMark}
        onClose={() => setShowEnterMark(false)}
        title="Enter Student Marks"
        subtitle={`Assessment: ${currentAssessment?.name} (Max: ${currentAssessment?.max_marks})`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordMark} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Student</label>
            <select
              value={markForm.student_id}
              onChange={(e) => setMarkForm({ ...markForm, student_id: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.reg_number} — {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Marks Scored (0 - {currentAssessment?.max_marks})</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={currentAssessment?.max_marks || 100}
                disabled={markForm.is_absent}
                required
                value={markForm.marks_obtained}
                onChange={(e) => setMarkForm({ ...markForm, marks_obtained: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Absent Student?</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_absent"
                  checked={markForm.is_absent}
                  onChange={(e) => setMarkForm({ ...markForm, is_absent: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-teal-600 focus:ring-0"
                />
                <label htmlFor="is_absent" className="text-slate-300">Mark Absent (0 Score)</label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Faculty Remarks</label>
            <input
              type="text"
              placeholder="e.g. Strong conceptual grasp of SQL Joins"
              value={markForm.remarks}
              onChange={(e) => setMarkForm({ ...markForm, remarks: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEnterMark(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Commit Marks
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

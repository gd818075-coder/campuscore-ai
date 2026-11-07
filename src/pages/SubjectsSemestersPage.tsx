import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Subject, Semester, Course } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  BookOpen,
  Calendar,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Props {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const SubjectsSemestersPage: React.FC<Props> = ({ currentRole }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);

  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    credits: 4,
    course_id: 1,
    semester_number: 3,
    subject_type: 'Theory',
    max_internal_marks: 30,
    max_exam_marks: 70
  });

  const [semesterForm, setSemesterForm] = useState({
    course_id: 1,
    semester_number: 3,
    academic_year: '2024-2025',
    term: 'Odd',
    start_date: '2024-08-01',
    end_date: '2024-12-20',
    is_current: true
  });

  const isRestricted = currentRole === 'Student';

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, sems, crs] = await Promise.all([
        api.getSubjects(),
        api.getSemesters(),
        api.getCourses()
      ]);
      setSubjects(subs);
      setSemesters(sems);
      setCourses(crs);
      if (crs.length > 0) {
        setSubjectForm(prev => ({ ...prev, course_id: crs[0].course_id }));
        setSemesterForm(prev => ({ ...prev, course_id: crs[0].course_id }));
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load curriculum' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject(subjectForm as any);
      setToast({ type: 'success', message: `Subject ${subjectForm.code} added to syllabus!` });
      setShowAddSubject(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSemester(semesterForm as any);
      setToast({ type: 'success', message: `Semester structure created successfully!` });
      setShowAddSemester(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Subjects & Semesters</h1>
            <Badge variant="teal">Curriculum Structure</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure subjects, credits, assessment weightages (internal/exam), and academic terms.
          </p>
        </div>

        {!isRestricted && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddSemester(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Semester
            </button>
            <button
              onClick={() => setShowAddSubject(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subject
            </button>
          </div>
        )}
      </div>

      {/* Main Tables Grid */}
      <div className="space-y-6">
        {/* Subjects Table */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Syllabus Subjects ({subjects.length})</h2>
            </div>
            <button onClick={loadData} className="text-slate-400 hover:text-white" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Subject Code</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Program</th>
                  <th className="p-3">Semester</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Max Internal</th>
                  <th className="p-3">Max Exam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subjects.map((sub: any) => (
                  <tr key={sub.subject_id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-medium text-teal-400">{sub.code}</td>
                    <td className="p-3 text-slate-100 font-medium">{sub.name}</td>
                    <td className="p-3 text-slate-400">{sub.course_code || 'BCA'}</td>
                    <td className="p-3 text-slate-300">Sem {sub.semester_number}</td>
                    <td className="p-3 font-semibold text-slate-200">{sub.credits}</td>
                    <td className="p-3">
                      <Badge variant={sub.subject_type === 'Lab' ? 'teal' : 'slate'}>
                        {sub.subject_type}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400">{sub.max_internal_marks}</td>
                    <td className="p-3 text-slate-400">{sub.max_exam_marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Semesters Table */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Academic Semesters ({semesters.length})</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Course</th>
                  <th className="p-3">Semester Number</th>
                  <th className="p-3">Academic Year</th>
                  <th className="p-3">Term Type</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Current Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {semesters.map((sem: any) => (
                  <tr key={sem.semester_id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-slate-200">{sem.course_name}</td>
                    <td className="p-3 font-mono text-teal-400 font-semibold">Semester {sem.semester_number}</td>
                    <td className="p-3 text-slate-300">{sem.academic_year}</td>
                    <td className="p-3">
                      <Badge variant={sem.term === 'Odd' ? 'amber' : 'blue'}>{sem.term} Term</Badge>
                    </td>
                    <td className="p-3 text-slate-400">{sem.start_date}</td>
                    <td className="p-3 text-slate-400">{sem.end_date}</td>
                    <td className="p-3">
                      {sem.is_current ? (
                        <Badge variant="emerald">Active Cohort</Badge>
                      ) : (
                        <span className="text-slate-500">Concluded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD SUBJECT MODAL */}
      <Modal
        isOpen={showAddSubject}
        onClose={() => setShowAddSubject(false)}
        title="Add Curriculum Subject"
        subtitle="Defines course unit, credits, and exam breakdown"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Subject Code * (Unique)</label>
              <input
                type="text"
                required
                placeholder="e.g. BCA306"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Subject Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Web Programming"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Course Program</label>
              <select
                value={subjectForm.course_id}
                onChange={(e) => setSubjectForm({ ...subjectForm, course_id: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                {courses.map((c) => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Semester Number</label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={subjectForm.semester_number}
                onChange={(e) => setSubjectForm({ ...subjectForm, semester_number: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Credits (1 - 10)</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={subjectForm.credits}
                onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Subject Type</label>
              <select
                value={subjectForm.subject_type}
                onChange={(e) => setSubjectForm({ ...subjectForm, subject_type: e.target.value as any })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="Theory">Theory</option>
                <option value="Lab">Laboratory</option>
                <option value="Project">Project</option>
                <option value="Elective">Elective</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Max Internal Marks</label>
              <input
                type="number"
                min="0"
                max="100"
                value={subjectForm.max_internal_marks}
                onChange={(e) => setSubjectForm({ ...subjectForm, max_internal_marks: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Max Exam Marks</label>
              <input
                type="number"
                min="0"
                max="100"
                value={subjectForm.max_exam_marks}
                onChange={(e) => setSubjectForm({ ...subjectForm, max_exam_marks: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddSubject(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Insert Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD SEMESTER MODAL */}
      <Modal
        isOpen={showAddSemester}
        onClose={() => setShowAddSemester(false)}
        title="Schedule Academic Semester"
        subtitle="Unique constraint: (course_id, semester_number, academic_year)"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSemester} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Course Program</label>
            <select
              value={semesterForm.course_id}
              onChange={(e) => setSemesterForm({ ...semesterForm, course_id: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Semester Number</label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={semesterForm.semester_number}
                onChange={(e) => setSemesterForm({ ...semesterForm, semester_number: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Academic Year</label>
              <input
                type="text"
                placeholder="2024-2025"
                required
                value={semesterForm.academic_year}
                onChange={(e) => setSemesterForm({ ...semesterForm, academic_year: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Term</label>
              <select
                value={semesterForm.term}
                onChange={(e) => setSemesterForm({ ...semesterForm, term: e.target.value as any })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="Odd">Odd Semester</option>
                <option value="Even">Even Semester</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Current Active Term?</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_current"
                  checked={semesterForm.is_current}
                  onChange={(e) => setSemesterForm({ ...semesterForm, is_current: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-teal-600 focus:ring-0"
                />
                <label htmlFor="is_current" className="text-slate-300">Set as Current</label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Start Date</label>
              <input
                type="date"
                required
                value={semesterForm.start_date}
                onChange={(e) => setSemesterForm({ ...semesterForm, start_date: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">End Date</label>
              <input
                type="date"
                required
                value={semesterForm.end_date}
                onChange={(e) => setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddSemester(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Create Semester
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

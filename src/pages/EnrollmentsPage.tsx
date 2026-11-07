import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Enrollment, Student, Course, Semester } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  UserCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Filter
} from 'lucide-react';

interface Props {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const EnrollmentsPage: React.FC<Props> = ({ currentRole }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: 1,
    course_id: 1,
    semester_id: 3,
    academic_year: '2024-2025',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const isRestricted = currentRole === 'Student';

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrList, stuList, crsList, semList] = await Promise.all([
        api.getEnrollments(),
        api.getStudents(),
        api.getCourses(),
        api.getSemesters()
      ]);
      setEnrollments(enrList);
      setStudents(stuList);
      setCourses(crsList);
      setSemesters(semList);
      if (stuList.length > 0) setFormData(prev => ({ ...prev, student_id: stuList[0].student_id }));
      if (crsList.length > 0) setFormData(prev => ({ ...prev, course_id: crsList[0].course_id }));
      if (semList.length > 0) setFormData(prev => ({ ...prev, semester_id: semList[0].semester_id }));
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load enrollment roster' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEnrollment(formData as any);
      setToast({ type: 'success', message: 'Student successfully registered for semester!' });
      setShowAddModal(false);
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Student Enrollments</h1>
            <Badge variant="teal">{enrollments.length} Active Records</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tracks academic progression per semester; enforces UNIQUE constraint on (student_id, semester_id, academic_year).
          </p>
        </div>

        {!isRestricted && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Register Student in Semester
          </button>
        )}
      </div>

      {/* Enrollments Table */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Enrollment Roster</h2>
          </div>
          <button onClick={loadData} className="text-slate-400 hover:text-white" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Enrollment ID</th>
                <th className="p-3">Register Number</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Course</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Academic Year</th>
                <th className="p-3">Enrollment Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {enrollments.map((enr) => (
                <tr key={enr.enrollment_id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-500">#{enr.enrollment_id}</td>
                  <td className="p-3 font-mono text-teal-400 font-medium">{enr.reg_number}</td>
                  <td className="p-3 font-medium text-slate-200">{enr.student_name}</td>
                  <td className="p-3 text-slate-300">{enr.course_name}</td>
                  <td className="p-3 text-slate-300">Semester {enr.semester_number}</td>
                  <td className="p-3 font-mono text-slate-400">{enr.academic_year}</td>
                  <td className="p-3 text-slate-400">{enr.enrollment_date}</td>
                  <td className="p-3">
                    <Badge variant={enr.status === 'Active' ? 'emerald' : 'slate'}>{enr.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ENROLLMENT MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Enroll Student in Term"
        subtitle="Enforces foreign key and candidate uniqueness constraints"
        maxWidth="md"
      >
        <form onSubmit={handleEnroll} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Student</label>
            <select
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.reg_number} — {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Course Program</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: Number(e.target.value) })}
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
              <label className="block text-slate-400 font-medium mb-1">Semester</label>
              <select
                value={formData.semester_id}
                onChange={(e) => setFormData({ ...formData, semester_id: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                {semesters.map((sem) => (
                  <option key={sem.semester_id} value={sem.semester_id}>
                    Sem {sem.semester_number} ({sem.academic_year})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Academic Year</label>
              <input
                type="text"
                required
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Create Enrollment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

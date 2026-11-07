import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { FacultyMember, Department, Subject, Semester } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  GraduationCap,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Mail,
  Phone
} from 'lucide-react';

interface Props {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const FacultyPage: React.FC<Props> = ({ currentRole }) => {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [facultyForm, setFacultyForm] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: 1,
    designation: 'Assistant Professor',
    qualification: 'Ph.D in Computer Science',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const [assignForm, setAssignForm] = useState({
    faculty_id: 1,
    subject_id: 1,
    academic_year: '2024-2025',
    semester_id: 3
  });

  const isRestricted = currentRole === 'Student';

  const loadData = async () => {
    try {
      setLoading(true);
      const [facList, deptList, subList, semList] = await Promise.all([
        api.getFaculty(),
        api.getDepartments(),
        api.getSubjects(),
        api.getSemesters()
      ]);
      setFaculty(facList);
      setDepartments(deptList);
      setSubjects(subList);
      setSemesters(semList);
      if (deptList.length > 0) setFacultyForm(prev => ({ ...prev, department_id: deptList[0].department_id }));
      if (facList.length > 0) setAssignForm(prev => ({ ...prev, faculty_id: facList[0].faculty_id }));
      if (subList.length > 0) setAssignForm(prev => ({ ...prev, subject_id: subList[0].subject_id }));
      if (semList.length > 0) setAssignForm(prev => ({ ...prev, semester_id: semList[0].semester_id }));
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load faculty roster' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFaculty(facultyForm as any);
      setToast({ type: 'success', message: `Faculty ${facultyForm.first_name} ${facultyForm.last_name} registered successfully!` });
      setShowAddFaculty(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.assignFacultySubject(assignForm);
      setToast({ type: 'success', message: 'Subject allocated to faculty member successfully!' });
      setShowAssignModal(false);
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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Faculty Directory & Allocations</h1>
            <Badge variant="teal">{faculty.length} Faculty Members</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Store designations, academic credentials, and subject teaching assignments per term.
          </p>
        </div>

        {!isRestricted && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Assign Subject
            </button>
            <button
              onClick={() => {
                setFacultyForm({
                  employee_code: `FAC-${Math.floor(100 + Math.random() * 900)}`,
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone: '9876543210',
                  department_id: departments[0]?.department_id || 1,
                  designation: 'Assistant Professor',
                  qualification: 'M.Tech in Computer Applications',
                  joining_date: new Date().toISOString().split('T')[0],
                  status: 'Active'
                });
                setShowAddFaculty(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Faculty
            </button>
          </div>
        )}
      </div>

      {/* Faculty Cards / Table */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Appointed Teaching Faculty</h2>
          </div>
          <button onClick={loadData} className="text-slate-400 hover:text-white" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Emp Code</th>
                <th className="p-3">Faculty Name</th>
                <th className="p-3">Designation & Dept</th>
                <th className="p-3">Qualification</th>
                <th className="p-3">Assigned Teaching Subjects</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {faculty.map((f) => (
                <tr key={f.faculty_id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-teal-400 font-medium">{f.employee_code}</td>
                  <td className="p-3 font-medium text-slate-100">
                    {f.first_name} {f.last_name}
                    <div className="text-[11px] text-slate-400 font-normal">{f.email}</div>
                  </td>
                  <td className="p-3 text-slate-300">
                    <div>{f.designation}</div>
                    <div className="text-[11px] text-slate-500">{f.department_name}</div>
                  </td>
                  <td className="p-3 text-slate-400">{f.qualification}</td>
                  <td className="p-3">
                    {f.assigned_subjects && f.assigned_subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {f.assigned_subjects.map((subj, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] bg-slate-800 border border-slate-700 text-slate-300"
                          >
                            {subj}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No assigned subjects</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={f.status === 'Active' ? 'emerald' : 'slate'}>{f.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD FACULTY MODAL */}
      <Modal
        isOpen={showAddFaculty}
        onClose={() => setShowAddFaculty(false)}
        title="Register Faculty Member"
        subtitle="Adds an academic faculty tuple with department relationship"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateFaculty} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Employee Code * (Unique)</label>
              <input
                type="text"
                required
                value={facultyForm.employee_code}
                onChange={(e) => setFacultyForm({ ...facultyForm, employee_code: e.target.value.toUpperCase() })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Department</label>
              <select
                value={facultyForm.department_id}
                onChange={(e) => setFacultyForm({ ...facultyForm, department_id: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">First Name *</label>
              <input
                type="text"
                required
                value={facultyForm.first_name}
                onChange={(e) => setFacultyForm({ ...facultyForm, first_name: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={facultyForm.last_name}
                onChange={(e) => setFacultyForm({ ...facultyForm, last_name: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Email * (Unique)</label>
              <input
                type="email"
                required
                value={facultyForm.email}
                onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Phone</label>
              <input
                type="text"
                value={facultyForm.phone}
                onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Designation</label>
              <select
                value={facultyForm.designation}
                onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="HOD">HOD</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Qualification</label>
              <input
                type="text"
                value={facultyForm.qualification}
                onChange={(e) => setFacultyForm({ ...facultyForm, qualification: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddFaculty(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Register Faculty
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN SUBJECT MODAL */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Subject to Faculty"
        subtitle="Bridge table insertion (faculty_subject_assignments)"
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubject} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Faculty Member</label>
            <select
              value={assignForm.faculty_id}
              onChange={(e) => setAssignForm({ ...assignForm, faculty_id: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              {faculty.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.employee_code} — {f.first_name} {f.last_name} ({f.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Subject</label>
            <select
              value={assignForm.subject_id}
              onChange={(e) => setAssignForm({ ...assignForm, subject_id: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.subject_id} value={sub.subject_id}>
                  {sub.code} — {sub.name} (Sem {sub.semester_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Academic Year</label>
              <input
                type="text"
                required
                value={assignForm.academic_year}
                onChange={(e) => setAssignForm({ ...assignForm, academic_year: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Semester</label>
              <select
                value={assignForm.semester_id}
                onChange={(e) => setAssignForm({ ...assignForm, semester_id: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                {semesters.map((sem) => (
                  <option key={sem.semester_id} value={sem.semester_id}>
                    Sem {sem.semester_number} ({sem.academic_year})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Assign Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

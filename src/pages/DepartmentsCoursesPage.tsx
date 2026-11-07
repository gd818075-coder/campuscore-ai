import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Department, Course } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  Building2,
  BookOpen,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  GraduationCap
} from 'lucide-react';

interface Props {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const DepartmentsCoursesPage: React.FC<Props> = ({ currentRole }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);

  // Form states
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    established_year: 2010,
    building: '',
    head_of_dept: ''
  });

  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    department_id: 1,
    duration_years: 3,
    total_semesters: 6,
    degree_level: 'Undergraduate'
  });

  const isRestricted = currentRole === 'Student';

  const loadData = async () => {
    try {
      setLoading(true);
      const [depts, crs] = await Promise.all([
        api.getDepartments(),
        api.getCourses()
      ]);
      setDepartments(depts);
      setCourses(crs);
      if (depts.length > 0) {
        setCourseForm(prev => ({ ...prev, department_id: depts[0].department_id }));
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch academic data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment(deptForm);
      setToast({ type: 'success', message: `Department ${deptForm.code} created successfully!` });
      setShowAddDept(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse(courseForm);
      setToast({ type: 'success', message: `Course ${courseForm.code} created successfully!` });
      setShowAddCourse(false);
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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Departments & Degree Programs</h1>
            <Badge variant="teal">3NF Relational Structure</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Top-level organizational hierarchy enforcing 1:N department-to-course foreign key integrity.
          </p>
        </div>

        {!isRestricted && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDeptForm({ code: '', name: '', established_year: 2015, building: '', head_of_dept: '' });
                setShowAddDept(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Department
            </button>
            <button
              onClick={() => {
                setCourseForm({
                  code: '',
                  name: '',
                  department_id: departments[0]?.department_id || 1,
                  duration_years: 3,
                  total_semesters: 6,
                  degree_level: 'Undergraduate'
                });
                setShowAddCourse(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Course
            </button>
          </div>
        )}
      </div>

      {/* Grid: Departments and Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments Table */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">University Departments ({departments.length})</h2>
            </div>
            <button onClick={loadData} className="text-slate-400 hover:text-white" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Building</th>
                  <th className="p-3">Head of Department</th>
                  <th className="p-3">Est. Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {departments.map((d: any) => (
                  <tr key={d.department_id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-medium text-teal-400">{d.code}</td>
                    <td className="p-3 text-slate-100 font-medium">{d.name}</td>
                    <td className="p-3 text-slate-300">{d.building}</td>
                    <td className="p-3 text-slate-400">{d.head_of_dept || 'Vacant'}</td>
                    <td className="p-3 text-slate-400 font-mono">{d.established_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Courses Table */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Degree Programs / Courses ({courses.length})</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Course Title</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {courses.map((c: any) => (
                  <tr key={c.course_id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-medium text-teal-400">{c.code}</td>
                    <td className="p-3 text-slate-100 font-medium">{c.name}</td>
                    <td className="p-3 text-slate-400">{c.department_name}</td>
                    <td className="p-3 text-slate-300">{c.duration_years} Years ({c.total_semesters} Sem)</td>
                    <td className="p-3">
                      <Badge variant="blue">{c.degree_level}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD DEPARTMENT MODAL */}
      <Modal
        isOpen={showAddDept}
        onClose={() => setShowAddDept(false)}
        title="Register New Department"
        subtitle="Adds an academic department entity to campuscore_db"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Department Code * (Unique)</label>
            <input
              type="text"
              required
              placeholder="e.g. DCA"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 uppercase font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Department of Computer Applications"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Building Location *</label>
            <input
              type="text"
              required
              placeholder="e.g. Turing Complex"
              value={deptForm.building}
              onChange={(e) => setDeptForm({ ...deptForm, building: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Head of Department (HOD)</label>
            <input
              type="text"
              placeholder="e.g. Dr. Ramesh Ramanujan"
              value={deptForm.head_of_dept}
              onChange={(e) => setDeptForm({ ...deptForm, head_of_dept: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Established Year</label>
            <input
              type="number"
              min="1950"
              max="2100"
              required
              value={deptForm.established_year}
              onChange={(e) => setDeptForm({ ...deptForm, established_year: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddDept(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Insert Department
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD COURSE MODAL */}
      <Modal
        isOpen={showAddCourse}
        onClose={() => setShowAddCourse(false)}
        title="Create Degree Program / Course"
        subtitle="Registers program linked to department via FK"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Course Code * (Unique)</label>
            <input
              type="text"
              required
              placeholder="e.g. BCA"
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 uppercase font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Course Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bachelor of Computer Applications"
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Department * (Foreign Key)</label>
            <select
              value={courseForm.department_id}
              onChange={(e) => setCourseForm({ ...courseForm, department_id: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Duration (Years)</label>
              <input
                type="number"
                min="1"
                max="6"
                value={courseForm.duration_years}
                onChange={(e) => setCourseForm({ ...courseForm, duration_years: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Total Semesters</label>
              <input
                type="number"
                min="1"
                max="12"
                value={courseForm.total_semesters}
                onChange={(e) => setCourseForm({ ...courseForm, total_semesters: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Degree Level</label>
            <select
              value={courseForm.degree_level}
              onChange={(e) => setCourseForm({ ...courseForm, degree_level: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="Diploma">Diploma</option>
              <option value="Doctorate">Doctorate</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddCourse(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Insert Course
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

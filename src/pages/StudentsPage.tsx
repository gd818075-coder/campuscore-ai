import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Student } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

interface StudentsPageProps {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ currentRole }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    reg_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    dob: '2004-05-15',
    gender: 'Male',
    blood_group: 'O+',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    admission_date: new Date().toISOString().split('T')[0],
    current_semester_id: 3,
    status: 'Active'
  });

  const isRestricted = currentRole === 'Student';

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStudents({
        search: search.trim() || undefined,
        semester: semesterFilter ? Number(semesterFilter) : undefined,
        status: statusFilter || undefined
      });
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [semesterFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const handleViewDetails = async (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
    setLoadingDetails(true);
    try {
      const details = await api.getStudentById(student.student_id);
      setStudentDetails(details);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load student dossier' });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      reg_number: student.reg_number,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone,
      dob: student.dob,
      gender: student.gender,
      blood_group: student.blood_group,
      address: student.address,
      city: student.city,
      state: student.state,
      admission_date: student.admission_date,
      current_semester_id: student.current_semester_id || 3,
      status: student.status
    });
    setShowEditModal(true);
  };

  const handleOpenDelete = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStudent(formData as any);
      setToast({ type: 'success', message: `Student ${formData.reg_number} created successfully!` });
      setShowAddModal(false);
      loadStudents();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await api.updateStudent(selectedStudent.student_id, formData as any);
      setToast({ type: 'success', message: `Student ${selectedStudent.reg_number} updated successfully!` });
      setShowEditModal(false);
      loadStudents();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      await api.deleteStudent(selectedStudent.student_id);
      setToast({ type: 'success', message: `Student ${selectedStudent.reg_number} removed from database.` });
      setShowDeleteModal(false);
      loadStudents();
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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Student Management</h1>
            <Badge variant="teal">{students.length} Records</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain personal profiles, contact records, semester progression, and relational integrity.
          </p>
        </div>

        {!isRestricted && (
          <button
            onClick={() => {
              setFormData({
                reg_number: `BCA20240${Math.floor(10 + Math.random() * 90)}`,
                first_name: '',
                last_name: '',
                email: '',
                phone: '9876543210',
                dob: '2005-03-20',
                gender: 'Male',
                blood_group: 'O+',
                address: '12 University Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                admission_date: new Date().toISOString().split('T')[0],
                current_semester_id: 3,
                status: 'Active'
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Enroll New Student
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, registration no, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 focus:outline-hidden focus:border-teal-500 cursor-pointer"
          >
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 focus:outline-hidden focus:border-teal-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Graduated">Graduated</option>
            <option value="Suspended">Suspended</option>
          </select>

          <button
            onClick={loadStudents}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Register No</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Course & Semester</th>
                <th className="p-3">Contact</th>
                <th className="p-3">City / State</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
                    Fetching student tuples from database...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No student records matching your query criteria.
                  </td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr key={stu.student_id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-medium text-teal-400">{stu.reg_number}</td>
                    <td className="p-3 text-slate-100 font-medium">
                      {stu.first_name} {stu.last_name}
                      <div className="text-[11px] text-slate-400 font-normal">{stu.email}</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {stu.course_name || 'BCA'}
                      <div className="text-[11px] text-slate-500">Sem {stu.semester_number || 3}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[11px]">{stu.phone}</td>
                    <td className="p-3 text-slate-400">{stu.city}, {stu.state}</td>
                    <td className="p-3">
                      <Badge variant={stu.status === 'Active' ? 'emerald' : 'slate'}>
                        {stu.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(stu)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          title="View Full Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!isRestricted && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(stu)}
                              className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-800"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(stu)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DOSSIER MODAL */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name} (${selectedStudent.reg_number})` : 'Student Profile'}
        subtitle="Live relational dossier across enrollments, attendance %, marks, and fee dues"
        maxWidth="2xl"
      >
        {loadingDetails ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
            Loading student academic profile...
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Demographics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950/70 rounded border border-slate-800">
              <div>
                <span className="text-slate-500">Email:</span>
                <div className="text-slate-200 mt-0.5 truncate">{selectedStudent?.email}</div>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <div className="text-slate-200 mt-0.5">{selectedStudent?.phone}</div>
              </div>
              <div>
                <span className="text-slate-500">DOB & Blood:</span>
                <div className="text-slate-200 mt-0.5">{selectedStudent?.dob} ({selectedStudent?.blood_group})</div>
              </div>
              <div>
                <span className="text-slate-500">Admission:</span>
                <div className="text-slate-200 mt-0.5">{selectedStudent?.admission_date}</div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="rounded border border-slate-800 p-3 bg-slate-950/40">
              <div className="font-semibold text-slate-200 mb-2 flex items-center justify-between">
                <span>Subject Attendance Breakdown</span>
                <Badge variant="teal">Aggregated</Badge>
              </div>
              {studentDetails?.attendance?.length === 0 ? (
                <div className="text-slate-500 py-2">No attendance logged yet for this student.</div>
              ) : (
                <div className="space-y-1.5">
                  {studentDetails?.attendance?.map((att: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-medium text-slate-300">{att.subject_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{att.attended} / {att.total_classes} sessions</span>
                        <span className={`font-semibold ${att.percentage < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {att.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment Marks */}
            <div className="rounded border border-slate-800 p-3 bg-slate-950/40">
              <div className="font-semibold text-slate-200 mb-2">Graded Assessments</div>
              {studentDetails?.marks?.length === 0 ? (
                <div className="text-slate-500 py-2">No examination marks entered yet.</div>
              ) : (
                <div className="space-y-1.5">
                  {studentDetails?.marks?.map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <div>
                        <span className="font-medium text-slate-200">{m.subject_name}</span>
                        <span className="text-slate-400 ml-2">({m.assessment_name})</span>
                      </div>
                      <div className="font-mono font-semibold text-teal-400">
                        {m.is_absent ? 'ABSENT' : `${m.marks_obtained} / ${m.max_marks}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fee Status */}
            <div className="rounded border border-slate-800 p-3 bg-slate-950/40">
              <div className="font-semibold text-slate-200 mb-2">Fee Dues & Settlements</div>
              {studentDetails?.fees?.length === 0 ? (
                <div className="text-slate-500 py-2">No billing records on file.</div>
              ) : (
                <div className="space-y-1.5">
                  {studentDetails?.fees?.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <div>
                        <span className="font-medium text-slate-200">{f.fee_type} Fee</span>
                        <span className="text-slate-500 ml-2">Due: {f.due_date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">Due: ₹{f.amount_due}</span>
                        <span className={`font-semibold ${f.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {f.balance > 0 ? `Pending: ₹${f.balance}` : 'Paid in Full'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ADD STUDENT MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Enroll New Student"
        subtitle="Inserts a new tuple into the students table with candidate key validation"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Registration Number * (Unique)</label>
              <input
                type="text"
                required
                value={formData.reg_number}
                onChange={(e) => setFormData({ ...formData, reg_number: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Admission Date *</label>
              <input
                type="date"
                required
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Institutional Email * (Unique)</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@student.campuscore.edu"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Insert Student Record
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Student: ${formData.first_name} ${formData.last_name}`}
        subtitle={`Register Number: ${formData.reg_number}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Phone</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              >
                <option value="Active">Active</option>
                <option value="Graduated">Graduated</option>
                <option value="Suspended">Suspended</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Current Semester</label>
              <select
                value={formData.current_semester_id}
                onChange={(e) => setFormData({ ...formData, current_semester_id: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
                <option value={3}>Semester 3</option>
                <option value={4}>Semester 4</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Update Tuple
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Student Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Are you sure you want to delete student <strong className="text-white">{selectedStudent?.reg_number}</strong> ({selectedStudent?.first_name} {selectedStudent?.last_name})?
          </p>
          <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300">
            <strong>Referential Integrity Note:</strong> Deleting this student record will cascade delete associated enrollments, marks, attendance sessions, and fee payments.
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStudent}
              className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white font-medium"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

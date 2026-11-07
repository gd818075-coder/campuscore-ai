import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { StudentFeedback, Student, FacultyMember, Subject } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Star,
  CheckCheck
} from 'lucide-react';

interface Props {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const FeedbackPage: React.FC<Props> = ({ currentRole }) => {
  const [feedbackList, setFeedbackList] = useState<StudentFeedback[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, averageRating: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: 1,
    faculty_id: 1 as number | null,
    subject_id: 1 as number | null,
    rating: 5,
    category: 'Course Delivery',
    comments: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fbData, stus, facs, subs] = await Promise.all([
        api.getFeedback({ category: categoryFilter || undefined }),
        api.getStudents(),
        api.getFaculty(),
        api.getSubjects()
      ]);
      setFeedbackList(fbData);
      setStudents(stus);
      setFaculty(facs);
      setSubjects(subs);
      if (stus.length > 0) setFormData(prev => ({ ...prev, student_id: stus[0].student_id }));
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load student feedback' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitFeedback(formData as any);
      setToast({ type: 'success', message: 'Thank you! Your feedback has been recorded into the database.' });
      setShowSubmitModal(false);
      setFormData(prev => ({ ...prev, comments: '' }));
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleReview = async (id: number) => {
    try {
      await api.reviewFeedback(id);
      setToast({ type: 'success', message: 'Feedback status updated to Reviewed.' });
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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Student Academic & Campus Feedback</h1>
            <Badge variant="teal">{feedbackList.length} Submissions</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quality assurance records capturing student input on course delivery, lab facilities, and campus amenities.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Submit Feedback
        </button>
      </div>

      {/* Filter and Category Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Filter Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Course Delivery">Course Delivery</option>
            <option value="Lab Facilities">Lab Facilities</option>
            <option value="Examination Evaluation">Examination Evaluation</option>
            <option value="General Campus">General Campus</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Feedback Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {feedbackList.map((fb) => (
          <div
            key={fb.feedback_id}
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xs text-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge variant="blue">{fb.category}</Badge>
                <div className="font-semibold text-slate-200 text-sm mt-1.5">
                  {fb.student_name}
                  <span className="text-slate-500 font-mono text-xs ml-2">({fb.reg_number})</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-300 font-mono">{fb.rating}/5</span>
              </div>
            </div>

            <p className="text-slate-300 italic bg-slate-950/60 p-3 rounded border border-slate-800/80 leading-relaxed">
              "{fb.comments}"
            </p>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
              <div>
                {fb.faculty_name && <span>Faculty: <strong className="text-slate-300">{fb.faculty_name}</strong></span>}
                {fb.subject_name && <span className="ml-2">({fb.subject_name})</span>}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={fb.status === 'Reviewed' ? 'emerald' : 'amber'}>
                  {fb.status}
                </Badge>
                {currentRole === 'Administrator' && fb.status === 'Pending' && (
                  <button
                    onClick={() => handleReview(fb.feedback_id)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 text-[10px] transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SUBMIT FEEDBACK MODAL */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Quality Feedback"
        subtitle="Appends feedback tuple into student_feedback table"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Submitting Student</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Feedback Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="Course Delivery">Course Delivery</option>
                <option value="Lab Facilities">Lab Facilities</option>
                <option value="Examination Evaluation">Examination Evaluation</option>
                <option value="General Campus">General Campus</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Rating (1 to 5 Stars)</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer font-bold text-amber-400"
              >
                <option value={5}>★★★★★ (5 - Excellent)</option>
                <option value={4}>★★★★☆ (4 - Good)</option>
                <option value={3}>★★★☆☆ (3 - Satisfactory)</option>
                <option value={2}>★★☆☆☆ (2 - Needs Attention)</option>
                <option value={1}>★☆☆☆☆ (1 - Unsatisfactory)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Faculty Member (Optional)</label>
              <select
                value={formData.faculty_id || ''}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="">General / None</option>
                {faculty.map((f) => (
                  <option key={f.faculty_id} value={f.faculty_id}>
                    {f.first_name} {f.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Subject (Optional)</label>
              <select
                value={formData.subject_id || ''}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="">General / None</option>
                {subjects.map((sub) => (
                  <option key={sub.subject_id} value={sub.subject_id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Comments / Detailed Evaluation *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide constructive feedback regarding syllabus pacing, practical exercises, etc."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

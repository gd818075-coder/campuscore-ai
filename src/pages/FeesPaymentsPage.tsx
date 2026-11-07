import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { FeeRecord, FeePayment, Student, Semester } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  CreditCard,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Receipt,
  FileText,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface Props {
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

export const FeesPaymentsPage: React.FC<Props> = ({ currentRole }) => {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showAddDueModal, setShowAddDueModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState<FeeRecord | null>(null);

  // Forms
  const [dueForm, setDueForm] = useState({
    student_id: 1,
    semester_id: 3,
    fee_type: 'Tuition',
    amount_due: 45000,
    due_date: '2024-09-30'
  });

  const [payForm, setPayForm] = useState({
    fee_record_id: 1,
    receipt_number: '',
    amount_paid: 20000,
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'Bank Transfer',
    transaction_ref: '',
    notes: 'Semester tuition clearance'
  });

  const isRestricted = currentRole === 'Student';

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, pymts, stus, sems] = await Promise.all([
        api.getFeeRecords(),
        api.getFeePayments(),
        api.getStudents(),
        api.getSemesters()
      ]);
      setFeeRecords(recs);
      setPayments(pymts);
      setStudents(stus);
      setSemesters(sems);
      if (stus.length > 0) setDueForm(prev => ({ ...prev, student_id: stus[0].student_id }));
      if (sems.length > 0) setDueForm(prev => ({ ...prev, semester_id: sems[0].semester_id }));
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load fee ledger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPaymentModal = (due: FeeRecord) => {
    setSelectedDue(due);
    const balance = due.pending_balance !== undefined ? due.pending_balance : due.amount_due;
    setPayForm({
      fee_record_id: due.fee_record_id,
      receipt_number: `RCP-2024-${Math.floor(100 + Math.random() * 900)}`,
      amount_paid: balance > 0 ? balance : 5000,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: 'UPI Reference',
      transaction_ref: `TXN-REF-${Date.now().toString().slice(-6)}`,
      notes: `Fee settlement for ${due.student_name}`
    });
    setShowPayModal(true);
  };

  const handleCreateDue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFeeRecord(dueForm as any);
      setToast({ type: 'success', message: 'Fee invoice record created successfully!' });
      setShowAddDueModal(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordPayment(payForm as any);
      setToast({ type: 'success', message: `Receipt ${payForm.receipt_number} issued and ledger updated!` });
      setShowPayModal(false);
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

      {/* Academic Disclaimer Notice */}
      <div className="p-3 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            <strong>BCA Academic Simulation:</strong> This module records administrative university invoices and fee receipts. It is not an actual payment gateway and does not store cardholder data.
          </span>
        </div>
        <Badge variant="teal">Ledger Audit Safe</Badge>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Fees, Dues & Payment Ledgers</h1>
            <Badge variant="teal">3NF Normalized Ledger</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calculates outstanding balances dynamically via SQL aggregations: (Amount Due - SUM(Payments)).
          </p>
        </div>

        {!isRestricted && (
          <button
            onClick={() => setShowAddDueModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Issue Fee Invoice Due
          </button>
        )}
      </div>

      {/* Grid: Fee Records & Payment Receipts */}
      <div className="space-y-6">
        {/* Fee Invoices Table */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white">Student Fee Billing Invoices</h2>
            </div>
            <button onClick={loadData} className="text-slate-400 hover:text-white" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Register No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Fee Type</th>
                  <th className="p-3">Amount Due (₹)</th>
                  <th className="p-3">Paid to Date (₹)</th>
                  <th className="p-3">Pending Balance (₹)</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Payment Status</th>
                  {!isRestricted && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {feeRecords.map((fr) => {
                  const balance = fr.pending_balance !== undefined ? fr.pending_balance : (fr.amount_due - (fr.total_paid || 0));
                  return (
                    <tr key={fr.fee_record_id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-teal-400 font-medium">{fr.reg_number}</td>
                      <td className="p-3 font-medium text-slate-100">{fr.student_name}</td>
                      <td className="p-3 text-slate-300">{fr.fee_type}</td>
                      <td className="p-3 font-mono font-medium text-slate-200">₹{Number(fr.amount_due).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono text-emerald-400">₹{Number(fr.total_paid || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono font-semibold">
                        {balance > 0 ? (
                          <span className="text-rose-400">₹{Number(balance).toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-500">₹0.00</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-400">{fr.due_date}</td>
                      <td className="p-3">
                        <Badge variant={balance === 0 ? 'emerald' : fr.total_paid && fr.total_paid > 0 ? 'amber' : 'rose'}>
                          {balance === 0 ? 'Paid' : fr.total_paid && fr.total_paid > 0 ? 'Partially Paid' : 'Pending'}
                        </Badge>
                      </td>
                      {!isRestricted && (
                        <td className="p-3 text-right">
                          {balance > 0 && (
                            <button
                              onClick={() => openPaymentModal(fr)}
                              className="px-2.5 py-1 rounded bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 transition-colors"
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Receipts Table */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-white">Audited Payment Receipts (fee_payments)</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{payments.length} Transactions</span>
          </div>

          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2.5">Receipt No</th>
                  <th className="p-2.5">Student</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Amount Paid</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5">Reference No</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono text-teal-400 font-medium">{p.receipt_number}</td>
                    <td className="p-2.5 text-slate-200 font-medium">{p.student_name} ({p.reg_number})</td>
                    <td className="p-2.5 text-slate-400">{p.fee_type}</td>
                    <td className="p-2.5 font-mono text-emerald-400 font-bold">₹{Number(p.amount_paid).toLocaleString('en-IN')}</td>
                    <td className="p-2.5 font-mono text-slate-300">{p.payment_date}</td>
                    <td className="p-2.5">
                      <Badge variant="blue">{p.payment_mode}</Badge>
                    </td>
                    <td className="p-2.5 font-mono text-slate-400">{p.transaction_ref || '—'}</td>
                    <td className="p-2.5 text-slate-400">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ISSUE DUE INVOICE MODAL */}
      <Modal
        isOpen={showAddDueModal}
        onClose={() => setShowAddDueModal(false)}
        title="Issue Fee Invoice"
        subtitle="Creates receivable invoice in fee_records table"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDue} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Student</label>
            <select
              value={dueForm.student_id}
              onChange={(e) => setDueForm({ ...dueForm, student_id: Number(e.target.value) })}
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
            <label className="block text-slate-400 font-medium mb-1">Semester</label>
            <select
              value={dueForm.semester_id}
              onChange={(e) => setDueForm({ ...dueForm, semester_id: Number(e.target.value) })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
            >
              {semesters.map((sem) => (
                <option key={sem.semester_id} value={sem.semester_id}>
                  Sem {sem.semester_number} ({sem.academic_year})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Fee Type</label>
              <select
                value={dueForm.fee_type}
                onChange={(e) => setDueForm({ ...dueForm, fee_type: e.target.value as any })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="Tuition">Tuition Fee</option>
                <option value="Examination">Examination Fee</option>
                <option value="Library">Library Fee</option>
                <option value="Laboratory">Laboratory Fee</option>
                <option value="Hostel">Hostel Fee</option>
                <option value="Special">Special Fee</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Amount Due (₹) *</label>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={dueForm.amount_due}
                onChange={(e) => setDueForm({ ...dueForm, amount_due: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Payment Due Date</label>
            <input
              type="date"
              required
              value={dueForm.due_date}
              onChange={(e) => setDueForm({ ...dueForm, due_date: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddDueModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Issue Due Record
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title={`Record Payment for ${selectedDue?.student_name}`}
        subtitle={`Fee Type: ${selectedDue?.fee_type} | Outstanding Balance: ₹${selectedDue?.pending_balance}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
          <div className="p-3 rounded bg-slate-950 border border-slate-800 flex justify-between items-center font-mono">
            <span className="text-slate-400">Current Outstanding:</span>
            <span className="font-bold text-rose-400 text-sm">₹{selectedDue?.pending_balance}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Receipt Number * (Unique)</label>
              <input
                type="text"
                required
                value={payForm.receipt_number}
                onChange={(e) => setPayForm({ ...payForm, receipt_number: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                min="1"
                max={selectedDue?.pending_balance || 100000}
                required
                value={payForm.amount_paid}
                onChange={(e) => setPayForm({ ...payForm, amount_paid: Number(e.target.value) })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Payment Mode</label>
              <select
                value={payForm.payment_mode}
                onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value as any })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 cursor-pointer"
              >
                <option value="UPI Reference">UPI Reference</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                <option value="Demand Draft">Demand Draft</option>
                <option value="Cash">Cash at Counter</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={payForm.payment_date}
                onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Transaction Reference / UTR Number</label>
            <input
              type="text"
              placeholder="e.g. UPI-984920194820"
              value={payForm.transaction_ref}
              onChange={(e) => setPayForm({ ...payForm, transaction_ref: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Audit Notes</label>
            <input
              type="text"
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPayModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              Record Payment Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

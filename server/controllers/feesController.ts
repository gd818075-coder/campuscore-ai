import { Request, Response } from 'express';
import { dbQuery, dbExecute } from '../db/connection.ts';
import { FeeRecord, FeePayment } from '../db/types.ts';

// -----------------------------------------------------------------------------
// FEE RECORDS (DUES)
// -----------------------------------------------------------------------------
export async function getFeeRecords(req: Request, res: Response) {
  try {
    const { student_id, semester_id, status } = req.query;

    let sql = `
      SELECT 
        fr.*,
        (s.first_name || ' ' || s.last_name) as student_name,
        s.reg_number,
        sem.semester_number,
        COALESCE(SUM(fp.amount_paid), 0) as total_paid,
        (fr.amount_due - COALESCE(SUM(fp.amount_paid), 0)) as pending_balance,
        CASE 
          WHEN COALESCE(SUM(fp.amount_paid), 0) >= fr.amount_due THEN 'Paid'
          WHEN COALESCE(SUM(fp.amount_paid), 0) > 0 THEN 'Partially_Paid'
          ELSE 'Pending'
        END as calculated_status
      FROM fee_records fr
      JOIN students s ON fr.student_id = s.student_id
      JOIN semesters sem ON fr.semester_id = sem.semester_id
      LEFT JOIN fee_payments fp ON fr.fee_record_id = fp.fee_record_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (student_id) {
      sql += ` AND fr.student_id = ?`;
      params.push(Number(student_id));
    }
    if (semester_id) {
      sql += ` AND fr.semester_id = ?`;
      params.push(Number(semester_id));
    }

    sql += `
      GROUP BY fr.fee_record_id, fr.student_id, s.first_name, s.last_name, s.reg_number,
               sem.semester_number, fr.fee_type, fr.amount_due, fr.due_date, fr.created_at
    `;

    if (status) {
      sql += ` HAVING calculated_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY fr.due_date ASC`;

    const records = await dbQuery<FeeRecord>(sql, params);
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createFeeRecord(req: Request, res: Response) {
  try {
    const { student_id, semester_id, fee_type, amount_due, due_date } = req.body;

    if (!student_id || !semester_id || !fee_type || !amount_due || !due_date) {
      return res.status(400).json({ success: false, error: 'Student, Semester, Fee Type, Amount Due, and Due Date are required' });
    }

    if (Number(amount_due) <= 0) {
      return res.status(400).json({ success: false, error: 'Amount due must be a positive number' });
    }

    const result = await dbExecute(`
      INSERT INTO fee_records (student_id, semester_id, fee_type, amount_due, due_date)
      VALUES (?, ?, ?, ?, ?)
    `, [
      Number(student_id),
      Number(semester_id),
      fee_type,
      Number(amount_due),
      due_date
    ]);

    res.status(201).json({ success: true, data: { fee_record_id: result.insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// -----------------------------------------------------------------------------
// FEE PAYMENTS
// -----------------------------------------------------------------------------
export async function getFeePayments(req: Request, res: Response) {
  try {
    const { fee_record_id } = req.query;

    let sql = `
      SELECT 
        fp.*,
        fr.fee_type,
        fr.amount_due,
        (s.first_name || ' ' || s.last_name) as student_name,
        s.reg_number
      FROM fee_payments fp
      JOIN fee_records fr ON fp.fee_record_id = fr.fee_record_id
      JOIN students s ON fr.student_id = s.student_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fee_record_id) {
      sql += ` AND fp.fee_record_id = ?`;
      params.push(Number(fee_record_id));
    }

    sql += ` ORDER BY fp.payment_date DESC, fp.payment_id DESC`;

    const payments = await dbQuery<FeePayment>(sql, params);
    res.json({ success: true, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function recordPayment(req: Request, res: Response) {
  try {
    const { fee_record_id, receipt_number, amount_paid, payment_date, payment_mode, transaction_ref, notes } = req.body;

    if (!fee_record_id || !receipt_number || !amount_paid || !payment_date || !payment_mode) {
      return res.status(400).json({ success: false, error: 'Fee Record, Receipt Number, Amount, Date, and Payment Mode are required' });
    }

    const amount = Number(amount_paid);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero' });
    }

    // Check fee record and pending balance
    const feeRec = await dbQuery(`
      SELECT 
        fr.amount_due,
        COALESCE(SUM(fp.amount_paid), 0) as already_paid
      FROM fee_records fr
      LEFT JOIN fee_payments fp ON fr.fee_record_id = fp.fee_record_id
      WHERE fr.fee_record_id = ?
      GROUP BY fr.fee_record_id, fr.amount_due
    `, [fee_record_id]);

    if (feeRec.length === 0) {
      return res.status(404).json({ success: false, error: 'Fee record not found' });
    }

    const amountDue = Number(feeRec[0].amount_due);
    const alreadyPaid = Number(feeRec[0].already_paid);
    const remaining = amountDue - alreadyPaid;

    if (amount > remaining) {
      return res.status(400).json({
        success: false,
        error: `Payment amount ₹${amount} exceeds the outstanding balance of ₹${remaining.toFixed(2)}.`
      });
    }

    // Check unique receipt number
    const existingRcpt = await dbQuery('SELECT payment_id FROM fee_payments WHERE receipt_number = ?', [receipt_number]);
    if (existingRcpt.length > 0) {
      return res.status(409).json({ success: false, error: `Receipt number '${receipt_number}' already exists.` });
    }

    const result = await dbExecute(`
      INSERT INTO fee_payments (fee_record_id, receipt_number, amount_paid, payment_date, payment_mode, transaction_ref, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      Number(fee_record_id),
      receipt_number,
      amount,
      payment_date,
      payment_mode,
      transaction_ref || null,
      notes || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment_id: result.insertId,
        new_balance: remaining - amount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

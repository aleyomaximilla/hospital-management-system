const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

async function getAllBills(req, res) {
  try {
    const sql = `
      SELECT 
        b.id, 
        b.patient_id, 
        b.appointment_id, 
        b.description, 
        b.amount, 
        b.status, 
        DATE_FORMAT(b.issued_at, '%d %b %Y') as issued_formatted, 
        p.full_name as patient_name
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      ORDER BY b.id DESC
    `;
    const bills = await query(sql);
    return res.json({ success: true, data: bills });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch bills.' });
  }
}

async function getBillById(req, res) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        b.id, 
        b.patient_id, 
        b.appointment_id, 
        b.description, 
        b.amount, 
        b.status, 
        b.issued_at, 
        p.full_name as patient_name
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      WHERE b.id = ?
    `;
    const bills = await query(sql, [id]);
    if (bills.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }
    return res.json({ success: true, data: bills[0] });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch bill.' });
  }
}

async function createBill(req, res) {
  try {
    const { patient_id, appointment_id, description, amount, status } = req.body;

    if (!patient_id || !description || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Patient, description, and amount are required.' });
    }

    const billStatus = status === 'Paid' ? 'Paid' : 'Unpaid';

    const result = await query(
      'INSERT INTO bills (patient_id, appointment_id, description, amount, status) VALUES (?, ?, ?, ?, ?)',
      [patient_id, appointment_id || null, description, amount, billStatus]
    );

    await logAudit(req.user?.id, `Created bill KES ${amount} for patient ID ${patient_id}`, 'bills', result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Bill created successfully.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    return res.status(500).json({ success: false, message: 'Could not create bill.' });
  }
}

async function updateBillStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Paid', 'Unpaid'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid bill status.' });
    }

    await query('UPDATE bills SET status = ? WHERE id = ?', [status, id]);
    await logAudit(req.user?.id, `Updated bill id ${id} status to ${status}`, 'bills', id);

    return res.json({ success: true, message: `Bill marked as ${status}.` });
  } catch (error) {
    console.error('Error updating bill:', error);
    return res.status(500).json({ success: false, message: 'Could not update bill status.' });
  }
}

async function deleteBill(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM bills WHERE id = ?', [id]);
    await logAudit(req.user?.id, `Deleted bill id ${id}`, 'bills', id);
    return res.json({ success: true, message: 'Bill removed successfully.' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return res.status(500).json({ success: false, message: 'Could not remove bill.' });
  }
}

module.exports = {
  getAllBills,
  getBillById,
  createBill,
  updateBillStatus,
  deleteBill
};

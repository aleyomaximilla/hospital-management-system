const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

async function getAllPatients(req, res) {
  try {
    const patients = await query(
      'SELECT id, full_name, date_of_birth, gender, phone, email, address, blood_group, medical_history, DATE_FORMAT(registered_at, "%d %b %Y") as registered_formatted FROM patients ORDER BY id DESC'
    );
    return res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch patients.' });
  }
}

async function getPatientById(req, res) {
  try {
    const { id } = req.params;
    const patients = await query('SELECT * FROM patients WHERE id = ?', [id]);
    if (patients.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }
    return res.json({ success: true, data: patients[0] });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch patient.' });
  }
}

async function createPatient(req, res) {
  try {
    const { full_name, date_of_birth, gender, phone, email, address, blood_group, medical_history } = req.body;

    if (!full_name) {
      return res.status(400).json({ success: false, message: 'Patient full name is required.' });
    }

    const result = await query(
      'INSERT INTO patients (full_name, date_of_birth, gender, phone, email, address, blood_group, medical_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [full_name, date_of_birth || null, gender || null, phone || null, email || null, address || null, blood_group || null, medical_history || null]
    );

    await logAudit(req.user?.id, `Created patient: ${full_name}`, 'patients', result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return res.status(500).json({ success: false, message: 'Could not create patient.' });
  }
}

async function updatePatient(req, res) {
  try {
    const { id } = req.params;
    const { full_name, date_of_birth, gender, phone, email, address, blood_group, medical_history } = req.body;

    if (!full_name) {
      return res.status(400).json({ success: false, message: 'Patient full name is required.' });
    }

    await query(
      'UPDATE patients SET full_name = ?, date_of_birth = ?, gender = ?, phone = ?, email = ?, address = ?, blood_group = ?, medical_history = ? WHERE id = ?',
      [full_name, date_of_birth || null, gender || null, phone || null, email || null, address || null, blood_group || null, medical_history || null, id]
    );

    await logAudit(req.user?.id, `Updated patient: ${full_name}`, 'patients', id);

    return res.json({ success: true, message: 'Patient record updated successfully.' });
  } catch (error) {
    console.error('Error updating patient:', error);
    return res.status(500).json({ success: false, message: 'Could not update patient.' });
  }
}

async function deletePatient(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM patients WHERE id = ?', [id]);
    await logAudit(req.user?.id, `Deleted patient id ${id}`, 'patients', id);
    return res.json({ success: true, message: 'Patient record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return res.status(500).json({ success: false, message: 'Could not delete patient.' });
  }
}

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};

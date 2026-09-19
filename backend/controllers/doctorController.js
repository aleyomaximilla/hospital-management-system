const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

async function getAllDoctors(req, res) {
  try {
    const doctors = await query('SELECT * FROM doctors ORDER BY id DESC');
    return res.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch doctors.' });
  }
}

async function getDoctorById(req, res) {
  try {
    const { id } = req.params;
    const doctors = await query('SELECT * FROM doctors WHERE id = ?', [id]);
    if (doctors.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    return res.json({ success: true, data: doctors[0] });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch doctor.' });
  }
}

async function createDoctor(req, res) {
  try {
    const { full_name, specialization, phone, email, available_days } = req.body;

    if (!full_name || !specialization) {
      return res.status(400).json({ success: false, message: 'Full name and specialization are required.' });
    }

    const result = await query(
      'INSERT INTO doctors (full_name, specialization, phone, email, available_days) VALUES (?, ?, ?, ?, ?)',
      [full_name, specialization, phone || null, email || null, available_days || null]
    );

    await logAudit(req.user?.id, `Created doctor: ${full_name}`, 'doctors', result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Doctor added successfully.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return res.status(500).json({ success: false, message: 'Could not add doctor.' });
  }
}

async function updateDoctor(req, res) {
  try {
    const { id } = req.params;
    const { full_name, specialization, phone, email, available_days } = req.body;

    if (!full_name || !specialization) {
      return res.status(400).json({ success: false, message: 'Full name and specialization are required.' });
    }

    await query(
      'UPDATE doctors SET full_name = ?, specialization = ?, phone = ?, email = ?, available_days = ? WHERE id = ?',
      [full_name, specialization, phone || null, email || null, available_days || null, id]
    );

    await logAudit(req.user?.id, `Updated doctor id ${id}`, 'doctors', id);

    return res.json({ success: true, message: 'Doctor updated successfully.' });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return res.status(500).json({ success: false, message: 'Could not update doctor.' });
  }
}

async function deleteDoctor(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM doctors WHERE id = ?', [id]);
    await logAudit(req.user?.id, `Removed doctor id ${id}`, 'doctors', id);
    return res.json({ success: true, message: 'Doctor removed successfully.' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return res.status(500).json({ success: false, message: 'Could not remove doctor.' });
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};

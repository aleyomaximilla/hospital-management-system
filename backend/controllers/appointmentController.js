const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

async function getAllAppointments(req, res) {
  try {
    const sql = `
      SELECT 
        a.id, 
        a.patient_id, 
        a.doctor_id, 
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, 
        TIME_FORMAT(a.appointment_time, '%H:%i') as appointment_time, 
        a.reason, 
        a.status, 
        p.full_name as patient_name, 
        d.full_name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    const appointments = await query(sql);
    return res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch appointments.' });
  }
}

async function getAppointmentById(req, res) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        a.id, 
        a.patient_id, 
        a.doctor_id, 
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, 
        TIME_FORMAT(a.appointment_time, '%H:%i') as appointment_time, 
        a.reason, 
        a.status, 
        p.full_name as patient_name, 
        d.full_name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
    `;
    const appointments = await query(sql, [id]);
    if (appointments.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    return res.json({ success: true, data: appointments[0] });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch appointment.' });
  }
}

async function createAppointment(req, res) {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ success: false, message: 'Patient, doctor, date, and time are required.' });
    }

    const result = await query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status) VALUES (?, ?, ?, ?, ?, "Scheduled")',
      [patient_id, doctor_id, appointment_date, appointment_time, reason || '']
    );

    await logAudit(req.user?.id, `Booked appointment for patient ID ${patient_id} with doctor ID ${doctor_id}`, 'appointments', result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ success: false, message: 'Could not book appointment.' });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment status.' });
    }

    await query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    await logAudit(req.user?.id, `Updated appointment status to ${status}`, 'appointments', id);

    return res.json({ success: true, message: `Appointment status updated to ${status}.` });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ success: false, message: 'Could not update appointment.' });
  }
}

async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM appointments WHERE id = ?', [id]);
    await logAudit(req.user?.id, `Deleted appointment id ${id}`, 'appointments', id);
    return res.json({ success: true, message: 'Appointment removed successfully.' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return res.status(500).json({ success: false, message: 'Could not remove appointment.' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const [patientCount] = await query('SELECT COUNT(*) as count FROM patients');
    const [doctorCount] = await query('SELECT COUNT(*) as count FROM doctors');
    const [appointmentCount] = await query('SELECT COUNT(*) as count FROM appointments WHERE status = "Scheduled"');
    const [unpaidBillsCount] = await query('SELECT COUNT(*) as count FROM bills WHERE status = "Unpaid"');

    const upcomingAppointments = await query(`
      SELECT 
        a.id, 
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, 
        TIME_FORMAT(a.appointment_time, '%H:%i') as appointment_time, 
        p.full_name as patient_name, 
        d.full_name as doctor_name, 
        a.status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.status = 'Scheduled'
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT 5
    `);

    return res.json({
      success: true,
      stats: {
        patients: patientCount.count,
        doctors: doctorCount.count,
        scheduledAppointments: appointmentCount.count,
        unpaidBills: unpaidBillsCount.count
      },
      upcomingAppointments
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch dashboard statistics.' });
  }
}

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getDashboardStats
};

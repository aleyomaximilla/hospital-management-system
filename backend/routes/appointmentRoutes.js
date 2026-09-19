const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Dashboard stats: all roles
router.get('/dashboard-stats', appointmentController.getDashboardStats);

// View appointments: admin, doctor, receptionist
router.get('/', requireRole(['admin', 'doctor', 'receptionist']), appointmentController.getAllAppointments);
router.get('/:id', requireRole(['admin', 'doctor', 'receptionist']), appointmentController.getAppointmentById);

// Book appointment: admin, receptionist
router.post('/', requireRole(['admin', 'receptionist']), appointmentController.createAppointment);

// Update status (e.g. Completed, Cancelled): admin, doctor, receptionist
router.patch('/:id/status', requireRole(['admin', 'doctor', 'receptionist']), appointmentController.updateAppointmentStatus);

// Delete appointment: admin only
router.delete('/:id', requireRole(['admin']), appointmentController.deleteAppointment);

module.exports = router;

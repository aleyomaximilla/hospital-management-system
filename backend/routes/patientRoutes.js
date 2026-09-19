const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// All patient endpoints require authentication
router.use(authenticateToken);

// View patients: admin, doctor, receptionist
router.get('/', requireRole(['admin', 'doctor', 'receptionist']), patientController.getAllPatients);
router.get('/:id', requireRole(['admin', 'doctor', 'receptionist']), patientController.getPatientById);

// Create / edit patients: admin, receptionist
router.post('/', requireRole(['admin', 'receptionist']), patientController.createPatient);
router.put('/:id', requireRole(['admin', 'receptionist']), patientController.updatePatient);

// Delete patient: admin only
router.delete('/:id', requireRole(['admin']), patientController.deletePatient);

module.exports = router;

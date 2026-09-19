const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// View doctors: admin, doctor, receptionist
router.get('/', requireRole(['admin', 'doctor', 'receptionist']), doctorController.getAllDoctors);
router.get('/:id', requireRole(['admin', 'doctor', 'receptionist']), doctorController.getDoctorById);

// Add / edit / delete doctors: admin only
router.post('/', requireRole(['admin']), doctorController.createDoctor);
router.put('/:id', requireRole(['admin']), doctorController.updateDoctor);
router.delete('/:id', requireRole(['admin']), doctorController.deleteDoctor);

module.exports = router;

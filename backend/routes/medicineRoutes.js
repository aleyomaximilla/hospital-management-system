const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// View medicines and inventory stats: admin, doctor, receptionist
router.get('/stats', requireRole(['admin', 'doctor', 'receptionist']), medicineController.getMedicineStats);
router.get('/', requireRole(['admin', 'doctor', 'receptionist']), medicineController.getAllMedicines);
router.get('/:id', requireRole(['admin', 'doctor', 'receptionist']), medicineController.getMedicineById);

// Add / edit medicines: admin, doctor, receptionist
router.post('/', requireRole(['admin', 'doctor', 'receptionist']), medicineController.createMedicine);
router.put('/:id', requireRole(['admin', 'doctor', 'receptionist']), medicineController.updateMedicine);

// Delete medicine: admin only
router.delete('/:id', requireRole(['admin']), medicineController.deleteMedicine);

module.exports = router;

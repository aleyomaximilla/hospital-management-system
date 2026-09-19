const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// View bills: admin, doctor, receptionist
router.get('/', requireRole(['admin', 'doctor', 'receptionist']), billingController.getAllBills);
router.get('/:id', requireRole(['admin', 'doctor', 'receptionist']), billingController.getBillById);

// Create bill: admin, receptionist
router.post('/', requireRole(['admin', 'receptionist']), billingController.createBill);

// Update status (Paid / Unpaid): admin, receptionist
router.patch('/:id/status', requireRole(['admin', 'receptionist']), billingController.updateBillStatus);

// Delete bill: admin only
router.delete('/:id', requireRole(['admin']), billingController.deleteBill);

module.exports = router;

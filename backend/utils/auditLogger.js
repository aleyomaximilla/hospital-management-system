const { query } = require('../config/db');

async function logAudit(userId, action, targetTable = null, targetId = null) {
  try {
    await query(
      'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
      [userId || null, action, targetTable, targetId]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };

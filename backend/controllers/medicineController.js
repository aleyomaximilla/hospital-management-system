const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

async function getAllMedicines(req, res) {
  try {
    const { search, category } = req.query;
    let sql = `
      SELECT 
        id, 
        name, 
        category, 
        dosage, 
        stock_quantity, 
        price, 
        DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiry_date,
        CASE
          WHEN stock_quantity <= 0 THEN 'Out of Stock'
          WHEN stock_quantity <= 15 THEN 'Low Stock'
          ELSE 'In Stock'
        END as status,
        DATE_FORMAT(created_at, '%d %b %Y') as created_formatted
      FROM medicines
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      sql += ` AND (name LIKE ? OR category LIKE ? OR dosage LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category.trim() !== '') {
      sql += ` AND category = ?`;
      params.push(category.trim());
    }

    sql += ` ORDER BY name ASC`;

    const medicines = await query(sql, params);
    return res.json({ success: true, data: medicines });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch medicines.' });
  }
}

async function getMedicineStats(req, res) {
  try {
    const [totalRes] = await query('SELECT COUNT(*) as count FROM medicines');
    const [lowRes] = await query('SELECT COUNT(*) as count FROM medicines WHERE stock_quantity > 0 AND stock_quantity <= 15');
    const [outRes] = await query('SELECT COUNT(*) as count FROM medicines WHERE stock_quantity <= 0');

    return res.json({
      success: true,
      stats: {
        total: totalRes.count || 0,
        lowStock: lowRes.count || 0,
        outOfStock: outRes.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching medicine stats:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch medicine statistics.' });
  }
}

async function getMedicineById(req, res) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        id, 
        name, 
        category, 
        dosage, 
        stock_quantity, 
        price, 
        DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiry_date
      FROM medicines
      WHERE id = ?
    `;
    const rows = await query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching medicine:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch medicine details.' });
  }
}

async function createMedicine(req, res) {
  try {
    const { name, category, dosage, stock_quantity, price, expiry_date } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Medicine name and category are required.' });
    }

    const stock = parseInt(stock_quantity, 10) || 0;
    const unitPrice = parseFloat(price) || 0.00;

    const result = await query(
      'INSERT INTO medicines (name, category, dosage, stock_quantity, price, expiry_date) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, dosage || '', stock, unitPrice, expiry_date || null]
    );

    await logAudit(req.user?.id, `Added medicine: ${name} (${category})`, 'medicines', result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Medicine added successfully.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return res.status(500).json({ success: false, message: 'Could not add medicine.' });
  }
}

async function updateMedicine(req, res) {
  try {
    const { id } = req.params;
    const { name, category, dosage, stock_quantity, price, expiry_date } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Medicine name and category are required.' });
    }

    const stock = parseInt(stock_quantity, 10) || 0;
    const unitPrice = parseFloat(price) || 0.00;

    await query(
      'UPDATE medicines SET name = ?, category = ?, dosage = ?, stock_quantity = ?, price = ?, expiry_date = ? WHERE id = ?',
      [name, category, dosage || '', stock, unitPrice, expiry_date || null, id]
    );

    await logAudit(req.user?.id, `Updated medicine: ${name} (ID: ${id})`, 'medicines', id);

    return res.json({ success: true, message: 'Medicine updated successfully.' });
  } catch (error) {
    console.error('Error updating medicine:', error);
    return res.status(500).json({ success: false, message: 'Could not update medicine.' });
  }
}

async function deleteMedicine(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM medicines WHERE id = ?', [id]);
    await logAudit(req.user?.id, `Deleted medicine ID ${id}`, 'medicines', id);
    return res.json({ success: true, message: 'Medicine removed successfully.' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return res.status(500).json({ success: false, message: 'Could not delete medicine.' });
  }
}

module.exports = {
  getAllMedicines,
  getMedicineStats,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
};

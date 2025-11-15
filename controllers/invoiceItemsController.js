const db = require('../config/db');

// GET /api/invoice_items || Filter for order id ?order_id=123
const getAll = async (req, res, next) => {
    try {
        const { order_id } = req.query;
        if (order_id !== undefined && !/^\d+$/.test(String(order_id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid order_id' } });
        }

        if (order_id) {
            const [rows] = await db.query('SELECT * FROM invoice_item WHERE order_id = ? ORDER BY id DESC', [order_id]);
            return res.json({ success: true, data: rows });
        }

        const [rows] = await db.query('SELECT * FROM invoice_item ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

// GET /api/invoice_items/:id
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [rows] = await db.query('SELECT * FROM invoice_item WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Invoice item not found' } });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// POST /api/invoice_items
const create = async (req, res, next) => {
    try {
        const { product_id, order_id, quantity, regular_price, special_price, product_name } = req.body;

        if (!product_id || !order_id || !product_name) {
            return res.status(400).json({ success: false, error: { message: 'Fields "product_id", "order_id" and "product_name" are required' } });
        }

        if (!/^\d+$/.test(String(product_id)) || !/^\d+$/.test(String(order_id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid product_id or order_id' } });
        }

        const [pRows] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
        if (!pRows || pRows.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'product_id does not exist' } });
        }

        const [oRows] = await db.query('SELECT id FROM invoices WHERE id = ?', [order_id]);
        if (!oRows || oRows.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'order_id does not exist' } });
        }

        const qty = quantity === undefined ? 1 : quantity;
        const reg = regular_price === undefined ? 0.0 : regular_price;
        const spec = special_price === undefined ? null : special_price;

        const [result] = await db.query(
            'INSERT INTO invoice_item (product_id, order_id, quantity, regular_price, special_price, product_name) VALUES (?, ?, ?, ?, ?, ?)',
            [product_id, order_id, qty, reg, spec, product_name]
        );

        const insertedId = result.insertId;
        const [rows] = await db.query('SELECT * FROM invoice_item WHERE id = ?', [insertedId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// PUT /api/invoice_items/:id
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existingRows] = await db.query('SELECT * FROM invoice_item WHERE id = ?', [id]);
        if (!existingRows || existingRows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Invoice item not found' } });
        }

        const existing = existingRows[0];
        const { product_id, order_id, quantity, regular_price, special_price, product_name } = req.body;

        const updatedProduct = product_id === undefined ? existing.product_id : product_id;
        const updatedOrder = order_id === undefined ? existing.order_id : order_id;
        const updatedQuantity = quantity === undefined ? existing.quantity : quantity;
        const updatedRegular = regular_price === undefined ? existing.regular_price : regular_price;
        const updatedSpecial = special_price === undefined ? existing.special_price : special_price;
        const updatedName = product_name === undefined ? existing.product_name : product_name;

        if (updatedProduct !== existing.product_id) {
            const [pRows] = await db.query('SELECT id FROM products WHERE id = ?', [updatedProduct]);
            if (!pRows || pRows.length === 0) {
                return res.status(400).json({ success: false, error: { message: 'product_id does not exist' } });
            }
        }

        if (updatedOrder !== existing.order_id) {
            const [oRows] = await db.query('SELECT id FROM invoices WHERE id = ?', [updatedOrder]);
            if (!oRows || oRows.length === 0) {
                return res.status(400).json({ success: false, error: { message: 'order_id does not exist' } });
            }
        }

        await db.query(
            'UPDATE invoice_item SET product_id = ?, order_id = ?, quantity = ?, regular_price = ?, special_price = ?, product_name = ? WHERE id = ?',
            [updatedProduct, updatedOrder, updatedQuantity, updatedRegular, updatedSpecial, updatedName, id]
        );

        const [rows] = await db.query('SELECT * FROM invoice_item WHERE id = ?', [id]);
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/invoice_items/:id
const deleteOne = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existing] = await db.query('SELECT * FROM invoice_item WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Invoice item not found' } });
        }

        await db.query('DELETE FROM invoice_item WHERE id = ?', [id]);
        res.json({ success: true, message: `Invoice item ${id} deleted` });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteOne,
};
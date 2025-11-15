const db = require('../config/db');

// GET /api/invoices
const getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM invoices ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

// GET /api/invoices/:id
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [rows] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Invoice not found' } });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// POST /api/invoices
const create = async (req, res, next) => {
    try {
        const {
            total_price,
            payment_method,
            date,
            transaction_id,
            status,
            username,
            user_email,
            billing_address,
            shipping_address,
            coupon_id,
            tracking_code,
        } = req.body;

        const allowedStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: { message: `Invalid status, allowed: ${allowedStatuses.join(',')}` } });
        }

        if (coupon_id) {
            const [cRows] = await db.query('SELECT id FROM coupons WHERE id = ?', [coupon_id]);
            if (!cRows || cRows.length === 0) {
                return res.status(400).json({ success: false, error: { message: 'coupon_id does not exist' } });
            }
        }

        const [result] = await db.query(
            `INSERT INTO invoices
        (total_price, payment_method, date, transaction_id, status, username, user_email, billing_address, shipping_address, coupon_id, tracking_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                total_price === undefined ? 0.0 : total_price,
                payment_method || null,
                date || null,
                transaction_id || null,
                status || 'pending',
                username || null,
                user_email || null,
                billing_address ? JSON.stringify(billing_address) : null,
                shipping_address ? JSON.stringify(shipping_address) : null,
                coupon_id || null,
                tracking_code || null,
            ]
        );

        const insertedId = result.insertId;
        const [rows] = await db.query('SELECT * FROM invoices WHERE id = ?', [insertedId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('invoices.create error:', err);
        next(err);
    }
};

// PUT /api/invoices/:id
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existingRows] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
        if (!existingRows || existingRows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Invoice not found' } });
        }

        const existing = existingRows[0];

        const {
            total_price,
            payment_method,
            date,
            transaction_id,
            status,
            username,
            user_email,
            billing_address,
            shipping_address,
            coupon_id,
            tracking_code,
        } = req.body;

        const updatedTotal = total_price === undefined ? existing.total_price : total_price;
        const updatedPaymentMethod = payment_method === undefined ? existing.payment_method : payment_method;
        const updatedDate = date === undefined ? existing.date : date;
        const updatedTransactionId = transaction_id === undefined ? existing.transaction_id : transaction_id;
        const updatedStatus = status === undefined ? existing.status : status;
        const updatedUsername = username === undefined ? existing.username : username;
        const updatedUserEmail = user_email === undefined ? existing.user_email : user_email;
        const updatedBilling = billing_address === undefined ? existing.billing_address : (billing_address ? JSON.stringify(billing_address) : null);
        const updatedShipping = shipping_address === undefined ? existing.shipping_address : (shipping_address ? JSON.stringify(shipping_address) : null);
        const updatedCoupon = coupon_id === undefined ? existing.coupon_id : coupon_id;
        const updatedTracking = tracking_code === undefined ? existing.tracking_code : tracking_code;

        const allowedStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
        if (status !== undefined && !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: { message: `Invalid status, allowed: ${allowedStatuses.join(',')}` } });
        }

        if (coupon_id !== undefined && coupon_id !== null) {
            const [cRows] = await db.query('SELECT id FROM coupons WHERE id = ?', [coupon_id]);
            if (!cRows || cRows.length === 0) {
                return res.status(400).json({ success: false, error: { message: 'coupon_id does not exist' } });
            }
        }

        await db.query(
            `UPDATE invoices SET
        total_price = ?, payment_method = ?, date = ?, transaction_id = ?, status = ?, username = ?, user_email = ?, billing_address = ?, shipping_address = ?, coupon_id = ?, tracking_code = ?
       WHERE id = ?`,
            [
                updatedTotal,
                updatedPaymentMethod,
                updatedDate,
                updatedTransactionId,
                updatedStatus,
                updatedUsername,
                updatedUserEmail,
                updatedBilling,
                updatedShipping,
                updatedCoupon,
                updatedTracking,
                id,
            ]
        );

        const [rows] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('invoices.update error:', err);
        next(err);
    }
};

// DELETE /api/invoices/:id
const deleteOne = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existing] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Invoice not found' } });
        }

        await db.query('DELETE FROM invoices WHERE id = ?', [id]);
        res.json({ success: true, message: `Invoice ${id} deleted` });
    } catch (err) {
        console.error('invoices.deleteOne error:', err);
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

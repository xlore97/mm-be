const db = require('../config/db');

// GET /api/coupons
const getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM coupons ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

// GET /api/coupons/validate?code=XYZ
const validateByCode = async (req, res, next) => {
    try {
        const code = req.query.code || req.body.code;
        if (!code) {
            return res.status(400).json({ success: false, error: { message: 'Field "code" is required' } });
        }

        const [rows] = await db.query('SELECT * FROM coupons WHERE code = ? LIMIT 1', [code]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });
        }

        const coupon = rows[0];
        const now = new Date();

        // (no debug logging) keep validation logic below

        // helper: parse SQL datetime (e.g. "YYYY-MM-DD HH:mm:ss") into a proper Date
        const parseSQLDate = (val) => {
            if (!val) return null;
            const s = String(val);
            // convert space to T so Date parses as local/ISO-like
            const t = s.replace(' ', 'T');
            let d = new Date(t);
            if (isNaN(d)) {
                // fallback: try treating as UTC
                d = new Date(t + 'Z');
            }
            if (isNaN(d)) return null;
            return d;
        };

        // normalize is_valid: accept 1, '1', true, 'true'
        const isValidFlag = (() => {
            const v = coupon.is_valid;
            if (v === 1 || v === '1' || v === true) return true;
            if (typeof v === 'string' && v.toLowerCase() === 'true') return true;
            return false;
        })();

        if (!isValidFlag) {
            return res.json({ success: true, data: { valid: false, discount: 0, id: coupon.id, message: 'Coupon is not active' } });
        }

        if (coupon.starting_date) {
            const start = parseSQLDate(coupon.starting_date);
            if (start && now < start) {
                return res.json({ success: true, data: { valid: false, discount: 0, id: coupon.id, message: 'Coupon not yet valid' } });
            }
        }

        if (coupon.expiration_date) {
            const exp = parseSQLDate(coupon.expiration_date);
            if (exp) {
                // If expiration time is exactly midnight, treat the expiration date as inclusive end-of-day
                if (exp.getHours() === 0 && exp.getMinutes() === 0 && exp.getSeconds() === 0) {
                    exp.setHours(23, 59, 59, 999);
                }
                if (now > exp) {
                    return res.json({ success: true, data: { valid: false, discount: 0, id: coupon.id, message: 'Coupon expired' } });
                }
            }
        }

        // Valid coupon
        return res.json({ success: true, data: { valid: true, discount: Number(coupon.discount) || 0, id: coupon.id, message: 'Coupon valid' } });
    } catch (err) {
        next(err);
    }
};

// GET /api/coupons/:id
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [rows] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// POST /api/coupons
const create = async (req, res, next) => {
    try {
        const { code, starting_date, expiration_date, discount, is_valid } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: { message: 'Field "code" is required' } });
        }

        const [result] = await db.query(
            'INSERT INTO coupons (code, starting_date, expiration_date, discount, is_valid) VALUES (?, ?, ?, ?, ?)',
            [code, starting_date || null, expiration_date || null, discount === undefined ? 0.00 : discount, is_valid === undefined ? 1 : is_valid]
        );

        const insertedId = result.insertId;
        const [rows] = await db.query('SELECT * FROM coupons WHERE id = ?', [insertedId]);

        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// PUT /api/coupons/:id
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, starting_date, expiration_date, discount, is_valid } = req.body;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existing] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });
        }

        const updatedCode = code || existing[0].code;
        const updatedStarting = starting_date === undefined ? existing[0].starting_date : starting_date;
        const updatedExpiration = expiration_date === undefined ? existing[0].expiration_date : expiration_date;
        const updatedDiscount = discount === undefined ? existing[0].discount : discount;
        const updatedIsValid = is_valid === undefined ? existing[0].is_valid : is_valid;

        await db.query(
            'UPDATE coupons SET code = ?, starting_date = ?, expiration_date = ?, discount = ?, is_valid = ? WHERE id = ?',
            [updatedCode, updatedStarting, updatedExpiration, updatedDiscount, updatedIsValid, id]
        );

        const [rows] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/coupons/:id
const deleteOne = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existing] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });
        }

        await db.query('DELETE FROM coupons WHERE id = ?', [id]);
        res.json({ success: true, message: `Coupon ${id} deleted` });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAll,
    getById,
    validateByCode,
    create,
    update,
    deleteOne,
};

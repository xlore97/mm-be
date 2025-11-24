const db = require('../config/db');

// --- helper: parse SQL datetime ---
const parseSQLDate = (val) => {
    if (!val) return null;
    const t = String(val).replace(' ', 'T');
    let d = new Date(t);
    if (isNaN(d)) d = new Date(t + 'Z');
    return isNaN(d) ? null : d;
};

const markCouponUsed = async (couponId) => {
    const [result] = await db.query(
        'UPDATE coupons SET is_valid = 0 WHERE id = ?',
        [couponId]
    );
    return result.affectedRows > 0;
};


// --- helper: logica di validazione coupon ---
const isCouponValid = (coupon) => {
    const now = new Date();

    // Controlla se il coupon è attivo
    const isValidFlag = [1, '1', true, 'true'].includes(coupon.is_valid);
    if (!isValidFlag) return { valid: false, message: 'Coupon is not active' };

    // Controlla la data di inizio
    if (coupon.starting_date) {
        const start = coupon.starting_date instanceof Date ? coupon.starting_date : new Date(coupon.starting_date);
        if (start && now < start) return { valid: false, message: 'Coupon not yet valid' };
    }

    // Controlla la data di scadenza
    if (coupon.expiration_date) {
        const exp = coupon.expiration_date instanceof Date ? coupon.expiration_date : new Date(coupon.expiration_date);
        if (exp) {
            // Se l'orario è a mezzanotte, estendi a fine giornata
            if (exp.getHours() === 0 && exp.getMinutes() === 0 && exp.getSeconds() === 0) {
                exp.setHours(23, 59, 59, 999);
            }
            if (now > exp) return { valid: false, message: 'Coupon expired' };
        }
    }

    return { valid: true, discount: Number(coupon.discount) || 0, message: 'Coupon valid' };
};

// --- GET /api/coupons ---
const getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM coupons ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

// --- GET /api/coupons/:id ---
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) return res.status(400).json({ success: false, error: { message: 'Invalid id' } });

        const [rows] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// --- GET /api/coupons/validate?code=XYZ ---
const validateByCode = async (req, res, next) => {
    try {
        const code = (req.query.code || req.body.code || '').trim().toUpperCase();
        if (!code) return res.status(400).json({ success: false, error: { message: 'Field "code" is required' } });

        const [rows] = await db.query('SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1', [code]);
        if (!rows.length) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });

        const coupon = rows[0];
        const validation = isCouponValid(coupon);

        if (validation.valid) {
            // Segna il coupon come usato
            await markCouponUsed(coupon.id);
        }

        res.json({
            success: true,
            data: {
                valid: validation.valid,
                discount: validation.discount || 0,
                id: coupon.id,
                message: validation.message
            }
        });
    } catch (err) {
        next(err);
    }
};

// --- POST /api/coupons ---
const create = async (req, res, next) => {
    try {
        const { code, starting_date, expiration_date, discount, is_valid } = req.body;
        if (!code) return res.status(400).json({ success: false, error: { message: 'Field "code" is required' } });

        const [result] = await db.query(
            'INSERT INTO coupons (code, starting_date, expiration_date, discount, is_valid, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [code.trim().toUpperCase(), starting_date || null, expiration_date || null, discount === undefined ? 0.00 : discount, is_valid === undefined ? 1 : is_valid]
        );

        const insertedId = result.insertId;
        const [rows] = await db.query('SELECT * FROM coupons WHERE id = ?', [insertedId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// --- PUT /api/coupons/:id ---
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, starting_date, expiration_date, discount, is_valid } = req.body;

        const [existing] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });

        const updatedCode = code === undefined ? existing[0].code : code.trim().toUpperCase();
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

// --- DELETE /api/coupons/:id ---
const deleteOne = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) return res.status(400).json({ success: false, error: { message: 'Invalid id' } });

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

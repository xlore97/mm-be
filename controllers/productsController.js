const db = require('../config/db');

// Helper per aggiungere il path completo dell'immagine usando il middleware imagePath
function addImagePathToRow(row, req) {
    if (!row) return row;
    return {
        ...row,
        image: row.image ? `${req.imagePath}${row.image}` : null,
    };
}

// GET /api/products
const getAll = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Support per slug query: /api/products?slug=the-slug
        if (req.query.slug) {
            const slug = req.query.slug;
            const [rows] = await db.query(
                `SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? LIMIT 1`,
                [slug]
            );
            const transformed = rows.map((r) => {
                const base = addImagePathToRow(r, req);
                return { ...base, price: r.special_price ?? r.regular_price };
            });
            return res.json({ success: true, data: transformed });
        }

        // Default: include category name and compute price field
        const [rows] = await db.query(
            `SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const transformed = rows.map((r) => {
            const base = addImagePathToRow(r, req);
            return { ...base, price: r.special_price ?? r.regular_price };
        });

        res.json({ success: true, data: transformed });
    } catch (err) {
        next(err);
    }
};

// GET /api/products/:id
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Se id è numerico cerchiamo per id, altrimenti trattiamolo come slug
        let rows;
        if (/^\d+$/.test(String(id))) {
            [rows] = await db.query(`SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [id]);
        } else {
            [rows] = await db.query(`SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? LIMIT 1`, [id]);
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' } });
        }

        const r = rows[0];
        const transformed = addImagePathToRow(r, req);
        transformed.price = r.special_price ?? r.regular_price;

        res.json({ success: true, data: transformed });
    } catch (err) {
        next(err);
    }
};

// POST /api/products
const create = async (req, res, next) => {
    try {
        const {
            category_id,
            name,
            description,
            regular_price,
            special_price,
            image,
            promo,
            slug,
            quantity,
            status,
        } = req.body;

        if (!category_id || !name || !slug) {
            return res.status(400).json({ success: false, error: { message: 'Fields "category_id", "name" and "slug" are required' } });
        }

        if (!/^\d+$/.test(String(category_id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid category_id' } });
        }

        const [cRows] = await db.query('SELECT id FROM categories WHERE id = ?', [category_id]);
        if (!cRows || cRows.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'category_id does not exist' } });
        }

        const [result] = await db.query(
            `INSERT INTO products
      (category_id, name, description, regular_price, special_price, image, promo, slug, quantity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category_id,
                name,
                description || null,
                regular_price === undefined ? 0.0 : regular_price,
                special_price === undefined ? null : special_price,
                image || null,
                promo === undefined ? 0.0 : promo,
                slug,
                quantity === undefined ? 0 : quantity,
                status || 'active',
            ]
        );

        const insertedId = result.insertId;
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [insertedId]);
        const transformed = addImagePathToRow(rows[0], req);
        res.status(201).json({ success: true, data: transformed });
    } catch (err) {
        next(err);
    }
};

// PUT /api/products/:id
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existingRows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        if (!existingRows || existingRows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' } });
        }

        const existing = existingRows[0];
        const {
            category_id,
            name,
            description,
            regular_price,
            special_price,
            image,
            promo,
            slug,
            quantity,
            status,
        } = req.body;

        const updatedCategory = category_id === undefined ? existing.category_id : category_id;
        const updatedName = name === undefined ? existing.name : name;
        const updatedDescription = description === undefined ? existing.description : description;
        const updatedRegular = regular_price === undefined ? existing.regular_price : regular_price;
        const updatedSpecial = special_price === undefined ? existing.special_price : special_price;
        const updatedImage = image === undefined ? existing.image : image;
        const updatedPromo = promo === undefined ? existing.promo : promo;
        const updatedSlug = slug === undefined ? existing.slug : slug;
        const updatedQuantity = quantity === undefined ? existing.quantity : quantity;
        const updatedStatus = status === undefined ? existing.status : status;

        if (updatedCategory !== existing.category_id) {
            const [cRows] = await db.query('SELECT id FROM categories WHERE id = ?', [updatedCategory]);
            if (!cRows || cRows.length === 0) {
                return res.status(400).json({ success: false, error: { message: 'category_id does not exist' } });
            }
        }

        await db.query(
            `UPDATE products SET category_id = ?, name = ?, description = ?, regular_price = ?, special_price = ?, image = ?, promo = ?, slug = ?, quantity = ?, status = ? WHERE id = ?`,
            [
                updatedCategory,
                updatedName,
                updatedDescription,
                updatedRegular,
                updatedSpecial,
                updatedImage,
                updatedPromo,
                updatedSlug,
                updatedQuantity,
                updatedStatus,
                id,
            ]
        );

        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        const transformed = addImagePathToRow(rows[0], req);
        res.json({ success: true, data: transformed });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/products/:id
const deleteOne = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' } });
        }

        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ success: true, message: `Product ${id} deleted` });
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

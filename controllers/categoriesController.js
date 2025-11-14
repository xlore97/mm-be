const db = require('../config/db');

// GET /api/categories - restituisce tutte le categorie
const getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

// GET /api/categories/:id - restituisce una categoria per id
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Category not found' } });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// POST /api/categories - crea una nuova categoria
const create = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: { message: 'Field "name" is required' } });
        }

        const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);

        const insertedId = result.insertId;
        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [insertedId]);

        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// PUT /api/categories/:id - aggiorna una categoria
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Category not found' } });
        }

        await db.query('UPDATE categories SET name = ? WHERE id = ?', [name || existing[0].name, id]);

        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/categories/:id - elimina una categoria
const deleteOne = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ success: false, error: { message: 'Invalid id' } });
        }

        const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Category not found' } });
        }

        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true, message: `Category ${id} deleted` });
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

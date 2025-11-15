const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// GET /api/products
router.get('/', productsController.getAll);

// GET /api/products/:id
router.get('/:id', productsController.getById);

// POST /api/products
router.post('/', productsController.create);

// PUT /api/products/:id
router.put('/:id', productsController.update);

// DELETE /api/products/:id
router.delete('/:id', productsController.deleteOne);

module.exports = router;

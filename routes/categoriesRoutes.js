const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const { validateCategory } = require("../middlewares/validation");

// GET /api/categories
router.get('/', categoriesController.getAll);

// GET /api/categories/:id
router.get('/:id', categoriesController.getById);

// POST /api/categories
router.post('/', validateCategory, categoriesController.create);

// PUT /api/categories/:id
router.put('/:id', validateCategory, categoriesController.update);

// DELETE /api/categories/:id
router.delete('/:id', categoriesController.deleteOne);

module.exports = router;

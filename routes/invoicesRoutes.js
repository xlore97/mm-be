const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const { validateInvoice } = require("../middlewares/validation");

// GET /api/invoices
router.get('/', invoicesController.getAll);

// GET /api/invoices/:id
router.get('/:id', invoicesController.getById);

// POST /api/invoices
router.post('/', validateInvoice, invoicesController.create);

// PUT /api/invoices/:id
router.put('/:id', invoicesController.update);

// DELETE /api/invoices/:id
router.delete('/:id', invoicesController.deleteOne);

module.exports = router;

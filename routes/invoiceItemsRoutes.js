const express = require('express');
const router = express.Router();
const invoiceItemsController = require('../controllers/invoiceItemsController');
const { validateInvoiceItem } = require("../middlewares/validation");

// GET /api/invoice_items
router.get('/', invoiceItemsController.getAll);

// GET /api/invoice_items/:id
router.get('/:id', invoiceItemsController.getById);

// POST /api/invoice_items
router.post('/', validateInvoiceItem, invoiceItemsController.create);

// PUT /api/invoice_items/:id
router.put('/:id', invoiceItemsController.update);

// DELETE /api/invoice_items/:id
router.delete('/:id', invoiceItemsController.deleteOne);

module.exports = router;

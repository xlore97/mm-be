// createOrderRoutes.js
const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/createOrderController');
const { validateOrder } = require('../middlewares/validation');

// POST /api/orders
router.post('/', validateOrder, createOrder);

module.exports = router;

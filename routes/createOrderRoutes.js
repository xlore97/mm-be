// createOrderRoutes.js
const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/createOrderController');

// POST /api/orders
router.post('/', createOrder);

module.exports = router;

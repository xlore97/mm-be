const express = require('express');
const router = express.Router();
const couponsController = require('../controllers/couponsController');
const { validateCoupon } = require("../middlewares/validation");

// GET /api/coupons
router.get('/', couponsController.getAll);

// GET /api/coupons/:id
router.get('/:id', couponsController.getById);

// POST /api/coupons
router.post('/', validateCoupon, couponsController.create);

// PUT /api/coupons/:id
router.put('/:id', validateCoupon, couponsController.update);

// DELETE /api/coupons/:id
router.delete('/:id', couponsController.deleteOne);

module.exports = router;

const Joi = require("joi");

/* ============================
   1. CATEGORIES
============================ */
const validateCategory = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().max(255).required()
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    next();
};


/* ============================
   2. PRODUCTS
============================ */
const validateProduct = (req, res, next) => {
    const schema = Joi.object({
        category_id: Joi.number().integer().positive().required(),
        name: Joi.string().max(255).required(),
        description: Joi.string().allow(null, "").optional(),
        regular_price: Joi.number().precision(2).min(0).required(),
        special_price: Joi.number().precision(2).min(0).allow(null).optional(),
        image: Joi.string().max(255).allow(null, "").optional(),
        promo: Joi.number().precision(2).min(0).max(999999.99).required(),
        slug: Joi.string().max(255).regex(/^[a-z0-9-]+$/).required(),
        quantity: Joi.number().integer().min(0).required(),
        status: Joi.string().valid("available", "not available").required()
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }

    next();
};


/* ============================
   3. COUPONS
============================ */
const validateCoupon = (req, res, next) => {
  const schema = Joi.object({
    code: Joi.string().max(50).required(),
    starting_date: Joi.date().iso().required(),
    expiration_date: Joi.date().iso().required(),
    discount: Joi.number().precision(2).min(0).required(),
    is_valid: Joi.number().integer().valid(0, 1).required(),
    created_at: Joi.date().iso().optional()
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  next();
};


/* ============================
   4. INVOICES
============================ */
const validateInvoice = (req, res, next) => {
  const schema = Joi.object({
    total_price: Joi.number().precision(2).required(),
    payment_method: Joi.string().max(100).allow(null, ''),
    date: Joi.date().required(),
    transaction_id: Joi.string().max(255).allow(null, ''),
    status: Joi.string()
      .valid('pending', 'paid', 'cancelled', 'refunded')
      .required(),
    username: Joi.string().max(255).allow(null, ''),
    user_email: Joi.string().email().max(255).allow(null, ''),
    billing_address: Joi.object().required(),
    shipping_address: Joi.object().required(),
    coupon_id: Joi.number().integer().positive().allow(null),
    tracking_code: Joi.string().max(255).allow(null, '')
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      errors: error.details.map(d => d.message)
    });
  }

  req.body = value;
  next();
};


/* ============================
   5. INVOICE ITEMS
============================ */
const validateInvoiceItem = (req, res, next) => {
    const schema = Joi.object({
        product_id: Joi.number().integer().positive().required(),
        order_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(1).required(),
        regular_price: Joi.number().precision(2).min(0).required(),
        special_price: Joi.number().precision(2).min(0).allow(null).optional()
            .custom((value, helpers) => {
                if (value !== null && value > req.body.regular_price) {
                    return helpers.message('"special_price" cannot be greater than "regular_price"');
                }
                return value;
            }),
        product_name: Joi.string().max(255).required()
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            errors: error.details.map(d => d.message)
        });
    }

    req.body = value;
    next();
};


/* ============================
   6. ORDERS
============================ */
const validateOrder = (req, res, next) => {
  const itemSchema = Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).required(),
    regular_price: Joi.number().precision(2).min(0).required(),
    special_price: Joi.number().precision(2).min(0).allow(null),
    product_name: Joi.string().max(255).required()
  });

  const addressSchema = Joi.object({
    city: Joi.string().max(255).required(),
    street: Joi.string().max(255).required()
  });

  const schema = Joi.object({
    total_price: Joi.number().precision(2).min(0).required(),
    payment_method: Joi.string().max(100).required(),
    username: Joi.string().max(255).required(),
    user_email: Joi.string().email().max(255).required(),
    billing_address: addressSchema.required(),
    shipping_address: addressSchema.required(),
    items: Joi.array().min(1).items(itemSchema).required(),
    coupon_id: Joi.number().integer().positive().allow(null)
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      errors: error.details.map(d => d.message)
    });
  }

  req.body = value;
  next();
};


/* ============================
   EXPORT
============================ */
module.exports = {
    validateCategory,
    validateProduct,
    validateCoupon,
    validateInvoice,
    validateInvoiceItem,
    validateOrder
};

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
    code: Joi.string().max(50).trim().uppercase().required(),
    starting_date: Joi.date().iso().required(),
    expiration_date: Joi.date().iso().min(Joi.ref("starting_date")).required(),
    discount: Joi.number().precision(2).min(0).max(999999.99).required(),
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
    // allow both shapes: { zip } (frontend earlier) or { cap } (template expects cap)
    name: Joi.string().max(255).optional(),
    city: Joi.string().max(255).required(),
    street: Joi.string().max(255).required(),
    zip: Joi.string().pattern(/^\d{4,6}$/).optional(),
    cap: Joi.string().pattern(/^\d{4,6}$/).optional(),
    province: Joi.string().max(255).optional(),
    country: Joi.string().max(255).required()
  });

  // require either zip or cap to be present
  const addressWithPostal = addressSchema.or('zip', 'cap');

  const schema = Joi.object({
    total_price: Joi.number().precision(2).min(0).required(),
    payment_method: Joi.string().max(100).required(),
    // Optional payment details (card) - allowed but not required
    payment: Joi.object({
      payment_method: Joi.string().max(100).required(),
      card_number: Joi.string().pattern(/^[\d\s]{13,23}$/).allow(null, ""),
      cvc: Joi.string().pattern(/^\d{3,4}$/).allow(null, ""),
      expiry_month: Joi.number().integer().min(1).max(12).allow(null),
      expiry_year: Joi.number().integer().min(new Date().getFullYear()).allow(null)
    }).optional(),
    username: Joi.string().max(255).required(),
    user_email: Joi.string().email().max(255).required(),
    billing_address: addressWithPostal.required(),
    shipping_address: addressWithPostal.required(),
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

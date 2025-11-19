// createOrderController.js
const db = require('../config/db');

const createOrder = async (req, res) => {
  const { invoice, invoice_items } = req.body;

  if (!invoice || !invoice_items || !Array.isArray(invoice_items) || invoice_items.length === 0) {
    return res.status(400).json({ message: 'Dati ordine incompleti' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Inserisci la fattura
    const [invoiceResult] = await connection.execute(
      `INSERT INTO invoices 
        (total_price, payment_method, status, username, user_email, billing_address, shipping_address, coupon_id, transaction_id, tracking_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice.total_price,
        invoice.payment_method,
        invoice.status || 'pending',
        invoice.username,
        invoice.user_email,
        JSON.stringify(invoice.billing_address),
        JSON.stringify(invoice.shipping_address),
        invoice.coupon_id || null,
        invoice.transaction_id || null,
        invoice.tracking_code || null
      ]
    );

    const orderId = invoiceResult.insertId;

    // Inserisci i prodotti nella tabella invoice_item
    for (let item of invoice_items) {
      // Verifica prodotto e prezzo
      const [productRows] = await connection.execute(
        `SELECT name, regular_price, special_price FROM products WHERE id = ?`,
        [item.product_id]
      );

      if (productRows.length === 0) throw new Error(`Prodotto ${item.product_id} non trovato`);

      const product = productRows[0];
      const price = item.special_price ?? product.special_price ?? product.regular_price;

      await connection.execute(
        `INSERT INTO invoice_item 
          (product_id, order_id, quantity, regular_price, special_price, product_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [item.product_id, orderId, item.quantity, product.regular_price, price, product.name]
      );
    }

    await connection.commit();

    // Recupera ordine completo per conferma
    const [savedInvoice] = await connection.execute(`SELECT * FROM invoices WHERE id = ?`, [orderId]);
    const [savedItems] = await connection.execute(`SELECT * FROM invoice_item WHERE order_id = ?`, [orderId]);

    res.status(201).json({
      message: 'Ordine salvato con successo',
      invoice: savedInvoice[0],
      invoice_items: savedItems
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

module.exports = { createOrder };
// createOrderController.js
const db = require('../config/db');
const crypto = require('crypto'); // Per generare transaction_id e tracking_code univoci

/**
 * Funzione per creare un ordine completo con fattura e articoli.
 * Controlla disponibilità prodotti e aggiorna quantità in magazzino.
 */
const createOrder = async (req, res) => {
    const { invoice, invoice_items } = req.body;

    // Validazione iniziale: tutti i dati obbligatori devono essere presenti
    if (!invoice || !invoice_items || !Array.isArray(invoice_items) || invoice_items.length === 0) {
        return res.status(400).json({ message: 'Dati ordine incompleti' });
    }

    // Ottieni una connessione dal pool del database
    const connection = await db.getConnection();
    try {
        // Inizio transazione: tutte le operazioni devono riuscire insieme
        await connection.beginTransaction();

        // Se transaction_id non è passato dall'utente, generalo automaticamente
        const transactionId = invoice.transaction_id || crypto.randomUUID();

        // Se tracking_code non è passato dall'utente, generalo automaticamente come stringa casuale
        const trackingCode = invoice.tracking_code || crypto.randomBytes(6).toString('hex');

        // Inserisci la fattura nella tabella invoices
        const [invoiceResult] = await connection.execute(
            `INSERT INTO invoices 
            (total_price, payment_method, status, username, user_email, billing_address, shipping_address, coupon_id, transaction_id, tracking_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice.total_price,
                invoice.payment_method,
                invoice.status || 'pending', // Default 'pending'
                invoice.username,
                invoice.user_email,
                JSON.stringify(invoice.billing_address), // JSON per gli indirizzi
                JSON.stringify(invoice.shipping_address),
                invoice.coupon_id || null,
                transactionId,   // valore generato se non passato
                trackingCode     // valore generato se non passato
            ]
        );

        const orderId = invoiceResult.insertId; // ID della fattura appena inserita

        // Inserimento degli articoli nella tabella invoice_item
        for (let item of invoice_items) {
            // Recupera informazioni sul prodotto dal database
            const [productRows] = await connection.execute(
                `SELECT name, regular_price, special_price, quantity FROM products WHERE id = ?`,
                [item.product_id]
            );

            // Se il prodotto non esiste, interrompi l'operazione
            if (productRows.length === 0) throw new Error(`Prodotto ${item.product_id} non trovato`);

            const product = productRows[0];

            // Controllo quantità disponibile
            if (item.quantity > product.quantity) {
                throw new Error(`Quantità richiesta per '${product.name}' non disponibile. Disponibile: ${product.quantity}`);
            }

            // Determina il prezzo finale: special_price prioritario, altrimenti regular_price
            const price = item.special_price ?? product.special_price ?? product.regular_price;

            // Inserisci l'articolo nella tabella invoice_item
            await connection.execute(
                `INSERT INTO invoice_item 
                (product_id, order_id, quantity, regular_price, special_price, product_name)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [item.product_id, orderId, item.quantity, product.regular_price, price, product.name]
            );

            // Aggiorna la quantità disponibile nel magazzino
            await connection.execute(
                `UPDATE products SET quantity = quantity - ? WHERE id = ?`,
                [item.quantity, item.product_id]
            );
        }

        // Conferma la transazione: tutte le modifiche vengono salvate
        await connection.commit();

        // Recupera ordine e articoli salvati per inviarli come risposta
        const [savedInvoice] = await connection.execute(`SELECT * FROM invoices WHERE id = ?`, [orderId]);
        const [savedItems] = await connection.execute(`SELECT * FROM invoice_item WHERE order_id = ?`, [orderId]);

        // Risposta al client
        res.status(201).json({
            message: 'Ordine salvato con successo',
            invoice: savedInvoice[0],
            invoice_items: savedItems
        });

    } catch (error) {
        // Se qualcosa va storto, annulla tutte le modifiche
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: error.message });
    } finally {
        // Rilascia sempre la connessione
        connection.release();
    }
};

module.exports = { createOrder };
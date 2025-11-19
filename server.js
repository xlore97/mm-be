require('dotenv').config();
const express = require('express');
const app = express();

//inizlizzazione cors
const cors = require("cors");

// Middleware
const notFound = require('./middlewares/notFound');
const serverError = require('./middlewares/serverError');
//import middleware gestione path immagini
const imagePath = require("./middlewares/imagePath")
const { validateProduct, validateCategory, validateCoupon, validateInvoice } = require("./middlewares/validation"); // importa il middleware

// Routes
const categoriesRoutes = require('./routes/categoriesRoutes');
const couponsRoutes = require('./routes/couponsRoutes');
const invoicesRoutes = require('./routes/invoicesRoutes');
const productsRoutes = require('./routes/productsRoutes');
const invoiceItemsRoutes = require('./routes/invoiceItemsRoutes');

// Config
const PORT = process.env.PORT || 3000;

// usiamo il middleware static di express (per rendere disponibile i file statici)
app.use(express.static('public'));

// Middleware globali
app.use(express.json());

//registro middleware gestione paths
app.use(imagePath);

// middleware per il CORS
app.use(cors({
origin: 'http://localhost:5173' 
}));


// Route di test
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// API Routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/invoice_items', invoiceItemsRoutes);

// Gestione errori
app.use(notFound);
app.use(serverError);

// Avvio server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    //Debug test file .env
    // console.log(process.env.PORT);
});

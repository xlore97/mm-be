require('dotenv').config();
const express = require('express');
const app = express();

// Middleware
const notFound = require('./middlewares/notFound');
const serverError = require('./middlewares/serverError');

// Routes
const categoriesRoutes = require('./routes/categoriesRoutes');

// Config
const PORT = process.env.PORT || 3000;

// Middleware globali
app.use(express.json());

// Route di test
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// API Routes
app.use('/api/categories', categoriesRoutes);

// Gestione errori
app.use(notFound);
app.use(serverError);

// Avvio server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    //Debug test file .env
    // console.log(process.env.PORT);
});

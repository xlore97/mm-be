
// Middleware per gestione errore 404 - Route non trovata

const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            path: req.originalUrl
        }
    });
};

module.exports = notFound;

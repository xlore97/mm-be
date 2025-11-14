
// Middleware per gestione errore 500 - Server Error

const serverError = (err, req, res, next) => {
    console.error('Error:', err);

    res.status(500).json({
        success: false,
        error: {
            message: 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && {
                details: err.message,
                stack: err.stack
            })
        }
    });
};

module.exports = serverError;

const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER;

transporter.verify((error, success) => {
    if (error) {
        console.error("Errore configurazione SMTP:", error);
    } else {
        console.log("Server SMTP pronto a inviare email.");
    }
});

module.exports = {
    transporter,
    FROM_EMAIL,
};

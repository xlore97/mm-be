const { transporter, FROM_EMAIL } = require("../config/emailConfig");
const { generateOrderConfirmationHTML } = require("../templates/orderConfirmationTemplate");

async function sendOrderConfirmationEmail(orderData) {
    const html = generateOrderConfirmationHTML(orderData);

    const mailOptions = {
        from: FROM_EMAIL,
        to: orderData.to,
        subject: `Conferma ordine #${orderData.orderNumber}`,
        html,
        attachments: [
            {
                filename: "logo-header.png",
                path: __dirname + "/../public/logo-header.png",
                cid: "logoheadercid"
            }
        ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Mail conferma ordine inviata:", info.messageId);
    return info;
}

module.exports = {
    sendOrderConfirmationEmail,
};

const { sendOrderConfirmationEmail } = require("./services/emailService");

(async () => {
    try {
        await sendOrderConfirmationEmail({
            to: "NOMEMAIL@gmail.com",
            customerName: "Mario Rossi",
            orderNumber: 1234,
            orderDate: "19/11/2025",
            paymentMethod: "Carta di credito",
            shippingMethod: "Corriere espresso",
            items: [
                { name: "Prodotto A", quantity: 2, price: 19.99 },
                { name: "Prodotto B", quantity: 1, price: 9.99 },
            ],
            totals: {
                subtotal: 49.97,
                shippingCost: 5,
                discount: 0,
                total: 54.97,
            },
            shippingAddress: {
                name: "Mario Rossi",
                street: "Via Roma 10",
                city: "Firenze",
                cap: "50100",
                province: "FI",
                country: "Italia",
            },
            billingAddress: null,
        });

        console.log("✅ Email di test inviata con successo!");
    } catch (err) {
        console.error("❌ Errore durante l'invio:", err);
    }
})();

function formatCurrency(value) {
    if (typeof value !== "number") value = Number(value) || 0;
    return value.toFixed(2).replace(".", ",") + " €";
}

function generateOrderConfirmationHTML(orderData) {
    const {
        customerName,
        orderNumber,
        orderDate,
        paymentMethod,
        shippingMethod,
        items,
        totals,
        shippingAddress,
        billingAddress,
    } = orderData;

    const itemsHtml = items
        .map((item) => {
            return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #2b1117;">${item.name}</td>
          <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #2b1117;">${item.quantity}</td>
          <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #2b1117;">${formatCurrency(item.price)}</td>
          <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #2b1117;">${formatCurrency(
                item.price * item.quantity
            )}</td>
        </tr>
      `;
        })
        .join("");

    const billingBlock = billingAddress
        ? `
      <p style="margin:0;"><strong>${billingAddress.name}</strong></p>
      <p style="margin:0;">${billingAddress.street}</p>
      <p style="margin:0;">${billingAddress.cap} ${billingAddress.city} (${billingAddress.province})</p>
      <p style="margin:0;">${billingAddress.country}</p>
    `
        : `<p style="margin:0;">Uguale all'indirizzo di spedizione</p>`;

    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>Conferma ordine #${orderNumber} – Mors Market</title>
</head>

<body style="margin:0; padding:0; background-color:#050308; font-family: Arial, Helvetica, sans-serif; color:#f5f5f5;">
  <div style="width:100%; padding:16px 0;">
    <div
      style="
        max-width: 640px;
        margin: 0 auto;
        background: #1B1A1A;
        border: 1px solid #b3122f;
        box-shadow: 0 0 24px rgba(179, 18, 47, 0.55);
        border-radius: 12px;
        padding: 20px 20px 24px;
      "
    >

      <!-- HEADER -->
      <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:25px;">
        <tr>

          <!-- LOGO SINISTRA -->
          <td width="35%" align="left" style="vertical-align:middle; padding-right:10px;">
            <img 
              src="cid:logoheadercid"
              alt="Mors Market Logo"
              style="width:120px; height:auto; filter: drop-shadow(0 0 6px rgba(179,18,47,0.7)); display:block;"
            />
          </td>

          <!-- TESTI A DESTRA, CENTRATI -->
          <td width="65%" align="center" style="vertical-align:middle;">

            <div
              style="
                display:inline-block;
                padding: 6px 14px;
                border-radius: 999px;
                border: 1px solid #b3122f;
                background: rgba(0,0,0,0.45);
                margin-bottom:10px;
              "
            >
              <span style="font-size:11px; letter-spacing: 0.14em; text-transform: uppercase; color:#ffdde4;">
                EMPORIO PER VAMPIRI, LYCAN E STREGHE
              </span>
            </div>

            <h1
              style="
                margin: 6px 0 0 0;
                font-size: 26px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color:#ffedf0;
              "
            >
              MORS MARKET
            </h1>

            <p style="margin:8px 0 0 0; font-size:12px; color:#e09aa7;">
              Oggetti, reliquie e comfort dall'altra parte della notte.
            </p>

          </td>

        </tr>
      </table>

      <hr style="border:none; border-top:1px solid #2b1117; margin:16px 0;" />

      <!-- INTRO -->
      <h2
        style="
          margin: 0 0 12px;
          font-size: 20px;
          color:#ffb3c0;
          text-shadow: 0 0 6px rgba(179,18,47,0.8);
        "
      >
        Conferma ordine #${orderNumber}
      </h2>

      <p style="margin:0 0 4px; font-size:14px;">
        Ciao <strong>${customerName}</strong>,
      </p>

      <p style="margin:0 0 12px; font-size:14px; line-height:1.5;">
        il tuo ordine è stato accolto tra le ombre di <strong>Mors Market</strong> il
        <strong>${orderDate}</strong>.
      </p>

      <div
        style="
          margin:14px 0 18px;
          padding:8px 10px;
          border-radius:8px;
          background: linear-gradient(90deg, rgba(179,18,47,0.15), rgba(0,0,0,0.5));
          border:1px solid rgba(179,18,47,0.6);
          font-size:12px;
        "
      >
        <strong style="color:#ffbccc;">Nota:</strong>
        <span style="color:#f7dfe5;">
          Questa email è la conferma ufficiale del tuo ordine.
          Conserva il numero <strong>#${orderNumber}</strong> come riferimento.
        </span>
      </div>

      <!-- DETTAGLI -->
      <h3
        style="
          margin: 0 0 6px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color:#ffb3c0;
        "
      >
        Dettagli ordine
      </h3>

      <div style="font-size:13px; line-height:1.4; margin-bottom:12px;">
        <p style="margin:0;">Numero ordine: <strong style="color:#ffdde4;">#${orderNumber}</strong></p>
        <p style="margin:0;">Data: <strong>${orderDate}</strong></p>
        <p style="margin:0;">Pagamento: <strong>${paymentMethod}</strong></p>
        <p style="margin:0;">Spedizione: <strong>${shippingMethod}</strong></p>
      </div>

      <!-- ARTICOLI -->
      <h3
        style="
          margin: 0 0 6px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color:#ffb3c0;
        "
      >
        Riepilogo articoli
      </h3>

      <div
        style="
          border-radius:8px;
          overflow:hidden;
          border:1px solid #2b1117;
          background:rgba(0,0,0,0.55);
        "
      >
        <table
          style="
            width:100%;
            border-collapse:collapse;
            font-size:13px;
            color:#f9e6ea;
          "
        >
          <thead>
            <tr style="background:linear-gradient(90deg,#2b1117,#1a090f);">
              <th style="text-align:left; padding:8px 10px; border-bottom:1px solid #3a1820;">Prodotto</th>
              <th style="text-align:center; padding:8px 10px; border-bottom:1px solid #3a1820;">Q.tà</th>
              <th style="text-align:right; padding:8px 10px; border-bottom:1px solid #3a1820;">Prezzo</th>
              <th style="text-align:right; padding:8px 10px; border-bottom:1px solid #3a1820;">Totale</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- TOTALI -->
      <table style="width:100%; margin-top:12px; font-size:13px;">
        <tr>
          <td style="text-align:right; padding:2px 0; color:#f3dbe1;">Subtotale:</td>
          <td style="text-align:right; padding:2px 0; width:130px; color:#f3dbe1;">${formatCurrency(
        totals.subtotal
    )}</td>
        </tr>
        <tr>
          <td style="text-align:right; padding:2px 0; color:#f3dbe1;">Spedizione:</td>
          <td style="text-align:right; padding:2px 0; color:#f3dbe1;">${formatCurrency(
        totals.shippingCost
    )}</td>
        </tr>
        <tr>
          <td style="text-align:right; padding:2px 0; color:#f3dbe1;">Sconto:</td>
          <td style="text-align:right; padding:2px 0; color:#f3dbe1;">-${formatCurrency(
        totals.discount
    )}</td>
        </tr>
        <tr>
          <td style="text-align:right; padding:4px 0; font-weight:bold; color:#ffb3c0;">Totale:</td>
          <td style="text-align:right; padding:4px 0; font-weight:bold; color:#ffb3c0;">${formatCurrency(
        totals.total
    )}</td>
        </tr>
      </table>

      <hr style="border:none; border-top:1px solid #2b1117; margin:18px 0 12px;" />

      <!-- SPEDIZIONE -->
      <h3
        style="
          margin: 0 0 6px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color:#ffb3c0;
        "
      >
        Indirizzo di spedizione
      </h3>

      <div style="font-size:13px; line-height:1.4; margin-bottom:10px;">
        <p style="margin:0;"><strong>${shippingAddress.name}</strong></p>
        <p style="margin:0;">${shippingAddress.street}</p>
        <p style="margin:0;">
          ${shippingAddress.cap} ${shippingAddress.city} (${shippingAddress.province})
        </p>
        <p style="margin:0;">${shippingAddress.country}</p>
      </div>

      <!-- FATTURAZIONE -->
      <h3
        style="
          margin: 8px 0 6px;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color:#ffb3c0;
        "
      >
        Indirizzo di fatturazione
      </h3>

      <div style="font-size:13px; line-height:1.4; margin-bottom:14px;">
        ${billingBlock}
      </div>

      <hr style="border:none; border-top:1px solid #2b1117; margin:16px 0 10px;" />

      <!-- FOOTER -->
      <p style="font-size:12px; margin:0 0 6px; color:#f3dbe1;">
        Riceverai un'altra comunicazione non appena il tuo ordine verrà affidato ai corrieri notturni.
      </p>

      <p style="font-size:12px; margin:0 0 4px; color:#e5c8cf;">
        Grazie per aver scelto <strong>Mors Market</strong>.<br/>
        Che le tue notti siano lunghe e ben fornite.
      </p>

      <p style="font-size:10px; margin:10px 0 0; color:#9d7e86; text-align:center;">
        Se non hai richiesto questo ordine, ignora questa email o contatta il nostro supporto.
      </p>

    </div>
  </div>
</body>
</html>
`;
}

module.exports = {
    generateOrderConfirmationHTML,
};

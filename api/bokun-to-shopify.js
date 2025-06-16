export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const booking = req.body;
  console.log("📦 Создание заказа. booking.bookingId:", booking.bookingId);

  // Защита от пустого bookingId
  if (!booking.bookingId) {
    console.warn("❌ Booking ID отсутствует в запросе");
    return res.status(400).json({ error: "Missing bookingId in payload" });
  }

  const shopifyDomain = "https://fujijapan.myshopify.com";
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  // Проверка существования заказа
  const existingOrdersRes = await fetch(`${shopifyDomain}/admin/api/2023-10/orders.json?status=any&fields=id,note`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    }
  });

  const existingOrdersData = await existingOrdersRes.json();
  const alreadyExists = existingOrdersData.orders.find(o =>
    o.note && o.note.includes(`Booking ID: ${booking.bookingId}`)
  );

  if (alreadyExists) {
    console.log(`⚠️ Заказ с Booking ID ${booking.bookingId} уже существует`);
    return res.status(200).json({ message: "Order already exists, skipping." });
  }

  // Создание заказа
  const orderData = {
    order: {
      line_items: [
        {
          title: `Experience: ${booking.confirmationCode}`,
          price: booking.totalPrice,
          quantity: 1,
        }
      ],
      email: booking.email,
      financial_status: "pending",
      currency: booking.currency || "JPY",
      tags: "Bokun",
      note: `Booking ID: ${booking.bookingId}`
    }
  };

  const response = await fetch(`${shopifyDomain}/admin/api/2023-10/orders.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify(orderData),
  });

  const result = await response.json();
  return res.status(200).json({ message: "Order sent to Shopify", shopifyResponse: result });
}

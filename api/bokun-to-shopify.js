export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const booking = req.body;

  // --- Shopify access ---
  const shopifyDomain = "https://fujijapan.myshopify.com"; // 👈 замени на своё
  const accessToken = "process.env.SHOPIFY_ACCESS_TOKEN"; // 👈 вставь Admin API Access Token

  // --- Преобразуем данные из Bokun в Shopify заказ ---
  const orderData = {
    order: {
      line_items: [
        {
          title: `Experience: ${booking.confirmationCode}`,
          price: booking.totalPrice / 100,
          quantity: 1,
        }
      ],
      email: "guest@example.com",
      financial_status: "pending",
      currency: booking.currency || "JPY",
      tags: "Bokun",
      note: `Booking ID: ${booking.bookingId}`
    }
  };

  // --- Отправка в Shopify ---
  const response = await fetch(`${shopifyDomain}/admin/api/2023-10/orders.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify(orderData),
  });

  const result = await response.json();
  res.status(200).json({ message: "Sent to Shopify", shopifyResponse: result });
}
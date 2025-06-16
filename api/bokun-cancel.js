export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  console.log("🚨 Отмена брони получена:", JSON.stringify(req.body, null, 2));

  // Поддержка разных форматов входящих данных
  const bookingId = req.body?.bookingId || req.body?.booking?.id;

  console.log("bookingId >>>", bookingId);

  if (!bookingId) {
    return res.status(400).json({ error: 'Missing bookingId' });
  }

  const shopifyDomain = "https://fujijapan.myshopify.com";
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  try {
    // Получаем список заказов и логируем
    const searchResponse = await fetch(`${shopifyDomain}/admin/api/2023-10/orders.json?status=any&fields=id,note`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      }
    });

    const data = await searchResponse.json();
    console.log("📦 Список заказов из Shopify:", JSON.stringify(data.orders, null, 2));

    // Ищем заказ по note
    const order = data.orders.find(o => o.note && o.note.includes(`Booking ID: ${bookingId}`));

    if (!order) {
      console.warn(`❌ Заказ с Booking ID: ${bookingId} не найден`);
      return res.status(404).json({ error: 'Order not found in Shopify' });
    }

    // Отправляем запрос на отмену
    const cancelResponse = await fetch(`${shopifyDomain}/admin/api/2023-10/orders/${order.id}/cancel.json`, {
      method: 'POST',
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      }
    });

    if (!cancelResponse.ok) {
      const error = await cancelResponse.json();
      console.error("❌ Ошибка при отмене:", error);
      return res.status(cancelResponse.status).json({ error });
    }

    const result = await cancelResponse.json();
    console.log("✅ Заказ успешно отменён:", result);

    return res.status(200).json({ message: 'Order canceled in Shopify', result });

  } catch (error) {
    console.error("🔥 Ошибка на сервере:", error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
console.log("🔍 Поиск по note: Booking ID: ", bookingId);
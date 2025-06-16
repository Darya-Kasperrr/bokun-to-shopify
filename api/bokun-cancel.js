export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: 'Missing bookingId' });
  }

  const shopifyDomain = "https://fujijapan.myshopify.com";
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  try {
    const searchResponse = await fetch(`${shopifyDomain}/admin/api/2023-10/orders.json?status=any&fields=id,note`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      }
    });

    const data = await searchResponse.json();
    const order = data.orders.find(o => o.note && o.note.includes(`Booking ID: ${bookingId}`));

    if (!order) {
      return res.status(404).json({ error: 'Order not found in Shopify' });
    }

    const cancelResponse = await fetch(`${shopifyDomain}/admin/api/2023-10/orders/${order.id}/cancel.json`, {
      method: 'POST',
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      }
    });

    if (!cancelResponse.ok) {
      const error = await cancelResponse.json();
      return res.status(cancelResponse.status).json({ error });
    }

    const result = await cancelResponse.json();
    return res.status(200).json({ message: 'Order canceled in Shopify', result });

  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
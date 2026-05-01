type StripeLineItem = {
  name: string;
  description?: string;
  amount: number;
  quantity?: number;
};

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is missing.');
  }

  return key;
}

async function stripeRequest(path: string, body?: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body,
    cache: 'no-store',
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Stripe request failed.');
  }

  return payload;
}

export async function createCheckoutSession({
  successUrl,
  cancelUrl,
  customerEmail,
  metadata,
  lineItems,
}: {
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata: Record<string, string>;
  lineItems: StripeLineItem[];
}) {
  const formData = new URLSearchParams();
  formData.set('mode', 'payment');
  formData.set('success_url', successUrl);
  formData.set('cancel_url', cancelUrl);
  formData.set('payment_method_types[0]', 'card');

  if (customerEmail) {
    formData.set('customer_email', customerEmail);
  }

  lineItems.forEach((item, index) => {
    formData.set(`line_items[${index}][price_data][currency]`, 'pkr');
    formData.set(`line_items[${index}][price_data][product_data][name]`, item.name);
    formData.set(
      `line_items[${index}][price_data][product_data][description]`,
      item.description || item.name
    );
    formData.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.amount * 100)));
    formData.set(`line_items[${index}][quantity]`, String(item.quantity || 1));
  });

  Object.entries(metadata).forEach(([key, value]) => {
    formData.set(`metadata[${key}]`, value);
  });

  return stripeRequest('/v1/checkout/sessions', formData);
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripeRequest(`/v1/checkout/sessions/${sessionId}`);
}

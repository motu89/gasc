import { formatCurrency } from '@/lib/format';
import { sendEmail } from '@/lib/smtp';

function renderList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

export async function sendOrderEmails(order: {
  orderNumber: string;
  userEmail: string;
  vendorEmail?: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  items: Array<{
    productTitle: string;
    quantity: number;
    totalPrice: number;
  }>;
}) {
  const recipients = [
    order.userEmail,
    order.vendorEmail,
    process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL,
  ].filter(Boolean) as string[];

  if (recipients.length === 0) {
    return;
  }

  const lines = order.items.map(
    (item) => `${item.productTitle} x ${item.quantity} - ${formatCurrency(item.totalPrice)}`
  );

  await sendEmail({
    to: recipients,
    subject: `Order ${order.orderNumber} update`,
    html: `
      <h2>Order ${order.orderNumber}</h2>
      <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
      <p><strong>Payment status:</strong> ${order.paymentStatus}</p>
      <p><strong>Total:</strong> ${formatCurrency(order.totalAmount)}</p>
      <p><strong>Address:</strong> ${order.shippingAddress}</p>
      <h3>Items</h3>
      ${renderList(lines)}
    `,
  });
}

export async function sendBookingEmails(booking: {
  serviceTitle: string;
  userEmail?: string;
  providerEmail?: string;
  userAddress: string;
  paymentMethod?: string;
  paymentStatus: string;
  totalAmount: number;
  date: string;
  time: string;
  duration: number;
  status?: string;
}) {
  const recipients = [
    booking.userEmail,
    booking.providerEmail,
    process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL,
  ].filter(Boolean) as string[];

  if (recipients.length === 0) {
    return;
  }

  const statusText = booking.status ? `Booking ${booking.status}` : 'Booking update';
  
  await sendEmail({
    to: recipients,
    subject: `${statusText} for ${booking.serviceTitle}`,
    html: `
      <h2>${booking.serviceTitle}</h2>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.time}</p>
      <p><strong>Duration:</strong> ${booking.duration} hour(s)</p>
      <p><strong>Payment method:</strong> ${booking.paymentMethod || 'N/A'}</p>
      <p><strong>Payment status:</strong> ${booking.paymentStatus}</p>
      <p><strong>Total paid now:</strong> ${formatCurrency(booking.totalAmount)}</p>
      <p><strong>Address:</strong> ${booking.userAddress}</p>
      ${booking.status ? `<p><strong>Booking status:</strong> <span style="color: green; font-weight: bold;">${booking.status.toUpperCase()}</span></p>` : ''}
    `,
  });
}

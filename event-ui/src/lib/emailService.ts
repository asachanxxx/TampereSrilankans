import nodemailer from 'nodemailer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ORG_NAME = 'Tampere Sri Lankans';

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

/**
 * Send a ticket link email via Gmail to a registrant.
 */
export async function sendTicketEmail(
  toEmail: string,
  toName: string,
  eventTitle: string,
  ticketNumber: string
): Promise<void> {
  const transport = createTransport();

  if (!transport) {
    console.warn('[emailService] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping ticket email.');
    return;
  }

  const ticketUrl = `${APP_URL}/tickets/${ticketNumber}`;

  await transport.sendMail({
    from: `${ORG_NAME} <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Your ticket for ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 24px; color: #111;">
        <h2 style="margin-bottom: 4px;">You&apos;re registered!</h2>
        <p style="margin-top: 4px; color: #555;">Hi ${toName},</p>
        <p>Your registration for <strong>${eventTitle}</strong> was successful.</p>
        <p>Use the link below to view your ticket at any time &mdash; no account needed:</p>
        <p style="margin: 24px 0;">
          <a href="${ticketUrl}"
             style="background:#0f172a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;display:inline-block;">
            View My Ticket
          </a>
        </p>
        <p style="font-size: 12px; color: #888;">
          Or copy this link: <a href="${ticketUrl}" style="color:#0f172a;">${ticketUrl}</a>
        </p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #aaa;">${ORG_NAME} Association</p>
      </div>
    `,
    text: `Hi ${toName},\n\nYour registration for "${eventTitle}" was successful.\n\nView your ticket: ${ticketUrl}\n\nTicket number: ${ticketNumber}\n\n${ORG_NAME} Association`,
  });
}

/**
 * Build the WhatsApp message text for a given registration.
 * Returns a plain string ready to copy/send.
 */
export function buildWhatsAppMessage(params: {
  toName: string;
  eventTitle: string;
  eventDate: string;
  locationName: string;
  city: string;
  ticketNumber: string;
}): string {
  const { toName, eventTitle, eventDate, locationName, city, ticketNumber } = params;
  const ticketUrl = `${APP_URL}/tickets/${ticketNumber}`;

  return [
    `🎉 Hi ${toName}!`,
    ``,
    `Your registration for *${eventTitle}* is confirmed.`,
    ``,
    `🎟️ Ticket: ${ticketNumber}`,
    `📅 Date: ${eventDate}`,
    `📍 Venue: ${locationName}, ${city}`,
    ``,
    `View your ticket here (no login needed):`,
    `${ticketUrl}`,
    ``,
    `— ${ORG_NAME}`,
  ].join('\n');
}

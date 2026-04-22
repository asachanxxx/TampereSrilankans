import { Resend } from 'resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ORG_NAME = 'Tampere Sri Lankans';

function createClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Send a ticket link email via Resend to a registrant.
 * DISABLED — Resend domain not yet verified. Re-enable once a domain is
 * verified at resend.com/domains and RESEND_FROM_EMAIL is updated.
 */
export async function sendTicketEmail(
  toEmail: string,
  toName: string,
  eventTitle: string,
  ticketNumber: string
): Promise<void> {
  console.log(`[emailService] Email sending disabled — skipping ticket email to ${toEmail} (ticket: ${ticketNumber}).`);
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

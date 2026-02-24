import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Tampere Sri Lankans <noreply@tamperesrilankans.fi>';

/**
 * Send a ticket link email to a guest (non-authenticated) registrant.
 */
export async function sendTicketEmail(
  toEmail: string,
  toName: string,
  eventTitle: string,
  ticketNumber: string
): Promise<void> {
  const ticketUrl = `${APP_URL}/tickets/${ticketNumber}`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `Your ticket for ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 24px; color: #111;">
        <h2 style="margin-bottom: 4px;">You're registered!</h2>
        <p style="margin-top: 4px; color: #555;">Hi ${toName},</p>
        <p>Your registration for <strong>${eventTitle}</strong> was successful.</p>
        <p>Use the link below to view your ticket at any time — no account needed:</p>
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
        <p style="font-size: 12px; color: #aaa;">Tampere Sri Lankans Association</p>
      </div>
    `,
    text: `Hi ${toName},\n\nYour registration for "${eventTitle}" was successful.\n\nView your ticket here: ${ticketUrl}\n\nTicket number: ${ticketNumber}\n\nTampere Sri Lankans Association`,
  });

  if (error) {
    throw new Error(`Failed to send ticket email: ${error.message}`);
  }
}

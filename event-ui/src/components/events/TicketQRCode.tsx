"use client";

import { QRCodeSVG } from "qrcode.react";

type TicketQRCodeProps = {
  ticketNumber: string;
  eventId: string;
  size?: number;
};

export function TicketQRCode({ ticketNumber, eventId, size = 200 }: TicketQRCodeProps) {
  // Generate QR code data - in a real app, this would be a verification URL
  const qrData = JSON.stringify({
    ticketNumber,
    eventId,
    timestamp: Date.now(),
  });

  return (
    <div className="flex items-center justify-center bg-white p-4 rounded-lg">
      <QRCodeSVG
        value={qrData}
        size={size}
        level="H"
        includeMargin={false}
        className="w-full h-auto"
      />
    </div>
  );
}

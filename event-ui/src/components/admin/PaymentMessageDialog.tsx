"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, Copy, MessageCircle, Mail } from "lucide-react";

type Channel = "whatsapp" | "email";

type Props = {
  whatsappMessage: string;
  emailMessage: string;
  emailSubject: string;
  open: boolean;
  onClose: () => void;
};

export function PaymentMessageDialog({
  whatsappMessage,
  emailMessage,
  emailSubject,
  open,
  onClose,
}: Props) {
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [copied, setCopied] = useState(false);

  const activeText = channel === "whatsapp" ? whatsappMessage : emailMessage;

  const handleCopy = async () => {
    const textToCopy =
      channel === "email"
        ? `Subject: ${emailSubject}\n\n${emailMessage}`
        : whatsappMessage;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabBase =
    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all";
  const tabActive = "bg-background shadow-sm text-foreground";
  const tabInactive = "text-muted-foreground hover:text-foreground";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setChannel("whatsapp");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment Message</DialogTitle>
        </DialogHeader>

        {/* Channel tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            className={`${tabBase} ${channel === "whatsapp" ? tabActive : tabInactive}`}
            onClick={() => setChannel("whatsapp")}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            type="button"
            className={`${tabBase} ${channel === "email" ? tabActive : tabInactive}`}
            onClick={() => setChannel("email")}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>

        {/* Email subject (email tab only) */}
        {channel === "email" && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Subject</p>
            <Input
              readOnly
              value={emailSubject}
              className="bg-muted font-mono text-xs"
            />
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {channel === "whatsapp"
            ? "Copy and paste into WhatsApp."
            : "Copy the subject and body into your email client."}
        </p>

        <Textarea
          readOnly
          rows={12}
          className="font-mono text-xs resize-none bg-muted"
          value={activeText}
        />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/state/session";

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { loginAs } = useSession();

  const handleLogin = (role: "user" | "admin") => {
    loginAs(role);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome</DialogTitle>
          <DialogDescription>
            Choose how you'd like to continue
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button onClick={() => handleLogin("user")} size="lg">
            Continue as User
          </Button>
          <Button
            onClick={() => handleLogin("admin")}
            variant="outline"
            size="lg"
          >
            Continue as Admin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

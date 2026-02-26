import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page. 
          This area is restricted to administrators only.
        </p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  );
}

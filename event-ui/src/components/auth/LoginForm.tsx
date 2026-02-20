"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/state/session";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { AlertCircle } from "lucide-react";

export function LoginForm() {
  const { loginAs, loginMock } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // Mock loading
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Mock login
    loginMock({ email });
    router.push("/me");
  };

  const handleAdminLogin = () => {
    loginAs("admin");
    router.push("/admin");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-primary"
          disabled={loading}
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleAdminLogin}
          className="text-xs text-muted-foreground hover:text-primary underline"
        >
          Login as Admin (demo)
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, UserCheck, Briefcase, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/state/session";
import type { AppUser, UserRole } from "@/models/user";

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "user", label: "User", description: "Standard registered user, can attend events" },
  { value: "member", label: "Member", description: "Verified association member" },
  { value: "organizer", label: "Organizer", description: "Can create and manage their own events" },
  { value: "moderator", label: "Moderator", description: "Can manage all events, cannot manage users" },
  { value: "admin", label: "Admin", description: "Full access including user management" },
];

const ROLE_BADGE: Record<UserRole, { variant: "default" | "secondary" | "outline" | "destructive"; icon?: React.ReactNode }> = {
  user: { variant: "secondary" },
  member: { variant: "outline" },
  organizer: { variant: "default" },
  moderator: { variant: "default" },
  admin: { variant: "destructive" },
};

export default function AdminUsersPage() {
  const { profile } = useSession();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null); // userId being saved
  const [saveError, setSaveError] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(({ users: data }) => setUsers(data || []))
      .catch((err) => setError(err.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setSaving(userId);
    setSaveError((prev) => ({ ...prev, [userId]: "" }));
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      setSaveError((prev) => ({ ...prev, [userId]: err.message }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage user roles and permissions
        </p>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map((r) => (
          <div key={r.value} className="border rounded-lg p-3 text-sm space-y-1">
            <div className="font-medium">{r.label}</div>
            <div className="text-xs text-muted-foreground">{r.description}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === profile?.id;
                const badgeProps = ROLE_BADGE[u.role] ?? { variant: "secondary" as const };
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.displayName}
                      {isSelf && (
                        <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isSelf ? (
                          // Can't change your own role
                          <Badge variant={badgeProps.variant}>
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(val) => handleRoleChange(u.id, val as UserRole)}
                            disabled={saving === u.id}
                          >
                            <SelectTrigger className="w-36 h-8 text-sm">
                              {saving === u.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {saveError[u.id] && (
                          <span className="text-xs text-destructive">{saveError[u.id]}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

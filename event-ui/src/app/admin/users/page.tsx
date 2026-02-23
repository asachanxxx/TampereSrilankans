"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type EditState = { userId: string; displayName: string; role: UserRole };

export default function AdminUsersPage() {
  const { profile } = useSession();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<UserRole | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(({ users: data }) => setUsers(data || []))
      .catch((err) => setError(err.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (u: AppUser) =>
    setEditState({ userId: u.id, displayName: u.displayName, role: u.role });

  const handleSave = async () => {
    if (!editState) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editState.userId,
          displayName: editState.displayName,
          role: editState.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editState.userId
            ? { ...u, displayName: editState.displayName, role: editState.role }
            : u
        )
      );
      setEditState(null);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = activeFilter ? users.filter((u) => u.role === activeFilter) : users;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
      </div>

      {/* Role filter pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r.value).length;
          const isActive = activeFilter === r.value;
          return (
            <button
              key={r.value}
              onClick={() => setActiveFilter(isActive ? null : r.value)}
              className={[
                "text-left border rounded-lg p-3 text-sm space-y-1 transition-colors",
                isActive
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary/50 hover:bg-muted/50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.label}</span>
                <Badge variant={ROLE_BADGE[r.value].variant} className="text-xs">
                  {count}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{r.description}</div>
            </button>
          );
        })}
      </div>

      {activeFilter && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing <span className="font-medium text-foreground">{filtered.length}</span> {ROLES.find(r => r.value === activeFilter)?.label} users</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setActiveFilter(null)}>
            Clear filter
          </Button>
        </div>
      )}

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
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
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
                      <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
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
                        <Badge variant={badgeProps.variant}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(u)}
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editState} onOpenChange={(open) => { if (!open) { setEditState(null); setSaveError(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          {editState && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={editState.displayName}
                  onChange={(e) => setEditState((s) => s ? { ...s, displayName: e.target.value } : s)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-role">Role</Label>
                {editState.userId === profile?.id ? (
                  <p className="text-sm text-muted-foreground py-1">You cannot change your own role.</p>
                ) : (
                  <Select
                    value={editState.role}
                    onValueChange={(val) => setEditState((s) => s ? { ...s, role: val as UserRole } : s)}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label} — {r.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditState(null); setSaveError(""); }} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

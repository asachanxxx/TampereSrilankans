"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Lock, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/state/session";
import type { UserRole } from "@/models/user";

interface Permission {
  id: string;
  category: string;
  description: string;
}

type RolePermissionsMap = Record<string, string[]>; // role → permissionId[]

const ROLES: { value: UserRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "member", label: "Member" },
  { value: "organizer", label: "Organizer" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
];

const ROLE_BADGE_VARIANT: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
  user: "secondary",
  member: "outline",
  organizer: "default",
  moderator: "default",
  admin: "destructive",
};

function groupByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});
}

export default function AdminPermissionsPage() {
  const { profile } = useSession();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  /** Key: `${role}::${permId}` → toggling */
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [toggleError, setToggleError] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/permissions");
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to load permissions");
      }
      const json = await res.json();
      setPermissions(json.permissions ?? []);
      setRolePermissions(json.rolePermissions ?? {});
    } catch (err: any) {
      setError(err.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isGranted = (role: UserRole, permId: string): boolean =>
    (rolePermissions[role] ?? []).includes(permId);

  const handleToggle = async (role: UserRole, permId: string) => {
    const key = `${role}::${permId}`;
    const grant = !isGranted(role, permId);

    setToggling((prev) => new Set(prev).add(key));
    setToggleError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    // Optimistic update
    setRolePermissions((prev) => {
      const existing = prev[role] ?? [];
      if (grant) {
        return { ...prev, [role]: [...existing, permId] };
      } else {
        return { ...prev, [role]: existing.filter((p) => p !== permId) };
      }
    });

    try {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permissionId: permId, grant }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Update failed");
      }
    } catch (err: any) {
      // Revert optimistic update on error
      setRolePermissions((prev) => {
        const existing = prev[role] ?? [];
        if (grant) {
          return { ...prev, [role]: existing.filter((p) => p !== permId) };
        } else {
          return { ...prev, [role]: [...existing, permId] };
        }
      });
      setToggleError((prev) => ({ ...prev, [key]: err.message || "Failed" }));
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  const grouped = groupByCategory(permissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Lock className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Role Permissions</h1>
          <p className="text-sm text-muted-foreground">
            Click a checkbox to grant or revoke a permission for a role. Changes take effect immediately.
          </p>
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-64">
                Permission
              </th>
              {ROLES.map((r) => (
                <th key={r.value} className="px-3 py-3 text-center whitespace-nowrap">
                  <Badge variant={ROLE_BADGE_VARIANT[r.value]} className="text-xs">
                    {r.label}
                  </Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([category, perms]) => (
              <>
                {/* Category header row */}
                <tr key={`cat-${category}`} className="bg-muted/30">
                  <td
                    colSpan={ROLES.length + 1}
                    className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {category}
                  </td>
                </tr>

                {/* Permission rows */}
                {perms.map((perm) => (
                  <tr key={perm.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{perm.id}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </td>
                    {ROLES.map((r) => {
                      const key = `${r.value}::${perm.id}`;
                      const granted = isGranted(r.value, perm.id);
                      const busy = toggling.has(key);
                      const errMsg = toggleError[key];

                      return (
                        <td key={r.value} className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleToggle(r.value, perm.id)}
                            disabled={busy}
                            title={errMsg ?? (granted ? `Revoke from ${r.label}` : `Grant to ${r.label}`)}
                            className={[
                              "inline-flex items-center justify-center rounded cursor-pointer transition-opacity",
                              busy ? "opacity-40 cursor-not-allowed" : "hover:opacity-80",
                              errMsg ? "text-destructive" : granted ? "text-primary" : "text-muted-foreground/40",
                            ].join(" ")}
                          >
                            {busy ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : errMsg ? (
                              <AlertTriangle className="h-5 w-5" />
                            ) : granted ? (
                              <CheckSquare className="h-5 w-5" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <p className="text-xs text-muted-foreground">
        Note: Changes to the <span className="font-semibold">admin</span> role permission cache refresh within 5 minutes.
        Role hierarchy enforced in code — admins always have full access regardless of this table.
      </p>
    </div>
  );
}

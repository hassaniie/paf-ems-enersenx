"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRoundCog,
  UserX,
  X,
} from "lucide-react";
import { useShell, type UserRole } from "@/components/layout/shell-context";
import {
  MetricRibbon,
  type MetricRibbonItem,
} from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CURRENT_USER_ID,
  type ManagedUser,
  type UserStatus,
} from "@/data/client/user-repository";
import { useOrganization } from "@/features/organization/organization-provider";
import { cn } from "@/lib/cn";
import { useUsers } from "./user-provider";

type UserFilter = "all" | UserStatus | UserRole;
const ROLES: UserRole[] = ["Admin", "Commander", "Operator", "Viewer"];

export function UsersWorkspace() {
  const { role } = useShell();
  const { store, ready, save, setStatus, remove } = useUsers();
  const { store: organization } = useOrganization();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(CURRENT_USER_ID);
  const [editor, setEditor] = useState<ManagedUser | "new" | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(
    null,
  );
  const nodes = useMemo(
    () => new Map(organization.nodes.map((node) => [node.id, node.name])),
    [organization.nodes],
  );
  const users = useMemo(
    () =>
      store.users.filter((user) => {
        const matchesQuery =
          `${user.name} ${user.email} ${user.serviceNumber ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesFilter =
          filter === "all" || user.status === filter || user.role === filter;
        return matchesQuery && matchesFilter;
      }),
    [filter, query, store.users],
  );
  const selected = store.users.find((user) => user.id === selectedId);
  const notify = (text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast(null), 3000);
  };

  if (role !== "Admin") return <AccessDenied role={role} />;
  if (!ready)
    return (
      <div className="users-loading">
        <div />
        <div />
        <div />
      </div>
    );

  const metrics: MetricRibbonItem[] = [
    {
      label: "Total users",
      value: String(store.users.length),
      note: "Across PAF Lahore",
      tone: "neutral",
    },
    {
      label: "Active",
      value: String(
        store.users.filter((user) => user.status === "active").length,
      ),
      note: "Can currently sign in",
      tone: "good",
    },
    {
      label: "Invitations",
      value: String(
        store.users.filter((user) => user.status === "invited").length,
      ),
      note: "Awaiting activation",
      tone: "info",
    },
    {
      label: "Suspended",
      value: String(
        store.users.filter((user) => user.status === "suspended").length,
      ),
      note: "Access blocked",
      tone: "warning",
    },
    {
      label: "Administrators",
      value: String(
        store.users.filter(
          (user) => user.role === "Admin" && user.status === "active",
        ).length,
      ),
      note: "Full-control accounts",
      tone: "neutral",
    },
  ];

  const perform = (action: () => void, success: string) => {
    try {
      action();
      notify(success);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "The action could not be completed.",
        true,
      );
    }
  };

  return (
    <div className="users-page mx-auto max-w-[1680px]">
      <section className="users-heading">
        <div>
          <div className="users-eyebrow">
            <ShieldCheck /> Identity & access
          </div>
          <h1>Control who can see and operate the energy network.</h1>
          <p>
            Manage roles, account states and operational access without
            weakening command accountability.
          </p>
        </div>
        <Button onClick={() => setEditor("new")}>
          <Plus /> Invite user
        </Button>
      </section>
      <MetricRibbon items={metrics} label="Access summary" />

      <div className="users-layout">
        <Card className="users-directory">
          <div className="users-toolbar">
            <label className="users-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email or service number"
              />
            </label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as UserFilter)}
              aria-label="Filter users"
            >
              <option value="all">All users</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {item} role
                </option>
              ))}
            </select>
          </div>
          <div className="users-table-head">
            <span>User</span>
            <span>Role</span>
            <span>Access</span>
            <span>Status</span>
            <span>Last activity</span>
            <span />
          </div>
          <div className="users-table-body">
            {users.map((user) => (
              <button
                key={user.id}
                className={cn("user-row", selectedId === user.id && "selected")}
                onClick={() => setSelectedId(user.id)}
              >
                <span className="user-identity">
                  <i>{initials(user.name)}</i>
                  <span>
                    <strong>
                      {user.name}
                      {user.id === CURRENT_USER_ID ? <small>You</small> : null}
                    </strong>
                    <small>{user.email}</small>
                  </span>
                </span>
                <span>
                  <RoleBadge role={user.role} />
                </span>
                <span className="user-access">
                  {user.access.allSites
                    ? "All sites"
                    : `${user.access.nodeIds.length} area${user.access.nodeIds.length === 1 ? "" : "s"}`}
                </span>
                <span>
                  <StatusBadge status={user.status} />
                </span>
                <span className="user-last-active">{activityLabel(user)}</span>
                <span>
                  <MoreHorizontal />
                </span>
              </button>
            ))}
            {!users.length ? (
              <div className="users-empty">
                <Search />
                <strong>No users found</strong>
                <span>Try changing the search or account filter.</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        {selected ? (
          <UserInspector
            user={selected}
            nodeNames={nodes}
            events={store.events.filter(
              (event) => event.userId === selected.id,
            )}
            onEdit={() => setEditor(selected)}
            onStatus={(status) =>
              perform(
                () => setStatus(selected.id, status),
                status === "active" ? "User reactivated." : "User suspended.",
              )
            }
            onRemove={() => {
              if (window.confirm(`Remove ${selected.name} from EnersenX?`))
                perform(() => {
                  remove(selected.id);
                  setSelectedId(null);
                }, "User removed.");
            }}
          />
        ) : (
          <Card className="user-selection-empty">
            <UserRoundCog />
            <strong>Select a user</strong>
            <p>Review identity, scope, role and recent access changes.</p>
          </Card>
        )}
      </div>

      {editor ? (
        <UserEditor
          existing={editor === "new" ? undefined : editor}
          nodes={organization.nodes.filter((node) => node.id !== "lahore-site")}
          onClose={() => setEditor(null)}
          onSave={(user) => {
            try {
              save(user);
              setEditor(null);
              setSelectedId(user.id);
              notify(
                editor === "new"
                  ? "Invitation created."
                  : "User access updated.",
              );
            } catch (error) {
              throw error;
            }
          }}
        />
      ) : null}
      {toast ? (
        <div
          className={cn(
            "organization-toast",
            toast.error ? "error" : "success",
          )}
        >
          {toast.error ? <X /> : <Check />}
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}

function AccessDenied({ role }: { role: UserRole }) {
  return (
    <Card className="users-denied">
      <span>
        <LockKeyhole />
      </span>
      <Badge tone="var(--sev-critical)">Admin only</Badge>
      <h1>Access management is restricted.</h1>
      <p>
        You are viewing EnersenX as {role}. Only an administrator can manage
        user identities, roles and operational scopes.
      </p>
      <small>Use the account menu to switch to the Admin preview role.</small>
    </Card>
  );
}

function UserInspector({
  user,
  nodeNames,
  events,
  onEdit,
  onStatus,
  onRemove,
}: {
  user: ManagedUser;
  nodeNames: Map<string, string>;
  events: { id: string; action: string; detail: string; at: string }[];
  onEdit: () => void;
  onStatus: (status: "active" | "suspended") => void;
  onRemove: () => void;
}) {
  return (
    <aside className="user-inspector">
      <header>
        <div className="user-avatar-large">{initials(user.name)}</div>
        <div>
          <span>Account detail</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <StatusBadge status={user.status} />
      </header>
      <section className="user-detail-grid">
        <div>
          <ShieldCheck />
          <span>Role</span>
          <strong>{user.role}</strong>
        </div>
        <div>
          <KeyRound />
          <span>Service number</span>
          <strong>{user.serviceNumber ?? "Not provided"}</strong>
        </div>
        <div>
          <Clock3 />
          <span>Last activity</span>
          <strong>{activityLabel(user)}</strong>
        </div>
        <div>
          <Mail />
          <span>Account state</span>
          <strong>
            {user.status === "invited" ? "Invite pending" : user.status}
          </strong>
        </div>
      </section>
      <section className="user-scope">
        <div>
          <span>Operational access</span>
          <small>{user.access.allSites ? "Unrestricted" : "Scoped"}</small>
        </div>
        {user.access.allSites ? (
          <p>
            <ShieldCheck /> All sites, areas and connected assets
          </p>
        ) : (
          <div className="user-scope-list">
            {user.access.nodeIds.map((id) => (
              <Badge key={id} tone="var(--accent)">
                {nodeNames.get(id) ?? id}
              </Badge>
            ))}
          </div>
        )}
      </section>
      <section className="user-history">
        <div>
          <span>Recent access activity</span>
          <small>{events.length} events</small>
        </div>
        {events.length ? (
          events.slice(0, 5).map((event) => (
            <article key={event.id}>
              <i />
              <span>
                <strong>{event.action}</strong>
                <small>{event.detail}</small>
              </span>
            </article>
          ))
        ) : (
          <p>No access changes recorded in this session.</p>
        )}
      </section>
      <footer>
        <Button variant="outline" onClick={onEdit}>
          <Pencil /> Edit access
        </Button>
        {user.id !== CURRENT_USER_ID ? (
          <>
            {user.status === "suspended" ? (
              <Button onClick={() => onStatus("active")}>
                <UserCheck /> Reactivate
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => onStatus("suspended")}>
                <UserX /> Suspend
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-critical"
              onClick={onRemove}
            >
              <Trash2 /> Remove
            </Button>
          </>
        ) : (
          <Badge tone="var(--status-online)">
            <ShieldCheck /> Protected account
          </Badge>
        )}
      </footer>
    </aside>
  );
}

function UserEditor({
  existing,
  nodes,
  onClose,
  onSave,
}: {
  existing?: ManagedUser;
  nodes: { id: string; name: string }[];
  onClose: () => void;
  onSave: (user: ManagedUser) => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [serviceNumber, setServiceNumber] = useState(
    existing?.serviceNumber ?? "",
  );
  const [role, setRole] = useState<UserRole>(existing?.role ?? "Viewer");
  const [allSites, setAllSites] = useState(existing?.access.allSites ?? false);
  const [nodeIds, setNodeIds] = useState<string[]>(
    existing?.access.nodeIds ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    try {
      onSave({
        id: existing?.id ?? `user-${Date.now()}`,
        name,
        email,
        serviceNumber,
        role,
        status: existing?.status ?? "invited",
        access: { allSites, nodeIds: allSites ? [] : nodeIds },
        lastActiveAt: existing?.lastActiveAt,
        invitedAt: existing?.invitedAt ?? new Date().toISOString(),
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save user.",
      );
    }
  };
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="user-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-editor-title"
      >
        <header>
          <div>
            <span>{existing ? "Edit access" : "New invitation"}</span>
            <h2 id="user-editor-title">
              {existing ? existing.name : "Invite a user"}
            </h2>
            <p>Assign the minimum access required for this person’s duties.</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>
        <div className="user-editor-body">
          <div className="user-form-grid">
            <label>
              <span>Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Flight Lt. Ahmed"
              />
            </label>
            <label>
              <span>PAF email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@paf.mil.pk"
              />
            </label>
            <label>
              <span>
                Service number <small>Optional</small>
              </span>
              <input
                value={serviceNumber}
                onChange={(event) => setServiceNumber(event.target.value)}
                placeholder="PAF-00000"
              />
            </label>
            <label>
              <span>System role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
              >
                {ROLES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <section className="role-guidance">
            <strong>{role}</strong>
            <p>{roleDescription(role)}</p>
          </section>
          <section className="access-picker">
            <div>
              <span>Operational scope</span>
              <small>
                Controls which hierarchy branches this user can access.
              </small>
            </div>
            <label className="access-all">
              <input
                type="checkbox"
                checked={allSites}
                onChange={(event) => setAllSites(event.target.checked)}
              />
              <span>
                <strong>All-site access</strong>
                <small>Includes every current and future area.</small>
              </span>
            </label>
            {!allSites ? (
              <div className="access-node-grid">
                {nodes.map((node) => (
                  <label key={node.id}>
                    <input
                      type="checkbox"
                      checked={nodeIds.includes(node.id)}
                      onChange={() =>
                        setNodeIds((current) =>
                          current.includes(node.id)
                            ? current.filter((id) => id !== node.id)
                            : [...current, node.id],
                        )
                      }
                    />
                    <span>{node.name}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </section>
          {error ? (
            <div className="user-form-error">
              <X />
              {error}
            </div>
          ) : null}
        </div>
        <footer>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {existing ? <Check /> : <Mail />}
            {existing ? "Save changes" : "Send invitation"}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const tone =
    role === "Admin"
      ? "var(--accent)"
      : role === "Commander"
        ? "var(--status-online)"
        : role === "Operator"
          ? "var(--sev-warning)"
          : "var(--text-tertiary)";
  return <Badge tone={tone}>{role}</Badge>;
}
function StatusBadge({ status }: { status: UserStatus }) {
  const tone =
    status === "active"
      ? "var(--status-online)"
      : status === "invited"
        ? "var(--accent)"
        : "var(--sev-critical)";
  return (
    <Badge tone={tone}>
      <i className="status-dot" />
      {status}
    </Badge>
  );
}
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
function activityLabel(user: ManagedUser) {
  if (user.status === "invited") return "Invite pending";
  if (!user.lastActiveAt) return "Never";
  const date = new Date(user.lastActiveAt);
  return (
    date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
    " · " +
    date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
  );
}
function roleDescription(role: UserRole) {
  return (
    {
      Admin:
        "Full system administration, user management and operational control.",
      Commander:
        "Command visibility, quota approvals, reporting and alarm response.",
      Operator:
        "Operate assigned assets, handle alarms and monitor electrical health.",
      Viewer: "Read-only visibility for assigned sites and dashboards.",
    } as Record<UserRole, string>
  )[role];
}
